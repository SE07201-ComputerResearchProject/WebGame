const express = require("express");
const router = express.Router();
const { getPool, sql } = require('../db');
const { requireAuth } = require('../middleware/auth');

// Get leaderboard
router.get("/", async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
        id, name, score, created_at
      FROM dbo.leaderboard 
      ORDER BY score DESC
    `);
    
    res.json({ ok: true, leaderboard: result.recordset });
  } catch (err) {
    console.error('Get leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Submit a score
router.post("/submit", requireAuth, async (req, res) => {
  try {
    const { name, score, gameId } = req.body;
    
    if (!name || typeof score !== "number") {
      return res.status(400).json({ error: "Missing fields" });
    }

    const pool = getPool();

    // Insert score
    const result = await pool.request()
      .input('name', sql.NVarChar(100), name)
      .input('score', sql.Int, score)
      .input('gameId', sql.Int, gameId || 1)
      .input('userId', sql.Int, req.user.id)
      .query(`
        INSERT INTO dbo.leaderboard (name, score, game_id, user_id, created_at)
        VALUES (@name, @score, @gameId, @userId, GETUTCDATE());
      `);

    // Get updated leaderboard
    const leaderboardResult = await pool.request().query(`
      SELECT 
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
        id, name, score, created_at
      FROM dbo.leaderboard 
      ORDER BY score DESC
    `);

    res.json({ ok: true, leaderboard: leaderboardResult.recordset });
  } catch (err) {
    console.error('Submit score error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
