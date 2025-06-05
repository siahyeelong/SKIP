import Router from "express-promise-router";
import { query } from "../db/db_manager.js";

const router = new Router();

// test route
router.get("/test", async (req, res) => {
  res.send("hello bitch");
});

// get all attractions
router.get("/", async (req, res) => {
  const { rows } = await query(
    "SELECT id, name, waitTime, description FROM attractions"
  );
  if (rows.length === 0) {
    return res.status(404).send("No attractions found");
  }
  res.send(rows);
});

// get attraction information by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    "SELECT name, waitTime, description FROM attractions WHERE id = $1", [id]
  );
  if (rows.length === 0) {
    return res.status(404).send("Attraction not found");
  }
  res.send(rows[0]);
});

// get attraction information by name

router.post('/', async (req, res) => {
  const { body } = req;
  if (body.name == undefined) {
    res.sendStatus(400);
    return;
  }
  if (body.description == undefined) {
    await query('INSERT INTO attractions (name) VALUES ($1)', [body.name]);
    res.sendStatus(200);
    return;
  }
  const { rows } = await query('SELECT id FROM attractions WHERE name = $1', [body.name]);
  if (rows.length === 0) {
    await query('INSERT INTO attractions (name,description) VALUES ($1,$2)', [body.name, body.description]);
    res.sendStatus(200);
    return;
  }
  await query('UPDATE attractions SET description=$2 WHERE name=$1', [body.name, body.description]);
  res.sendStatus(200);
});

// simulate wait time update with a random wait time generated
router.post("/updateWaitTime/:id", async (req, res) => {
  const { id } = req.params;
  const newWaitTime = Math.floor(Math.random() * 100); // Random wait time between 0 and 99
  await query(
    "UPDATE attractions SET waitTime = $1 WHERE id = $2",
    [newWaitTime, id]
  );
  res.send({ message: "Wait time updated", newWaitTime });
});

export { router as default };
