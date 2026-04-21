const express = require('express');
const {
  createOrRenameParty,
  listParties,
  likeParty,
  getMyGameBuild,
  msgSend,
  segmentInfo,
  stageReportG1055,
} = require('../services/gameaideService');

const router = express.Router();

// POST /gameaide/api/v1/inner/game/party/create
router.post('/api/v1/inner/game/party/create', async (req, res) => {
  const userId = parseInt(req.query.userId || '0', 10);
  const gameId = req.query.gameId || 'unknown';
  const body = req.body || {};
  const partyName = body.name || `Party_${userId}`;
  const partyType = parseInt(body.type || 0, 10);

  const { statusCode, body: resp } = await createOrRenameParty({
    userId,
    gameId,
    name: partyName,
    type: partyType,
  });
  return res.status(statusCode).json(resp);
});

// GET /gameaide/api/v1/inner/game/party/list/:gameId
router.get('/api/v1/inner/game/party/list/:gameId', (req, res) => {
  const gameId = req.params.gameId;
  const type = req.query.type || '0';
  const { statusCode, body } = listParties({ gameId, type });
  return res.status(statusCode).json(body);
});

// GET /gameaide/api/v1/inner/game/party/like/:gameId/:targetUserId
router.get('/api/v1/inner/game/party/like/:gameId/:targetUserId', (req, res) => {
  const targetUserId = parseInt(req.params.targetUserId || '0', 10);
  const userId = parseInt(req.query.userId || '0', 10);
  const { statusCode, body } = likeParty({ userId, targetUserId });
  return res.status(statusCode).json(body);
});

// GET /gameaide/api/v1/inner/my/game/build
router.get('/api/v1/inner/my/game/build', (req, res) => {
  const userId = parseInt(req.query.userId || '0', 10);
  const gameId = req.query.gameId || 'unknown';
  const { statusCode, body } = getMyGameBuild({ userId, gameId });
  return res.status(statusCode).json(body);
});

// POST /gameaide/api/v1/inner/msg/send
router.post('/api/v1/inner/msg/send', (req, res) => {
  const data = req.body || {};
  const { statusCode, body } = msgSend(data);
  return res.status(statusCode).json(body);
});

// GET /gameaide/api/v1/inner/user/segment/info
router.get('/api/v1/inner/user/segment/info', async (req, res) => {
  const userId = parseInt(req.query.userId || '112', 10);
  const { statusCode, body } = await segmentInfo(userId);
  return res.status(statusCode).json(body);
});

// POST /gameaide/api/v1/inner/segment/stage/report/g1055
router.post('/api/v1/inner/segment/stage/report/g1055', (req, res) => {
  const payload = req.body || {};
  const { statusCode, body } = stageReportG1055(payload, {
    headers: req.headers,
    remote_addr: req.ip,
    path: req.path,
    method: req.method,
  });
  return res.status(statusCode).json(body);
});

module.exports = router;
