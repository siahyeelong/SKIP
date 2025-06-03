import Router from "express-promise-router";
import { query } from "../db/db_manager.js";

const router = new Router();

// test route
router.get("/test", async (req, res) => {
  res.send("hello bitch");
});

// get building by id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const { rows } = await query(
    "SELECT id, name, ST_AsGeoJson(St_transform(geom,4326)) geom FROM buildings WHERE id = $1",
    [id]
  );
  if (rows.length === 0) {
    res.sendStatus(404);
    return;
  }
  res.send(rows[0]);
});

// insert building record
router.post("/", async (req, res) => {
  const { body } = req;
  if (body.name === undefined) {
    res.sendStatus(400);
  } else {
    await query("INSERT INTO buildings (name) VALUES ($1)", [body.name]);
    res.sendStatus(200);
  }
});

// delete building by id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  await query("DELETE FROM buildings WHERE id = $1", [id]);
  res.sendStatus(200);
});

// update building by id
router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { body } = req;
  if (body.name === undefined) {
    res.sendStatus(400);
  } else {
    const { rows } = await query(
      "UPDATE buildings SET name = $1 WHERE id = $2 RETURNING *",
      [body.name, id]
    );
    if (rows.length === 0) {
      res.sendStatus(400);
      return;
    }
    res.sendStatus(200);
  }
});

export { router as default };
