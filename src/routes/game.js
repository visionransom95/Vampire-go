const express = require('express');
const { getMapAssetPath } = require('../utils/fileUtils');
const fs = require('fs');
const path = require('path');
const { getRecentlyPlayed, getRecommended, getMore, getGameById } = require('../services/gameService');

const router = express.Router();

// --- v2 endpoints ---

// GET /game/api/v2/game/auth
router.get('/game/api/v2/game/auth', (req, res) => {
  const { typeId, targetId } = req.query;
  
  // Validate required parameters
  if (!typeId || !targetId) {
    return res.status(400).json({
      code: 0,
      message: 'Missing required parameters: typeId and targetId are required',
      data: null
    });
  }

  // Generate a random token (40 characters)
  function generateToken() {
    const chars = 'abcdef0123456789';
    let token = '';
    for (let i = 0; i < 40; i++) {
      token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
  }

  // Generate a random signature (32 characters)
  function generateSignature() {
    const chars = 'abcdef0123456789';
    let sig = '';
    for (let i = 0; i < 32; i++) {
      sig += chars[Math.floor(Math.random() * chars.length)];
    }
    return sig;
  }

  // Prepare the response
  const response = {
    code: 1,
    message: "SUCCESS",
    data: {
      token: generateToken(),
      signature: generateSignature(),
      timestamp: Date.now(),
      region: 8008,
      dispUrl: "http://10.118.13.248:38199",
      engineType: "v1",
      country: "PK",
      gameVersion: "10068",
      typeId,
      targetId,
      hasPermission: true,
      authTime: new Date().toISOString()
    }
  };

  return res.status(200).json(response);
});

// GET /game/api/v2/games/:gameId
router.get('/game/api/v2/games/:gameId', (req, res) => {
  const { gameId } = req.params;
  const { appVersion } = req.query;
  const game = getGameById(gameId);
  
  if (!game) {
    return res.status(404).json({ 
      code: 0, 
      message: 'Game not found',
      data: null
    });
  }
  
  // Add appVersion to response if provided
  const response = {
    code: 1,
    message: 'Success',
    data: {
      ...game,
      appVersion: appVersion || null
    }
  };
  
  return res.status(200).json(response);
});

// --- v1 endpoints ---

// GET /game/api/v1/games/playlist/recently
router.get('/game/api/v1/games/playlist/recently', (req, res) => {
  const { isFilter = '0' } = req.query;
  const { statusCode, body } = getRecentlyPlayed({ isFilter });
  return res.status(statusCode).json(body);
});

// GET /game/api/v1/game/revision/list/recommend
router.get('/game/api/v1/game/revision/list/recommend', (req, res) => {
  const { isFilter = '0', os = 'android' } = req.query;
  const { statusCode, body } = getRecommended({ isFilter, os });
  return res.status(statusCode).json(body);
});

// GET /game/api/v1/game/revision/list/more
router.get('/game/api/v1/game/revision/list/more', (req, res) => {
  const { isFilter = '0', os = 'android', pageNo = '0', pageSize = '15' } = req.query;
  const pageNoNum = parseInt(pageNo, 10) || 0;
  const pageSizeNum = parseInt(pageSize, 10) || 15;

  const { statusCode, body } = getMore({ isFilter, os, pageNo: pageNoNum, pageSize: pageSizeNum });
  return res.status(statusCode).json(body);
});

// GET /game/api/v1/games/update/list/:userId
router.get('/game/api/v1/games/update/list/:userId', (req, res) => {
  const userId = Number(req.params.userId);
  const { oldEngineVersion = '', newEngineVersion = '' } = req.query;

  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      userId,
      oldEngineVersion,
      newEngineVersion,
      updates: [],
    },
  });
});

// PUT /game/api/v1/games/engine
router.put('/game/api/v1/games/engine', (req, res) => {
  const { engineVersion = '', newEngineVersion = '' } = req.query;

  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      engineVersion,
      newEngineVersion,
      updated: true,
    },
  });
});

