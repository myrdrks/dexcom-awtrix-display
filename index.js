require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mqtt = require('mqtt');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const qrcode = require('qrcode');

const app = express();
const port = 3000;

// Globale Variablen aus .env
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const callbackUrl = process.env.CALLBACK_URL;
const mqttUsername = process.env.MQTT_USERNAME;
const mqttPassword = process.env.MQTT_PASSWORD;
const mqttTopics = process.env.MQTT_TOPICS.split(',');
const awtrixSettings = process.env.AWTRIX_SETTINGS;
const isSandbox = process.env.SANDBOX === 'true';
const displayQrCode = process.env.DISPLAY_QR_CODE === 'true';
const updateInterval = (parseInt(process.env.UPDATE_INTERVAL) || 60) * 1000;
const dexcomBaseUrl = isSandbox ? 'https://sandbox-api.dexcom.com' : 'https://api.dexcom.com';

// Token-Speicherpfad
const tokenFilePath = path.resolve(__dirname, 'data', 'tokens.json');
let accessToken = "";
let refreshToken = "";

// Tokens aus Datei laden
function loadTokens() {
    if (fs.existsSync(tokenFilePath)) {
        const tokenData = JSON.parse(fs.readFileSync(tokenFilePath, 'utf8'));
        accessToken = tokenData.accessToken || "";
        refreshToken = tokenData.refreshToken || "";
        console.log('Tokens loaded from file');
    }
}

// Tokens in Datei speichern
function saveTokens() {
    const tokenData = {
        accessToken,
        refreshToken
    };
    fs.writeFileSync(tokenFilePath, JSON.stringify(tokenData, null, 2));
    console.log('Tokens saved to file');
}

// MQTT-Client-Einrichtung mit Anmeldedaten
const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
    username: mqttUsername,
    password: mqttPassword
});

mqttClient.on('connect', () => {
    console.log('Connected to MQTT broker');
    if(awtrixSettings && awtrixSettings.length) {
        console.log('Setting Awtrix settings from .env');
        mqttTopics.forEach(topic => {
            mqttClient.publish(topic.split('/')[0] + '/settings', awtrixSettings);
        });
    }
});

mqttClient.on('error', (error) => {
    console.error('MQTT connection error:', error);
});

mqttClient.on('offline', () => {
    console.error('MQTT client is offline');
});

// Funktion zur Aktualisierung des Access Tokens
async function refreshAccessToken() {
    if (!refreshToken) {
        console.error('No refresh token available');
        return;
    }

    try {
        const formData = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
            client_id: clientId,
            client_secret: clientSecret
        };

        const response = await axios.post(`${dexcomBaseUrl}/v2/oauth2/token`, new URLSearchParams(formData).toString(), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        saveTokens();
        console.log('Access token refreshed');
    } catch (error) {
        console.error('Error refreshing access token:', error);
    }
}

// Funktion zur Initialisierung der Authentifizierung
async function initializeAuth() {
    if (!accessToken) {
        const state = Math.random().toString(36).substring(7); // Zufälliger State-Wert
        const authUrl = `${dexcomBaseUrl}/v2/oauth2/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&response_type=code&scope=offline_access&state=${state}`;
        console.log(`Authorization URL: ${authUrl}`);

        if (displayQrCode) {
            qrcode.toString(authUrl, { type: 'terminal', small: true }, (err, qrCode) => {
                if (err) {
                    console.error('Error generating QR code:', err);
                } else {
                    console.log('Scan this QR code to authenticate:');
                    console.log(qrCode);
                }
            });
        } else {
            exec(`open "${authUrl}"`, (error) => {
                if (error) {
                    console.error('Failed to open URL:', error);
                }
            });
        }
    }
}

// HTTP-Endpunkt zur Authentifizierung
app.get('/dexcom', async (req, res) => {
    const code = req.query.code;

    if (!code) {
        return res.status(400).send('Authorization code is required');
    }

    try {
        const response = await axios.post(`${dexcomBaseUrl}/v2/oauth2/token`, {
            client_id: clientId,
            client_secret: clientSecret,
            grant_type: 'authorization_code',
            redirect_uri: callbackUrl,
            code
          }, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
        });

        accessToken = response.data.access_token;
        refreshToken = response.data.refresh_token;
        saveTokens();

        res.status(200).send('Token received and stored');
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).send('Error fetching token');
    }
});

// Periodische API-Anfrage
setInterval(async () => {
    if (!accessToken) {
        console.log('No access token available, initializing authentication...');
        await initializeAuth();
        return;
    }

    try {
        const response = await axios.get(`${dexcomBaseUrl}/v2/users/self/dataRange`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const endDate = response.data.egvs.end.systemTime;
        const formatDate = (date) => date.toISOString().split('.')[0];
        const endDateObj = new Date(endDate);
        const startDateObj = new Date(endDateObj.getTime() - 2 * 60 * 60 * 1000);
        const startDate = formatDate(startDateObj);

        const url = `${dexcomBaseUrl}/v3/users/self/egvs?startDate=${startDate}&endDate=${endDate}`;

        const actualValuesResponse = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });

        const { value } = actualValuesResponse.data.records[0];
        let color;
        
        if (value >= 0 && value <= 55) {
            color = '#FF0000'; // Red
        } else if (value >= 56 && value <= 79) {
            color = '#FFA500'; // Orange
        } else if (value >= 80 && value <= 120) {
            color = '#008000'; // Green
        } else if (value >= 121 && value <= 159) {
            color = '#FFA500'; // Orange
        } else if (value >= 160) {
            color = '#FF0000'; // Red
        }
        const payload = {
            text: value,
            icon: process.env.ICON,
            color,
        };

        mqttTopics.forEach(topic => {
            mqttClient.publish(topic, JSON.stringify(payload));
            console.log(`Published ${JSON.stringify(payload)} to ${topic}`);
        })
    } catch (error) {
        if (error.response && error.response.status === 401) {
            console.log('Access token expired, refreshing...');
            await refreshAccessToken();
        } else {
            console.error('Error fetching Dexcom data:', error);
        }
    }
}, updateInterval);

// Server starten
app.listen(port, () => {
    console.log(`Publishing values every ${updateInterval / 1000} seconds to ${mqttTopics.join(', ')}`);
    loadTokens();
    initializeAuth();
    console.log(`Dexcom bridge running in ${isSandbox ? "Sandbox" : "Production"}mode!`);
});