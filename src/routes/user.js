const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

/** @type {import('express').Router} */
const router = express.Router();

const db = new sqlite3.Database('./main.db');

function genToken() {
  return crypto.randomBytes(20).toString('hex');
}

function genUserId(callback) {
  const minUserId = 1000; // Start from a reasonable minimum
  const newUserId = Math.max(Math.floor(Date.now() % 1000000) + minUserId, minUserId);
  // Check if userId already exists
  db.get('SELECT userId FROM Accounts WHERE userId = ?', [newUserId], (err, row) => {
    if (err) return callback(minUserId); // Fallback to minUserId on error
    if (row) {
      // If ID exists, try again with a different number
      return genUserId(callback);
    }
    callback(newUserId);
  });
}

// ensure tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS Accounts (
    account TEXT PRIMARY KEY,
    userId INTEGER,
    password TEXT,
    type INTEGER
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS UserDetails (
    userId INTEGER PRIMARY KEY,
    nickName TEXT NOT NULL,
    level INTEGER DEFAULT 1,
    experience INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS Wallet (
    userId INTEGER PRIMARY KEY,
    gold INTEGER DEFAULT 0,
    gcubes INTEGER DEFAULT 0,
    bcubes INTEGER DEFAULT 0
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS DeviceTokens (
    userId INTEGER PRIMARY KEY,
    deviceToken TEXT
  )`);
});

// shared handler for details (GET /api/v1/inner/user/details and POST /api/v1/user/details/info)
function userDetailsHandler(req, res) {
  const raw = req.query.userId || req.headers.userid || req.body?.userId || '112';
  const userIdNum = parseInt(String(raw), 10) || 112;

  db.get('SELECT * FROM UserDetails WHERE userId = ?', [userIdNum], (err, detailRow) => {
    if (err) return res.status(500).json({ code: 4, message: 'internal error', detail: err.message });

    const respondWith = (base) => {
      db.get('SELECT * FROM Wallet WHERE userId = ?', [userIdNum], (errw, walletRow) => {
        if (errw) return res.status(500).json({ code: 4, message: 'internal error', detail: errw.message });

        const wallet = walletRow || { gold: 0, gcubes: 0, bcubes: 0 };
        const userObj = {
          uid: String(userIdNum),
          userId: String(userIdNum),
          playerId: String(userIdNum),
          nickName: base.nickName,
          level: base.level,
          experience: base.experience,
          appearance: {
            hairId: 5, faceId: 3, topsId: 12, pantsId: 8, shoesId: 4,
            glassesId: 0, scarfId: 0, wingId: 2, hatId: 1, decoratehatId: 0,
            armId: 0, extrawingId: 0, footHaloId: 0,
            skinColor: { r: 0.85, g: 0.7, b: 0.6, a: 1.0 }
          },
          wallet: {
            gold: wallet.gold || 0,
            gcubes: wallet.gcubes || 0,
            bcubes: wallet.bcubes || 0,
            gcube: wallet.gcubes || 0,
            bcube: wallet.bcubes || 0
          }
        };

        return res.status(200).json({ code: 1, message: 'Success', data: userObj });
      });
    };

    if (!detailRow) {
      db.run('INSERT INTO UserDetails (userId, nickName, level, experience) VALUES (?, ?, ?, ?)', [userIdNum, `Player${userIdNum}`, 1, 0], (err2) => {
        if (err2) return res.status(500).json({ code: 4, message: 'internal error', detail: err2.message });
        db.run('INSERT OR IGNORE INTO Wallet (userId, gold, gcubes, bcubes) VALUES (?, ?, ?, ?)', [userIdNum, 0, 0, 0], (err3) => {
          if (err3) return res.status(500).json({ code: 4, message: 'internal error', detail: err3.message });
          db.get('SELECT * FROM UserDetails WHERE userId = ?', [userIdNum], (err4, newRow) => {
            if (err4) return res.status(500).json({ code: 4, message: 'internal error', detail: err4.message });
            respondWith(newRow);
          });
        });
      });
    } else {
      respondWith(detailRow);
    }
  });
}

// POST /user/api/v1/user/register
router.post('/user/api/v1/user/register', (req, res) => {
  const account = (req.body?.account || req.body?.username || req.query.account || '').trim();
  const password = req.body?.password || req.query.password || '';
  const deviceId = req.body?.deviceId || req.query.deviceId || '';
  const appType = req.body?.appType || req.query.appType || 'android';

  if (!account) return res.status(400).json({ code: -1, message: 'Account name is required' });

  db.get('SELECT * FROM Accounts WHERE account = ?', [account], (err, row) => {
    if (err) return res.status(500).json({ code: 4, message: 'internal error', detail: err.message });
    if (row) return res.status(400).json({ code: -1, message: 'Account already exists' });

    const minUserId = 16;
    const userId = Math.max(Math.floor(Date.now() % 1000000) + 100, minUserId);

    db.run('INSERT INTO Accounts (account, userId, password, type) VALUES (?, ?, ?, ?)', [account, userId, password, 0], (err2) => {
      if (err2) return res.status(500).json({ code: 4, message: 'internal error', detail: err2.message });

      // Insert UserDetails and Wallet
      db.run('INSERT OR IGNORE INTO UserDetails (userId, nickName, level, experience) VALUES (?, ?, ?, ?)', [userId, account, 1, 0], () => {
        db.run('INSERT OR IGNORE INTO Wallet (userId, gold, gcubes, bcubes) VALUES (?, ?, ?, ?)', [userId, 0, 0, 0], () => {

          const token = crypto.randomBytes(20).toString('hex');
          const baseUrl = `http://YOUR_SERVER_IP:38199`;

          // Return the exact structure Blockman Go expects
          return res.status(200).json({
            code: 1,
            message: 'Success',
            data: {
              userId: String(userId),
              uid: String(userId),
              account: account,
              deviceId: deviceId,
              appType: appType,
              token: token,
              isTourist: false,
              baseUrl: baseUrl,
              backupBaseUrl: baseUrl
            }
          });
        });
      });
    });
  });
});

