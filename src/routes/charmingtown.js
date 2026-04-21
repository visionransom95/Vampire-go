const express = require('express');
const { sellManor, manorPayResult } = require('../services/charmingtownService');

const router = express.Router();

// GET /charmingtown/api/v1/inner/manor/sale/:userId
router.get('/api/v1/inner/manor/sale/:userId', (req, res) => {
  const userId = parseInt(req.params.userId || '0', 10);
  const { statusCode, body } = sellManor(userId);
  return res.status(statusCode).json(body);
});

// GET /charmingtown/api/v1/inner/manor/payResult/:userId
router.get('/api/v1/inner/manor/payResult/:userId', (req, res) => {
  const userId = parseInt(req.params.userId || '0', 10);
  const { statusCode, body } = manorPayResult(userId);
  return res.status(statusCode).json(body);
});

module.exports = router;
