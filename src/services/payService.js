const { getMainDb } = require('../config/db');
const { ensureTableExists, ensureRowExists, safeParse } = require('../utils/helpers');
const { usersWealth, usersProps } = require('../state/memory');

async function getWealth(userId) {
  try {
    const table = await ensureTableExists('UserData');
    const defaultWealth = {
      diamonds: 99999,
      gold: 99999,
      gDiamonds: 3000000000000000,
      gDiamondsProfit: 99999,
      money: 99999,
      ngDiamonds: 99999,
      sameUser: false,
      firstPunch: false,
    };
    await ensureRowExists(table, userId, 'wealth', defaultWealth);

    const db = getMainDb();
    return await new Promise((resolve) => {
      db.get(
        `SELECT data FROM ${table} WHERE userId=? AND subKey='wealth'`,
        [userId],
        (err, row) => {
          db.close();
          if (err) {
            return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err.message } });
          }
          const wealth = row ? safeParse(row.data, {}) : defaultWealth;
          usersWealth[userId] = wealth;
          resolve({ statusCode: 200, body: { code: 1, message: 'Success', data: { userId: String(userId), ...wealth } } });
        },
      );
    });
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

async function purchaseProps({ userId, propId, quantity, currency }) {
  try {
    const VALID_PROPS = new Set(Array.from({ length: 100 }, (_, i) => i + 1));
    if (!VALID_PROPS.has(propId)) {
      console.warn(`[WARN] Unknown propId ${propId} for user ${userId}, using default 1`);
      propId = 1;
    }

    const MAX_QUANTITY = 999999999;
    if (quantity > MAX_QUANTITY) {
      console.warn(`[WARN] Quantity ${quantity} too high for user ${userId}, clamped to ${MAX_QUANTITY}`);
      quantity = MAX_QUANTITY;
    }

    const table = await ensureTableExists('UserData');
    const defaultWealth = {
      gDiamonds: 99999,
      gDiamondsProfit: 99999,
      ngDiamonds: 99999,
      gold: 99999,
      money: 99999,
      diamonds: 99999,
    };
    await ensureRowExists(table, userId, 'wealth', defaultWealth);

    const db = getMainDb();
    return await new Promise((resolve) => {
      db.get(
        `SELECT data FROM ${table} WHERE userId=? AND subKey='wealth'`,
        [userId],
        (err, row) => {
          if (err) {
            db.close();
            return resolve({ statusCode: 500, body: { code: 0, message: 'Error', error: err.message } });
          }

          const wealthData = safeParse(row?.data, { ...defaultWealth });
          if (typeof wealthData[currency] !== 'number') wealthData[currency] = 0;
          const deductAmount = Math.min(quantity, wealthData[currency]);
          wealthData[currency] -= deductAmount;

          const dataStr = JSON.stringify(wealthData);
          db.run(
            `INSERT OR REPLACE INTO ${table} (userId, subKey, data) VALUES (?, 'wealth', ?)`,
            [userId, dataStr],
            (err2) => {
              db.close();
              if (err2) {
                return resolve({ statusCode: 500, body: { code: 0, message: 'Error', error: err2.message } });
              }

              usersWealth[userId] = wealthData;
              if (!usersProps[userId]) usersProps[userId] = {};
              usersProps[userId][propId] = (usersProps[userId][propId] || 0) + deductAmount;

              const responseData = {
                userId,
                propId,
                quantity: deductAmount,
                currentGCube: parseInt(wealthData.gDiamonds || 0, 10),
                ...wealthData,
                sameUser: false,
                firstPunch: false,
              };

              return resolve({ statusCode: 200, body: { code: 1, message: 'Success', data: responseData } });
            },
          );
        },
      );
    });
  } catch (e) {
    return { statusCode: 500, body: { code: 0, message: 'Error', error: e.message } };
  }
}

function getRechargeSum({ userId, gameId }) {
  return {
    statusCode: 200,
    body: {
      code: 1,
      message: 'Success',
      data: { userId, gameId, gDiamondSum: 0 },
    },
  };
}

function hasUserRecharge(userId) {
  return {
    statusCode: 200,
    body: {
      code: 1,
      message: 'Success',
      data: { userId, hasRecharge: false },
    },
  };
}

module.exports = {
  getWealth,
  purchaseProps,
  getRechargeSum,
  hasUserRecharge,
};