// POST /api/v2/app/login
router.post('/api/v2/app/login', (req, res) => {
  const account = String(req.body?.uid || req.body?.account || '').trim();
  const password = req.body?.password || '';
  const hasPassword = !!password;

  if (!account) return res.status(400).json({ code: -1, message: 'Account required' });

  db.get('SELECT * FROM Accounts WHERE account = ?', [account], (err, row) => {
    if (err) return res.status(500).json({ code: 4, message: 'DB error', detail: err.message });

    const finishLogin = (userId) => {
      db.run('INSERT OR IGNORE INTO UserDetails (userId, nickName, level, experience) VALUES (?, ?, ?, ?)', [userId, account, 1, 0]);
      db.run('INSERT OR IGNORE INTO Wallet (userId, gold, gcubes, bcubes) VALUES (?, ?, ?, ?)', [userId, 0, 0, 0]);
      
      const token = genToken();
      res.status(200).json({
        code: 1,
        message: 'Success',
        data: { 
          userId: String(userId), 
          uid: String(userId), 
          token, 
          hasPassword: !!password 
        }
      });
    };

    if (!row) {
      genUserId((newUserId) => {
        db.run('INSERT INTO Accounts (account, userId, password, type) VALUES (?, ?, ?, ?)', [account, newUserId, password, 0], (err2) => {
          if (err2) return res.status(500).json({ code: 4, message: 'DB error', detail: err2.message });
          finishLogin(newUserId);
        });
      });
    } else {
      finishLogin(row.userId);
    }
  });
});

// GET /api/v1/inner/user/details
router.get('/api/v1/inner/user/details', userDetailsHandler);

// POST /api/v1/user/details/info
router.post('/api/v1/user/details/info', userDetailsHandler);

// GET /api/v1/app/auth-token
router.get('/api/v1/app/auth-token', (req, res) => {
  const headerUserId = req.headers['userid'] || req.headers['userId'] || req.headers['bmg-user-id'];
  const userIdNum = parseInt(String(headerUserId || '0'), 10) || 0;
  if (!userIdNum || userIdNum <= 0) return res.status(400).json({ code: -1, message: 'userId is required and must be greater than 0' });

  const deviceId = req.headers['bmg-device-id'] || '';
  return res.status(200).json({ code: 1, message: 'Success', data: { userId: String(userIdNum), deviceId, authToken: genToken() } });
});

