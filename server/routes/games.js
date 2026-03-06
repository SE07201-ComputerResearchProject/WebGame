const express = require("express");
const router = express.Router();
const { getPool, sql } = require('../db');

// Get all games
router.get("/", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT id, title, category, rating, players, image 
      FROM dbo.games 
      ORDER BY id
    `);
    
    res.json({ ok: true, games: result.recordset });
  } catch (err) {
    console.error('Get games error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get game by ID
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pool = getPool();
    
    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT id, title, category, rating, players, image 
        FROM dbo.games 
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({ ok: true, game: result.recordset[0] });
  } catch (err) {
    console.error('Get game by ID error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
