import express from "express";
import chalk from "chalk";
import {
  addPostgisToDb,
  createTables,
  dropTables,
  populateRoomsAndBuildingsTablesIfEmpty,
} from "./db/db_manager.js";
import routes from "./routes/index.js";

const app = express();

//app.use(express.static('../frontend'))

app.use(express.json());

async function init() {
  //await addPostgisToDb();
  if (false) {
    //await dropTables();
  } else {
    //await createTables();
    //await populateRoomsAndBuildingsTablesIfEmpty();
    routes(app);
  }
}

init();

const PORT = process.env.PG_PORT || 3001;

app.listen(PORT, () => {
  console.log(chalk.green(`SKIP's backend running on ${PORT}!`));
});
