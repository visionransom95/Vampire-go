const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { SECRET_KEY } = require('../config/env');
const { getMainDb } = require('../config/db');

function safeParse(str, fallback = {}) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

function ensureTableExists(tableName) {
  const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
  const sql = `
    CREATE TABLE IF NOT EXISTS ${safeName} (
      userId INTEGER NOT NULL,
      subKey TEXT NOT NULL,
      data TEXT NOT NULL,
      PRIMARY KEY (userId, subKey)
    )`;

  const db = getMainDb();
  return new Promise((resolve, reject) => {
    db.run(sql, (err) => {
      db.close();
      if (err) return reject(err);
      resolve(safeName);
    });
  });
}

function ensureRowExists(table, userId, subKey, defaultData = {}) {
  const db = getMainDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT 1 FROM ${table} WHERE userId=? AND subKey=?`,
      [userId, subKey],
      (err, row) => {
        if (err) {
          db.close();
          return reject(err);
        }
        if (row) {
          db.close();
          return resolve();
        }
        const dataStr = JSON.stringify(defaultData || {});
        db.run(
          `INSERT INTO ${table} (userId, subKey, data) VALUES (?, ?, ?)`,
          [userId, subKey, dataStr],
          (err2) => {
            db.close();
            if (err2) return reject(err2);
            resolve();
          },
        );
      },
    );
  });
}

function applySpecialMerge(existing, incoming) {
  if (typeof existing !== 'object' || existing === null) existing = {};
  if (typeof incoming !== 'object' || incoming === null) incoming = {};

  const result = { ...existing };

  if (Array.isArray(incoming.__rm)) {
    for (const k of incoming.__rm) delete result[k];
  }

  for (const [k, v] of Object.entries(incoming)) {
    if (k === '__rm') continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      if ('__add' in v) {
        const { __add, ...rest } = v;
        result[k] = rest;
      } else {
        result[k] = applySpecialMerge(result[k] || {}, v);
      }
    } else {
      result[k] = v;
    }
  }

  result.updatedAt = new Date().toISOString();
  return result;
}

function verifySignature(params) {
  const timestamp = params.timestamp || '';
  const nonce = params.nonce || '';
  const friendIds = params.friendIds || '';
  const userId = params.userId || '';
  const signature = params.signature || '';
  const data = `${timestamp}${nonce}${friendIds}${userId}${SECRET_KEY}`;
  const hash = crypto.createHash('sha1').update(data).digest('hex');
  return hash === signature;
}

// Simple JSON file persistence for leaderboard (like original SAVE_FILE)
const SAVE_FILE = path.join(process.cwd(), 'leaderboard.json');

function loadLeaderboard() {
  try {
    if (fs.existsSync(SAVE_FILE)) {
      const raw = fs.readFileSync(SAVE_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return {};
}

function saveLeaderboard(leaderboard) {
  try {
    fs.writeFileSync(SAVE_FILE, JSON.stringify(leaderboard), 'utf8');
  } catch (e) {
    console.error('Failed to save leaderboard', e);
  }
}

module.exports = {
  safeParse,
  ensureTableExists,
  ensureRowExists,
  applySpecialMerge,
  verifySignature,
  loadLeaderboard,
  saveLeaderboard,
};
