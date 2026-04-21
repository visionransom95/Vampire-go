const express = require('express');
const { getWealth, purchaseProps, getRechargeSum, hasUserRecharge } = require('../services/payService');

const router = express.Router();

// GET /pay/i/api/v1/wealth/users/:userId
router.get('/i/api/v1/wealth/users/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const { statusCode, body } = await getWealth(userId);
  return res.status(statusCode).json(body);
});

// GET /pay/api/v1/wealth/user
router.get('/api/v1/wealth/user', async (req, res) => {
  const headerUserId = req.headers['userid'] || req.headers['userId'];
  const userId = parseInt(headerUserId || '0', 10);
  const { statusCode, body } = await getWealth(userId);
  return res.status(statusCode).json(body);
});

// POST/GET /pay/api/v2/inner/pay/users/purchase/game/props
router.all('/api/v2/inner/pay/users/purchase/game/props', async (req, res) => {
  try {
    const body = req.body || {};
    const userId = parseInt(body.userId || req.query.userId || 112, 10);
    let propId = parseInt(body.propId || req.query.propId || 1, 10);
    let quantity = parseInt(body.quantity || req.query.quantity || 1, 10);
    let currency = String(body.currency || req.query.currency || 'gDiamonds');

    if (['0', '', 'null', 'undefined', 'NaN'].includes(currency) || currency == null) {
      currency = 'gDiamonds';
    }

    const { statusCode, body: respBody } = await purchaseProps({ userId, propId, quantity, currency });
    return res.status(statusCode).json(respBody);
  } catch (e) {
    return res.status(500).json({ code: 0, message: 'Error', error: e.message });
  }
});

// GET /pay/api/v1/inner/user/game/recharge/sum/gDiamond
router.get('/api/v1/inner/user/game/recharge/sum/gDiamond', (req, res) => {
  const userId = req.query.userId || '0';
  const gameId = req.query.gameId || 'unknown';
  const { statusCode, body } = getRechargeSum({ userId, gameId });
  return res.status(statusCode).json(body);
});

// GET /pay/api/v1/pay/inner/has/user/recharge
router.get('/api/v1/pay/inner/has/user/recharge', (req, res) => {
  const userId = req.query.userId || '0';
  const { statusCode, body } = hasUserRecharge(userId);
  return res.status(statusCode).json(body);
});

module.exports = router;
