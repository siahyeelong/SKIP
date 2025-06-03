/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import pg from "pg";

import "dotenv/config";
var username = process.env.PG_USERNAME;
var password = process.env.PG_PASSWORD;
var host = process.env.PG_HOST;
var dbName = process.env.PG_DB_NAME;

async function addPostgisToDb() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    const postGisExtension = `CREATE EXTENSION postgis;
    CREATE EXTENSION postgis_raster;
    CREATE EXTENSION postgis_topology;
    CREATE EXTENSION postgis_sfcgal;
    CREATE EXTENSION fuzzystrmatch;
    CREATE EXTENSION address_standardizer;
    CREATE EXTENSION address_standardizer_data_us;
    CREATE EXTENSION postgis_tiger_geocoder;`;
    await client.query(postGisExtension);
  } catch (e) {
    if (e.code === "42710") {
      console.log(
        "Database already has the postgis extention, activation is skipped."
      );
    } else {
      console.log(e);
    }
  }
  client.release();
}

async function dropTables() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let dropTablesQuery = `DROP TABLE IF EXISTS attractions CASCADE; `;
    await client.query(dropTablesQuery);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  }
  client.release();
}

async function createTables() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const buildingsTableQuery = `CREATE TABLE IF NOT EXISTS buildings (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      geom geometry('POLYGON',4326,2)
      );`;
    await client.query(buildingsTableQuery);

    const roomsTableQuery = `CREATE TABLE IF NOT EXISTS rooms (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      capacity INTEGER NOT NULL,
      building_id INTEGER NOT NULL,
      geom GEOMETRY('POLYGON',4326,2),
      CONSTRAINT fk_rooms
      FOREIGN KEY(building_id) 
      REFERENCES buildings(id)
      );`;
    await client.query(roomsTableQuery);

    const sensorTableQuery = `CREATE TABLE IF NOT EXISTS sensors(
    id SERIAL PRIMARY KEY,
    room_id INTEGER NOT NULL,
    name VARCHAR NOT NULL,
    temperature FLOAT,
    FOREIGN KEY(room_id)
    REFERENCES rooms(id)
    );`;
    await client.query(sensorTableQuery);

    const measurementsTableQuery = `CREATE TABLE IF NOT EXISTS measurements(
    entry_num SERIAL PRIMARY KEY,
    sensor_id INTEGER NOT NULL,
    value INTEGER NOT NULL,
    timestamp DATE NOT NULL,
    FOREIGN KEY(sensor_id)
    REFERENCES sensors(id)
    );`;
    await client.query(measurementsTableQuery);

    // new devices table
    const devicesTableQuery = `CREATE TABLE IF NOT EXISTS devices(
    id SERIAL PRIMARY KEY,
    type TEXT NOT NULL,
    geom GEOMETRY(POINT, 4326),
    status TEXT
    );`;
    await client.query(devicesTableQuery);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  }
  client.release();
}

async function populateRoomsAndBuildingsTablesIfEmpty() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    const resB = await client.query("SELECT count(*) FROM buildings");
    const nbBuildings = parseInt(resB.rows[0].count, 10);

    const resR = await client.query("SELECT count(*) FROM rooms");
    const nbRooms = parseInt(resR.rows[0].count, 10);

    await client.query("BEGIN");

    if (nbBuildings === 0) {
      const buildingsNames = ["INSA Library", "INSA CS", "INSA ECE"];
      const queryBuildings = "INSERT INTO buildings(name) VALUES ($1)";
      for (const buildingName of buildingsNames) {
        await client.query(queryBuildings, [buildingName]);
      }
    } else {
      console.log("Buildings table already populated");
    }

    if (nbRooms === 0) {
      const rooms = [
        { name: "Amphitheatre", capacity: 140, building_id: 2 },
        { name: "Laboratory", capacity: 25, building_id: 2 },
        { name: "Classroom 1", capacity: 25, building_id: 2 },
      ];
      const queryRooms =
        "INSERT INTO rooms(name, capacity, building_id) VALUES ($1,$2,$3)";
      for (const room of rooms) {
        await client.query(queryRooms, [
          room.name,
          room.capacity,
          room.building_id,
        ]);
      }
    } else {
      console.log("Rooms table already populated");
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  }
  client.release();
}

async function updateGeomProjection() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const tables = ["buildings", "rooms", "devices"];
    for (const table of tables) {
      const queryText = "SELECT UpdateGeometrySRID($1,'geom',4326)";
      await client.query(queryText, [table]);
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  }
  client.release();
}

async function query(text, params) {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log("executed query", { text, duration, rows: res.rowCount });
  return res;
}

export {
  addPostgisToDb,
  createTables,
  dropTables,
  populateRoomsAndBuildingsTablesIfEmpty,
  updateGeomProjection,
  query,
};
