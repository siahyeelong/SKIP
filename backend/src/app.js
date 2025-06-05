import express from "express";
import chalk from "chalk";
import {
  addPostgisToDb,
  createTables,
  dropTables,
  populateAttractionsTablesIfEmpty,
} from "./db/db_manager.js";
import routes from "./routes/index.js";
import mqttClient from './mqtt/mqtt_client.js';

const app = express();

app.use(express.static('../frontend'))

app.use(express.json());

async function init() {
  await addPostgisToDb();
  if (false) {
    await dropTables();
  } else {
    await createTables();
    await populateAttractionsTablesIfEmpty();
    routes(app);
  }
}

init();

const PORT = process.env.PG_PORT || 3004;

app.listen(PORT, () => {
  console.log(chalk.green(`SKIP's backend running on ${PORT}!`));
});
