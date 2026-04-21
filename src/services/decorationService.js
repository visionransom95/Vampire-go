const { getMainDb } = require('../config/db');
const { ensureTableExists, ensureRowExists, safeParse } = require('../utils/helpers');
const skinData = require('../Jsons/skin.json');

async function getDecorationTable() {
  return ensureTableExists('Decorations');
}

async function getPlayerDecorations(playerId) {
  const table = await getDecorationTable();
  await ensureRowExists(table, playerId, 'equipped', { current: null, all: [] });
  const db = getMainDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT data FROM ${table} WHERE userId=? AND subKey='equipped'`,
      [playerId],
      (err, row) => {
        db.close();
        if (err) return reject(err);
        const data = row ? safeParse(row.data, { current: null, all: [] }) : { current: null, all: [] };
        resolve(data);
      },
    );
  });
}

async function savePlayerDecorations(playerId, decorations) {
  const table = await getDecorationTable();
  const db = getMainDb();
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE ${table} SET data=? WHERE userId=? AND subKey='equipped'`,
      [JSON.stringify(decorations), playerId],
      (err) => {
        db.close();
        if (err) return reject(err);
        resolve();
      },
    );
  });
}

async function getUsing(playerId) {
  try {
    const decorations = await getPlayerDecorations(playerId);
    return { statusCode: 200, body: { code: 1, message: 'Success', data: decorations } };
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

async function setUsing(playerId, decorationId) {
  try {
    const decorations = await getPlayerDecorations(playerId);
    if (decorationId) {
      decorations.current = decorationId;
      if (!decorations.all.includes(decorationId)) decorations.all.push(decorationId);
      await savePlayerDecorations(playerId, decorations);
    }
    return { statusCode: 200, body: { code: 1, message: 'Success', data: decorations } };
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

async function equipDecoration(playerId, decorationId) {
  if (!decorationId) {
    return { statusCode: 400, body: { code: 3, message: 'decorationId required' } };
  }
  try {
    const decorations = await getPlayerDecorations(playerId);
    decorations.current = decorationId;
    if (!decorations.all.includes(decorationId)) decorations.all.push(decorationId);
    await savePlayerDecorations(playerId, decorations);
    return { statusCode: 200, body: { code: 1, message: 'Success', data: decorations } };
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

async function removeDecoration(playerId, decorationId) {
  try {
    const decorations = await getPlayerDecorations(playerId);
    if (decorationId != null) {
      const idx = decorations.all.indexOf(decorationId);
      if (idx !== -1) decorations.all.splice(idx, 1);
      if (decorations.current === decorationId) decorations.current = null;
      await savePlayerDecorations(playerId, decorations);
    }
    return { statusCode: 200, body: { code: 1, message: 'Success', data: decorations } };
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

async function getAllDecorations(playerId) {
  try {
    const decorations = await getPlayerDecorations(playerId);
    return { statusCode: 200, body: { code: 1, message: 'Success', data: decorations } };
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

// ---- Clothes logic (ported from reference decorations.js) ----

async function getClothesTable() {
  return ensureTableExists('Clothes');
}

async function getUserClothesFromDb(userId) {
  const table = await getClothesTable();
  const defaultData = {
    userId,
    wings: 0,
    glasses: 0,
    shoes: 1,
    pants: 1,
    tops: 1,
    hair: 1,
  };

  await ensureRowExists(table, userId, 'equipped', defaultData);
  const db = getMainDb();
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT data FROM ${table} WHERE userId=? AND subKey='equipped'`,
      [userId],
      (err, row) => {
        db.close();
        if (err) return reject(err);
        const data = row ? safeParse(row.data, defaultData) : defaultData;
        resolve(data);
      },
    );
  });
}

// Catalog from skin.json
function getDecorationsByType(typeId) {
  const all = Array.isArray(skinData.data) ? skinData.data : [];
  if (typeId === 0) {
    return all.filter((item) => item.status === 1);
  }
  return all.filter((item) => item.typeId === typeId && item.status === 1);
}

// Public API for /decoration/api/v1/inner/clothes
async function getClothes(userId) {
  try {
    const data = await getUserClothesFromDb(userId);
    return {
      statusCode: 200,
      body: {
        code: 1,
        message: 'Success',
        data,
      },
    };
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

module.exports = {
  getUsing,
  setUsing,
  equipDecoration,
  removeDecoration,
  getAllDecorations,
  getClothes,
  getDecorationsByType,
};
