const express = require('express');
const { getGameData, setGameData } = require('../services/gameDataService');

const router = express.Router();

// GET /api/v2/game/data
router.get('/data', async (req, res) => {
  const tableName = req.query.tableName;
  const userId = req.query.userId;
  const subKey = req.query.subKey;

  const { statusCode, body } = await getGameData({ tableName, userId, subKey });
  return res.status(statusCode).json(body);
});

// POST /api/v2/game/data
router.post('/data', async (req, res) => {
  const tableName = req.query.tableName;
  const rows = req.body;
  const { statusCode, body } = await setGameData({ tableName, rows });
  return res.status(statusCode).json(body);
});

module.exports = router;
