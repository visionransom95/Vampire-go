const express = require('express');
const {
  getTreasureboxTimeline,
  getSettlementRule,
  collectGameProps,
} = require('../services/activityService');

const router = express.Router();

// GET /activity/api/v1/inner/collect/exchange/treasurebox/timeline
router.get('/api/v1/inner/collect/exchange/treasurebox/timeline', (req, res) => {
  const { statusCode, body } = getTreasureboxTimeline();
  return res.status(statusCode).json(body);
});

// GET /activity/api/v1/inner/activity/games/settlement/rule
router.get('/api/v1/inner/activity/games/settlement/rule', (req, res) => {
  const { statusCode, body } = getSettlementRule();
  return res.status(statusCode).json(body);
});

// GET/POST /activity/api/v1/inner/collect/exchange/game/props
router.all('/api/v1/inner/collect/exchange/game/props', (req, res) => {
  try {
    const q = req.method === 'GET' ? req.query : req.body || {};
    const userId = q.userId;
    const gameId = q.gameId || 'g1008';
    const gamePropsId = q.gamePropsId || 'YaoShi:1';
    const propsAmount = parseInt(q.propsAmount || 1, 10);
    const expiryDate = parseInt(q.expiryDate || 0, 10);

    const { statusCode, body } = collectGameProps({
      userId,
      gameId,
      gamePropsId,
      propsAmount,
      expiryDate,
    });
    return res.status(statusCode).json(body);
  } catch (e) {
    console.error('Error in collect_game_props_route:', e);
    return res.status(500).json({ code: 500, message: 'Internal Server Error' });
  }
});

// GET /activity/api/v1/signIn
router.get('/api/v1/signIn', (req, res) => {
  const headerUserId = req.headers['userid'] || req.headers['userId'];
  const userId = Number(headerUserId || 0);

  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      userId,
      signedInToday: false,
      totalSignInDays: 0,
    },
  });
});

// GET /activity/api/v1/collect/exchange/status
router.get('/api/v1/collect/exchange/status', (req, res) => {
  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      exchangeAvailable: false,
    },
  });
});

// GET /activity/api/v2/activity/title
router.get('/api/v2/activity/title', (req, res) => {
  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: [],
  });
});

module.exports = router;
