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

    const attractionsTableQuery = `CREATE TABLE IF NOT EXISTS attractions (
      id SERIAL PRIMARY KEY,
      name VARCHAR NOT NULL,
      waitTime float
      );`;
    await client.query(attractionsTableQuery);

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
  }
  client.release();
}

async function populateAttractionsTablesIfEmpty() {
  const pool = new pg.Pool({
    connectionString: `postgres://${username}:${password}@${host}/${dbName}`,
  });
  const client = await pool.connect();
  try {
    const resB = await client.query("SELECT count(*) FROM attractions");
    const nbAttractions = parseInt(resB.rows[0].count, 10);

    await client.query("BEGIN");

    if (nbAttractions === 0) {
      const attractionNames = ["Eiffel Tower", "The Louvre", "Arc de Triomphe"];
      const queryAttractions = "INSERT INTO attractions(name) VALUES ($1)";
      for (const attractionName of attractionNames) {
        await client.query(queryAttractions, [attractionName]);
      }
    } else {
      console.log("Attractions table already populated");
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
  populateAttractionsTablesIfEmpty,
  updateGeomProjection,
  query,
};
