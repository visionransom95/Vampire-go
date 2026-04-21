const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./main.db');

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from the Authorization header
 */
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
            if (err) {
                return res.status(403).json({
                    code: 4,
                    message: 'Invalid or expired token',
                    detail: 'Authentication failed: ' + err.message
                });
            }

            // Verify user exists in the database
            db.get('SELECT * FROM Accounts WHERE userId = ?', [user.userId], (err, row) => {
                if (err || !row) {
                    return res.status(401).json({
                        code: 4,
                        message: 'User not found',
                        detail: 'The user associated with this token was not found'
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
        });
    } else {
        res.status(401).json({
            code: 4,
            message: 'Authentication required',
            detail: 'No authorization token provided'
        });
    }
};

module.exports = { authenticateJWT };
