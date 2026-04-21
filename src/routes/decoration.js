const express = require('express');
const {
  getUsing,
  setUsing,
  equipDecoration,
  removeDecoration,
  getAllDecorations,
  getClothes,
  getDecorationsByType,
} = require('../services/decorationService');
const skinData = require('../Jsons/skin.json');  // <-- Add this line

const router = express.Router();

// In src/routes/decoration.js, update the /suit route
router.get('/api/v1/new/decorations/users/:userId/suit', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { os = 'android', engineVersion = '90001' } = req.query;

    // Safe data access with null checks
    const allItems = (skinData?.data || []).filter(Boolean);
    const suits = {};

    allItems.forEach((item) => {
      if (item.suitId && item.status === 1) {
        suits[item.suitId] = suits[item.suitId] || {
          suitId: item.suitId,
          name: `Suit ${item.suitId}`,
          items: []
        };
        suits[item.suitId].items.push(item);
      }
    });

    return res.status(200).json({
      code: 1,
      message: 'Success',
      data: {
        userId,
        os,
        engineVersion: Number(engineVersion),
        suits: Object.values(suits)
      }
    });

  } catch (error) {
    console.error('Error in /suit endpoint:', error);
    return res.status(200).json({
      code: 4,
      message: 'Internal server error',
      data: {
        userId: parseInt(req.params.userId, 10),
        os: req.query.os || 'android',
        engineVersion: Number(req.query.engineVersion || '90001'),
        suits: []
      }
    });
  }
});

// GET /decoration/api/v1/new/decorations/users/:userId/type/:type
router.get('/api/v1/new/decorations/users/:userId/type/:type', async (req, res) => {
  const userId = parseInt(req.params.userId, 10);
  const type = parseInt(req.params.type, 10);
  const { os = 'android', engineVersion = '90001' } = req.query;

  const decorations = getDecorationsByType(type);

  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      userId,
      type,
      os,
      engineVersion: Number(engineVersion),
      decorations,
    },
  });
});

// GET /decoration/api/v1/decorations/using?otherId=0
// Maps the query/header user id to the playerId used by decorationService
router.get('/api/v1/decorations/using', async (req, res) => {
  const otherId = parseInt(req.query.otherId || '0', 10);
  const headerUserId = req.headers['userid'] || req.headers['userId'];
  const fallbackUserId = parseInt(headerUserId || '0', 10);
  const playerId = Number.isNaN(otherId) || otherId === 0 ? fallbackUserId : otherId;

  const safePlayerId = Number.isNaN(playerId) ? 0 : playerId;

  const { statusCode, body } = await getUsing(safePlayerId);
  return res.status(statusCode).json(body);
});

// GET/POST /decoration/api/v1/decorations/:playerId/using
router.route('/api/v1/decorations/:playerId/using')
  .get(async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);
    const { statusCode, body } = await getUsing(playerId);
    return res.status(statusCode).json(body);
  })
  .post(async (req, res) => {
    const playerId = parseInt(req.params.playerId, 10);
    const decorationId = req.body?.decorationId;
    const { statusCode, body } = await setUsing(playerId, decorationId);
    return res.status(statusCode).json(body);
  });

// POST /decoration/api/v1/decorations/:playerId/equip
router.post('/api/v1/decorations/:playerId/equip', async (req, res) => {
  const playerId = parseInt(req.params.playerId, 10);
  const decorationId = req.body?.decorationId;
  const { statusCode, body } = await equipDecoration(playerId, decorationId);
  return res.status(statusCode).json(body);
});

// POST /decoration/api/v1/decorations/:playerId/remove
router.post('/api/v1/decorations/:playerId/remove', async (req, res) => {
  const playerId = parseInt(req.params.playerId, 10);
  const decorationId = req.body?.decorationId;
  const { statusCode, body } = await removeDecoration(playerId, decorationId);
  return res.status(statusCode).json(body);
});

// GET /decoration/api/v1/decorations/:playerId
router.get('/api/v1/decorations/:playerId', async (req, res) => {
  const playerId = parseInt(req.params.playerId, 10);
  const { statusCode, body } = await getAllDecorations(playerId);
  return res.status(statusCode).json(body);
});

// GET /decoration/api/v1/inner/clothes
router.get('/api/v1/inner/clothes', async (req, res) => {
  const userId = parseInt(req.query.userId || '0', 10);
  const { statusCode, body } = await getClothes(userId);
  return res.status(statusCode).json(body);
});

module.exports = router;