// Add this route at the bottom of the file, before module.exports
router.get('/GameAssets/Maps/g1046/:mapName', (req, res) => {
    try {
        const { mapName } = req.params;
        
        // Validate mapName to prevent directory traversal
        if (!/^[a-zA-Z0-9_.-]+$/.test(mapName)) {
            return res.status(400).json({
                code: 0,
                message: 'Invalid map name'
            });
        }

        const filePath = getMapAssetPath(mapName);
        
        // Set appropriate headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${mapName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        
        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
        
        fileStream.on('error', (err) => {
            console.error('Error streaming file:', err);
            if (!res.headersSent) {
                res.status(500).json({
                    code: 0,
                    message: 'Error streaming file'
                });
            }
        });
        
    } catch (error) {
        console.error('Error serving map file:', error);
        res.status(404).json({
            code: 0,
            message: error.message || 'Map not found'
        });
    }
});

/**
 * @swagger
 * /v1/game-map:
 *   get:
 *     tags: [Game]
 *     summary: Get mini game map token
 *     description: Retrieve a token for accessing a specific mini-game map
 *     parameters:
 *       - in: query
 *         name: mapName
 *         required: false
 *         schema:
 *           type: string
 *         description: Name of the game map
 *       - in: query
 *         name: gameType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of the game (e.g., g1046)
 *       - in: query
 *         name: engineVersion
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Version of the game engine
 *     responses:
 *       200:
 *         description: Successfully retrieved game map information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 1
 *                 message:
 *                   type: string
 *                   example: "SUCCESS"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Authentication token for the game map
 *                     downloadUrl:
 *                       type: string
 *                       description: URL to download the map assets
 *                     mapName:
 *                       type: string
 *                       description: Name of the map
 *                     gameType:
 *                       type: string
 *                       description: Type of the game
 *                     cdns:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cdnId:
 *                             type: string
 *                           cdnName:
 *                             type: string
 *                           cdnUrl:
 *                             type: string
 *                           url:
 *                             type: string
 *                           ratio:
 *                             type: number
 *                           base:
 *                             type: boolean
 */
router.get('/v1/game-map', (req, res) => {
    const { mapName, gameType = 'g1046', engineVersion = '10068' } = req.query;

    // Validate required parameters
    if (!gameType) {
        return res.status(400).json({
            code: 0,
            message: 'Missing required parameter: gameType',
            data: null
        });
    }

    // Generate default map name if not provided
    const defaultMap = `m${gameType.substring(1)}_2`; // Converts g1046 to m1046_2
    const actualMapName = mapName || defaultMap;
    
    // Base URL for downloads
    const baseUrl = `http://10.118.13.248:38199/GameAssets/Maps/${gameType}`;
    const downloadUrl = `${baseUrl}/${actualMapName}.zip`;
    
    // Generate a secure token
    const token = require('crypto').randomBytes(32).toString('hex');
    
    // Prepare the response in HttpResponse<MiniGameToken> format
    const response = {
        code: 1,  // Success code as per the interface
        message: "SUCCESS",
        data: {
            // MiniGameToken fields
            token: token,
            expiresIn: 86400, // 24 hours in seconds
            // Include additional fields that might be part of MiniGameToken
            mapId: actualMapName,
            serverUrl: "http://10.118.13.248:38199",
            createTime: Date.now(),
            // Keep the CDN information as it might be needed by the client
            cdns: [
                {
                    cdnId: "1",
                    cdnName: "BliXO Test",
                    cdnUrl: "http://10.118.13.248:38199",
                    url: downloadUrl,
                    ratio: 1,
                    base: true
                }
            ],
            // Additional metadata that might be expected
            gameType: gameType,
            engineVersion: parseInt(engineVersion, 10) || 0
        }
    };

    res.json(response);
});

module.exports = router;