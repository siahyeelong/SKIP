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
        }
 */
mqttClient.on('message', async (topic, message) => {
    try {
        const jsonMessage = JSON.parse(message.toString());
        jsonMessage.timestamp = new Date().toISOString();

        if (!jsonMessage.attraction_id || !jsonMessage.rate || !jsonMessage.distance) {
            console.error(chalk.red('Invalid message format:', jsonMessage));
            return;
        }

        const waitTime = Math.floor(jsonMessage.distance / jsonMessage.rate);

        console.log(chalk.yellow(`Received message: ${JSON.stringify(jsonMessage)}`));
        await query('INSERT INTO measurements (attraction_id, waittime) VALUES ($1, $2)', [jsonMessage.attraction_id, waitTime]);
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