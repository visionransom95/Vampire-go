const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const db = new sqlite3.Database('./main.db');

// Simple authentication middleware
const authenticate = (req, res, next) => {
    const userId = req.headers['userid'] || req.query.userId || req.body.userId;
    
    if (!userId) {
        return res.status(401).json({
            code: 4,
            message: 'Authentication required',
            detail: 'User ID is required in headers or query parameters'
        });
    }
    
    // Optionally verify user exists in database
    db.get('SELECT * FROM Accounts WHERE userId = ?', [userId], (err, row) => {
        if (err || !row) {
            return res.status(401).json({
                code: 4,
                message: 'Invalid user',
                detail: 'The provided user ID is not valid'
            });
        }
        
        // Attach user info to the request
        req.user = {
            userId: row.userId,
            account: row.account,
            type: row.type
        };
        next();
    });
};

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
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the game map
 *       - in: query
 *         name: gameType
 *         required: true
 *         schema:
 *           type: string
 *         description: Type of the game
 *       - in: query
 *         name: engineVersion
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: Version of the game engine
 *     responses:
 *       200:
 *         description: Successfully retrieved game map token
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
 *                   example: "Success"
 *                 data:
 *                   $ref: '#/components/schemas/MiniGameToken'
 *       400:
 *         description: Missing or invalid parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     MiniGameToken:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Authentication token for the game map
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         expiresIn:
 *           type: integer
 *           description: Token expiration time in seconds
 *           example: 3600
 *         mapId:
 *           type: string
 *           description: Unique identifier for the game map
 *           example: "map_12345"
 */

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
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the map
 *       - in: query
 *         name: gameType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the game
 *       - in: query
 *         name: engineVersion
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: The version of the game engine
 *     responses:
 *       200:
 *         description: Successful response with game map token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HttpResponse'
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/MiniGameToken'
 */
/**
 * @swagger
 * /v1/game-map:
 *   get:
 *     tags: [Game]
 *     summary: Get mini game map token
 *     description: Retrieve a token for accessing a specific mini-game map
 *     parameters:
 *       - in: header
 *         name: userid
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID for authentication
 *       - in: query
 *         name: mapName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the map
 *       - in: query
 *         name: gameType
 *         required: true
 *         schema:
 *           type: string
 *         description: The type of the game
 *       - in: query
 *         name: engineVersion
 *         required: true
 *         schema:
 *           type: integer
 *           format: int64
 *         description: The version of the game engine
 *     responses:
 *       200:
 *         description: Successful response with game map token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 code:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Success"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: "game_token_1234567890"
 *                     mapName:
 *                       type: string
 *                       example: "desert_map"
 *                     gameType:
 *                       type: string
 *                       example: "adventure"
 *                     engineVersion:
 *                       type: integer
 *                       example: 1
 *                     expiresIn:
 *                       type: integer
 *                       example: 3600
 *                     serverUrl:
 *                       type: string
 *                       example: "wss://game-server.example.com"
 */
router.get('/v1/game-map', authenticate, async (req, res) => {
    try {
        const { mapName, gameType, engineVersion } = req.query;
        
        // Validate required parameters
        if (!mapName || !gameType || !engineVersion || 
            mapName.trim() === '' || gameType.trim() === '') {
            return res.status(200).json({
                code: 1,
                message: 'Missing or invalid parameters: mapName and gameType cannot be empty',
                data: null,
                success: false
            });
        }

        // Generate a secure token
        const token = crypto.randomBytes(32).toString('hex');
        const expiresIn = 86400; // 24 hours in seconds
        
        // Prepare response in the expected format
        const response = {
            code: 0, // 0 indicates success in this API
            message: 'success',
            data: {
                token: token,
                expiresIn: expiresIn, // Using expiresIn instead of expiresAt
                serverUrl: process.env.GAME_SERVER_URL || 'wss://game-server.example.com',
                // Include additional fields that might be expected by the client
                mapName: mapName,
                gameType: gameType,
                engineVersion: parseInt(engineVersion, 10),
                // Add any additional fields that might be required by the client
                status: 1,
                createTime: Math.floor(Date.now() / 1000)
            },
            success: true
        };

        res.json(response);
    } catch (error) {
        console.error('Error in game map endpoint:', error);
        res.status(500).json({
            code: 500,
            message: 'Internal server error',
            data: null
        });
    }
});

module.exports = router;