router.post('/api/v1/account/invalid/check', (req, res) => {
  const account = req.query.account || req.body?.account || '';
  const type = req.query.type || req.body?.type || '1';
  let userId = 0;

  if (req.query.userId) userId = parseInt(String(req.query.userId).trim(), 10);
  else if (req.body?.userId) userId = parseInt(String(req.body.userId).trim(), 10);

  const minUserId = 16;

  if (!account) return res.status(400).json({ code: -1, message: 'Account is required' });

  // Type 2: Just return null data if userId invalid
  if (type === '2') {
    if (!userId || userId <= 0) {
      return res.status(200).json({ code: 1, message: 'Success', data: null });
    } else {
      return res.status(200).json({ code: 1, message: 'Success', data: { invalid: 0 } });
    }
  }

  // Type 1: check / auto-register
  db.get('SELECT * FROM Accounts WHERE account = ?', [account], (err, row) => {
    if (err) return res.status(500).json({ code: 4, message: 'internal error', detail: err.message });

    if (!row || !userId || userId <= 0) {
      const newUserId = Math.max(Math.floor(Date.now() % 1000000) + 100, minUserId);

      db.run('INSERT INTO Accounts (account, userId, password, type) VALUES (?, ?, ?, ?)', [account, newUserId, '', 0], (err2) => {
        if (err2) return res.status(500).json({ code: 4, message: 'internal error', detail: err2.message });

        db.run('INSERT OR IGNORE INTO UserDetails (userId, nickName, level, experience) VALUES (?, ?, ?, ?)', [newUserId, account, 1, 0], (err3) => {
          if (err3) return res.status(500).json({ code: 4, message: 'internal error', detail: err3.message });

          db.run('INSERT OR IGNORE INTO Wallet (userId, gold, gcubes, bcubes) VALUES (?, ?, ?, ?)', [newUserId, 0, 0, 0], (err4) => {
            if (err4) return res.status(500).json({ code: 4, message: 'internal error', detail: err4.message });

            const token = crypto.randomBytes(20).toString('hex');
            return res.status(200).json({
              code: 1,
              message: 'Success',
              data: { invalid: 1, userId: String(newUserId), uid: String(newUserId), token }
            });
          });
        });
      });
    } else {
      return res.status(200).json({ code: 1, message: 'Success', data: { invalid: 0, userId: String(row.userId) } });
    }
  });
});

// POST /user/api/v1/user/mac/id
router.post('/user/api/v1/user/mac/id', (req, res) => {
  const appType = req.query.appType || req.body?.appType || 'android';
  const uuid = req.query.uuid || req.body?.uuid || crypto.randomUUID();

  // Check if this UUID already exists
  db.get('SELECT userId FROM DeviceTokens WHERE deviceToken = ?', [uuid], (err, row) => {
    if (err) return res.status(500).json({ code: 4, message: 'internal error', detail: err.message });

    if (row) {
      // Already registered device
      return res.status(200).json({ code: 1, message: 'SUCCESS', data: { userId: String(row.userId) } });
    } else {
      // New device, assign userId
      const minUserId = 16;
      const userId = Math.max(Math.floor(Date.now() % 1000000) + 100, minUserId);

      // Insert into Accounts/UserDetails/Wallet if needed
      db.run('INSERT OR IGNORE INTO Accounts (account, userId, password, type) VALUES (?, ?, ?, ?)', [uuid, userId, '', 1]);
      db.run('INSERT OR IGNORE INTO UserDetails (userId, nickName, level, experience) VALUES (?, ?, ?, ?)', [userId, `Tourist${userId}`, 1, 0]);
      db.run('INSERT OR IGNORE INTO Wallet (userId, gold, gcubes, bcubes) VALUES (?, ?, ?, ?)', [userId, 0, 0, 0]);

      db.run('INSERT INTO DeviceTokens (userId, deviceToken) VALUES (?, ?)', [userId, uuid], (err2) => {
        if (err2) return res.status(500).json({ code: 4, message: 'internal error', detail: err2.message });
        return res.status(200).json({ code: 1, message: 'SUCCESS', data: { userId: String(userId) } });
      });
    }
  });
});


