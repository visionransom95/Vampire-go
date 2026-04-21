const express = require('express');
const { getPlayerIdentityConfig, getBlockmodsConfigV1 } = require('../services/activityService');

const router = express.Router();

// GET /config/files/player-identity-config
router.get('/config/files/player-identity-config', (req, res) => {
  const { statusCode, body } = getPlayerIdentityConfig();
  return res.status(statusCode).json(body);
});

// GET /config/files/blockmods-config-v1
router.get('/config/files/blockmods-config-v1', (req, res) => {
  const { statusCode, body } = getBlockmodsConfigV1();
  return res.status(statusCode).json(body);
});

// GET /config/files/blockymods-check-version
router.get('/config/files/blockymods-check-version', (req, res) => {
  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      latestVersion: '3410',
      forceUpdate: false,
      message: '',
    },
  });
});

// GET /config/files/dress-guide-config
router.get('/config/files/dress-guide-config', (req, res) => {
  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      enabled: true,
      tips: [],
    },
  });
});

const editorData = require('../Jsons/editor.json');

router.get('/config/files/game-detail-to-editor', (req, res) => {
  try {
    res.status(200).json({
      code: 1,
      message: 'Success',
      data: {
        editorVersion: 1,
        resources: editorData.data,
      },
    });
  } catch (error) {
    console.error('Error in game-detail-to-editor:', error);
    res.status(500).json({
      code: -1,
      message: 'Internal server error',
      error: error.message
    });
  }
});

router.get('/decoration/api/v1/new/decorations/check/resource', (req, res) => {
  const { resVersion, engineVersion } = req.query;
  res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      resVersion: Number(resVersion),
      engineVersion: Number(engineVersion),
      resources: [],
    },
  });
});

module.exports = router;
