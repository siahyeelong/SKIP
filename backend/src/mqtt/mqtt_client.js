import mqtt from 'mqtt';
import chalk from 'chalk';
import { query } from '../db/db_manager.js';

const mqttURL = process.env.MQTT_URL || 'mqtt://localhost:1883';
const topic = process.env.MQTT_TOPIC || 'skippy/sensors';

const mqttClient = mqtt.connect(mqttURL);

mqttClient.on('connect', () => {
    console.log(chalk.blue('Connected to MQTT broker'));
    mqttClient.subscribe(topic, (err) => {
        if (err) {
            console.error(chalk.red('Error subscribing to topic:', err));
        } else {
            console.log(chalk.green(`Subscribed to topic: ${topic}`));
        }
    });
});

/**
 * Sample MQTT message format:
        {
        "attraction_id": 5,
        "count": 22,
        "distance": 100
        "timestamp": "2025-12-31 23:59:59.999"
        }
 */
mqttClient.on('message', async (topic, message) => {
    try {
        const jsonMessage = JSON.parse(message.toString());

        if (!jsonMessage.attraction_id || !jsonMessage.distance || !jsonMessage.count) {
            console.error(chalk.red('Invalid message format:', jsonMessage));
            return;
        }

        // Sample calculation for wait time
        // Assumes distance is in meters and count is over 15 seconds
        const maxCapacity = 5000; // Maximum capacity of the attraction
        const standingDensity = 5; // Average number of people per meter

        if (jsonMessage.distance > maxCapacity/standingDensity || jsonMessage.count < 1) {
            console.error(chalk.red('Not logging invalid data: distance or count out of bounds:', jsonMessage));
            return;
        }

        const waitTime = Math.ceil((maxCapacity - jsonMessage.distance * standingDensity) / (jsonMessage.count*4));

        console.log(chalk.yellow(`Received message: ${JSON.stringify(jsonMessage)}`));
        let result = await query('INSERT INTO measurements (attraction_id, waittime) VALUES ($1, $2) RETURNING id', [jsonMessage.attraction_id, waitTime]);
        if (jsonMessage.timestamp) {
            await query(`UPDATE measurements SET timestamp = $1 WHERE id = $2`, [jsonMessage.timestamp, result.rows[0].id]);
        }
        console.log(chalk.green(`Wait time inserted into database`));
        await query(`UPDATE attractions SET waittime = $1 WHERE id = $2`, [waitTime, jsonMessage.attraction_id]);
        console.log(chalk.green('Current wait time updated in database'));

    } catch (err) {
        console.error(chalk.red('Failed to parse message:', err));
    }
});

mqttClient.on('error', (err) => {
    console.error(chalk.red('MQTT error:', err));
});

export default mqttClient;