// POST /api/v1/user/mac/id
router.post('/api/v1/user/mac/id', (req, res) => {
  const appType = req.query.appType || req.body?.appType || 'android';
  const uuid = req.query.uuid || req.body?.uuid || '';
  
  // Log the request for tracking purposes
  console.log(`[countDaily] appType: ${appType}, uuid: ${uuid}`);
  
  // Return success response with null data as per the Java interface
  return res.status(200).json({ 
    code: 1, 
    message: 'SUCCESS', 
    data: null 
  });
});

// Extended tourist login
router.post('/api/v1/app/user/tourist/login', (req, res) => {
  const uuid = req.body?.uuid || req.query?.uuid || crypto.randomUUID();

  db.get('SELECT * FROM Accounts WHERE account = ?', [uuid], (err, row) => {
    if (row) {
      genTokenForUser(row.userId, (token) => {
        res.json({ code: 1, message: 'Success', data: { userId: String(row.userId), uid: String(row.userId), token, isTourist: true } });
      });
    } else {
      genUserId((userId) => {
        db.run('INSERT INTO Accounts (account, userId, password, type) VALUES (?, ?, ?, ?)', [uuid, userId, '', 1]);
        db.run('INSERT INTO UserDetails (userId, nickName, level, experience) VALUES (?, ?, ?, ?)', [userId, `Tourist${userId}`, 1, 0]);
        db.run('INSERT INTO Wallet (userId, gold, gcubes, bcubes) VALUES (?, ?, ?, ?)', [userId, 0, 0, 0]);
        
        genTokenForUser(userId, (token) => {
          res.json({ code: 1, message: 'Success', data: { userId: String(userId), uid: String(userId), token, isTourist: true } });
        });
      });
    }
  });
});

// POST /api/v1/user/language
router.post('/api/v1/user/language', (req, res) => {
  const userIdRaw = req.query.userId || req.headers.userid || req.body?.userId || '';
  const userId = String(userIdRaw || '');
  const language = req.query.language || req.body?.language || 'en';
  return res.status(200).json({ code: 1, message: 'Success', data: { userId, language } });
});

// PUT /api/v1/user/device/id
router.put('/api/v1/user/device/id', (req, res) => {
  const userIdRaw = req.headers.userid || req.body?.userId || '0';
  const userId = String(userIdRaw || '0');
  const { deviceId = '', signature = '' } = req.body || {};
  return res.status(200).json({ code: 1, message: 'Success', data: { userId, deviceId, signature } });
});

// GET /api/v1/users/device/token
router.get('/api/v1/users/device/token', (req, res) => {
  const headerUserId = req.headers['userid'] || req.headers['userId'] || '0';
  const userIdNum = parseInt(String(headerUserId || '0'), 10) || 0;
  const userId = userIdNum ? userIdNum : 0;
  db.get('SELECT * FROM DeviceTokens WHERE userId = ?', [userId], (err, row) => {
    if (err) return res.status(500).json({ code: 4, message: 'internal error', detail: err.message });
    const deviceToken = row ? row.deviceToken : 'mock-device-token';
    return res.status(200).json({ code: 1, message: 'Success', data: { userId: String(userId), deviceToken } });
  });
});

// GET /api/v1/user/set-psd/param/check
router.get('/api/v1/user/set-psd/param/check', (req, res) => {
  const { type } = req.query;
  const headerUserId = req.headers['userid'] || req.headers['userId'] || '0';
  
  // For type 1: Check if password is set
  if (type === '1') {
    db.get('SELECT password FROM Accounts WHERE userId = ?', [headerUserId], (err, row) => {
      if (err) {
        return res.status(500).json({ code: 1, message: 'Database error' });
      }
      const isPasswordSet = row && row.password && row.password.trim() !== '';
      return res.json({
        code: 0,
        message: 'Success',
        data: {
          isSet: isPasswordSet ? 1 : 0,
          type: 1
        }
      });
    });
  } 
  // For type 2: Return null data
  else if (type === '2') {
    return res.json({
      code: 0,
      message: 'Success',
      data: null
    });
  } 
  // For any other type
  else {
    return res.status(400).json({ 
      code: 2, 
      message: 'Invalid type parameter. Must be 1 or 2.' 
    });
  }
});

module.exports = router;
