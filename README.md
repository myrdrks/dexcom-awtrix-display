# Node.js Dexcom Integration Application for Awtrix 3

This application integrates with the Dexcom API to fetch glucose monitoring data and publishes it to an MQTT broker to display the values on a Ulanzi TC001 with Awtrix 3 firmware.

## Features

- Fetches glucose monitoring data from Dexcom API.
- Publishes data to an MQTT broker.
- Provides OAuth2 authentication with support for QR code display.
- Dockerized for easy deployment.

## Prerequisites

- Node.js (if running outside Docker)
- Docker and Docker Compose
- Dexcom Developer Account
- MQTT Broker
- Ulanzi TC001 pixel clock

## Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/myrdrks/dexcom-awtrix-display
   cd dexcom-awtrix-display
   ```

2. **Copy `example.env` file**
   to `.env` in the project root and update all relevant variables.

3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

Full documentation in the [Wiki](https://github.com/myrdrks/dexcom-awtrix-display/wiki)

## Endpoints

- **GET /dexcom**: Callback endpoint for OAuth2 authentication.

## Environment Variables

| Variable          | Description                                              |
|-------------------|----------------------------------------------------------|
| `CLIENT_ID`       | Dexcom API Client ID                                     |
| `CLIENT_SECRET`   | Dexcom API Client Secret                                 |
| `CALLBACK_URL`    | URL to handle Dexcom OAuth2 callback                     |
| `MQTT_USERNAME`   | MQTT broker username                                     |
| `MQTT_PASSWORD`   | MQTT broker password                                     |
| `MQTT_TOPICS`     | Topics where data will be published (comma separated)    |
| `MQTT_BROKER_URL` | MQTT broker URL                                          |
| `SANDBOX`         | Use Dexcom sandbox environment (`true` or `false`)       |
| `DISPLAY_QR_CODE` | Display QR code for authentication (`true` or `false`)   |
| `UPDATE_INTERVAL` | Interval in seconds the app checks for new values        |
| `ICON`            | Icon to display on Awtrix                                |
| `AWTRIX_SETTINGS` | Set Awtrix settings JSON                                 |

## Awtrix settings (optional)
To disable Battery, Temperature and Humidity App set the environment variable for AWTRIX_SETTINGS to ``{"HUM": false, "TEMP": false, "BAT": false, "ABRI": true}``

All available settings can be found here: https://blueforcer.github.io/awtrix3/#/api?id=json-properties-1

## Usage

1. Open the app using `docker-compose up`.
2. Authenticate via the displayed QR code or authorization URL.
3. The application fetches data periodically and publishes it to the MQTT topic.

## Deployment

The app is fully Dockerized and can be deployed using any container orchestration tool or directly on a server using Docker Compose.

## License

This project is licensed under the GNU General Public License v3.0. See the `LICENSE` file for details.
