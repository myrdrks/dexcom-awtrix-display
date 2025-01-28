# Node.js Dexcom Integration Application

This application integrates with the Dexcom API to fetch glucose monitoring data and publishes it to an MQTT broker. It also provides a QR code for authentication when required.

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

## Setup

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd nodejs-docker-app
   ```

2. **Create a `.env` File**
   Create a `.env` file in the project root and define the following variables:
   ```env
   CLIENT_ID=your_client_id
   CLIENT_SECRET=your_client_secret
   CALLBACK_URL=http://localhost:3000/dexcom
   MQTT_USERNAME=your_mqtt_username
   MQTT_PASSWORD=your_mqtt_password
   MQTT_TOPIC=your_mqtt_topic
   MQTT_BROKER_URL=mqtt://your_mqtt_broker
   SANDBOX=true
   DISPLAY_QR_CODE=true
   ```

3. **Run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

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
| `MQTT_TOPIC`      | Topic where data will be published                       |
| `MQTT_BROKER_URL` | MQTT broker URL                                          |
| `SANDBOX`         | Use Dexcom sandbox environment (`true` or `false`)       |
| `DISPLAY_QR_CODE` | Display QR code for authentication (`true` or `false`)   |

## Usage

1. Open the app using `docker-compose up`.
2. Authenticate via the displayed QR code or authorization URL.
3. The application fetches data periodically and publishes it to the MQTT topic.

## Deployment

The app is fully Dockerized and can be deployed using any container orchestration tool or directly on a server using Docker Compose.

## License

This project is licensed under the GNU General Public License v3.0. See the `LICENSE` file for details.
