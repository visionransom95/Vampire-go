const express = require('express');
const { getRankList, handleRankRequest, handleExpireRequest } = require('../services/rankService');

const router = express.Router();

// GET /api/v1/game/rank/list
router.get('/v1/game/rank/list', (req, res) => {
  const start = parseInt(req.query.start || '0', 10);
  const end = parseInt(req.query.end || '30', 10);
  const { statusCode, body } = getRankList({ start, end });
  return res.status(statusCode).json(body);
});

// GET/POST /api/v1/game/rank
router.all('/v1/game/rank', (req, res) => {
  let data = {};
  if (req.is('application/json')) {
    data = req.body || {};
  } else {
    data = Object.assign({}, req.query, req.body);
  }

  const { statusCode, body } = handleRankRequest(data);
  return res.status(statusCode).json(body);
});

// Handle Redis expiration requests
router.put('/v1/game/rank/expire', async (req, res) => {
  const { statusCode, body } = await handleExpireRequest();
  return res.status(statusCode).json(body);
});

module.exports = router;
