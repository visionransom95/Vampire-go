const { getMainDb } = require('../config/db');
const { ensureTableExists, ensureRowExists, safeParse, applySpecialMerge } = require('../utils/helpers');

async function getGameData({ tableName, userId, subKey }) {
  if (!tableName) {
    return { statusCode: 400, body: { code: 3, message: 'tableName required' } };
  }

  try {
    const table = await ensureTableExists(tableName);
    const db = getMainDb();

    if (userId && subKey) {
      await ensureRowExists(table, userId, subKey, {});
      return await new Promise((resolve) => {
        db.get(
          `SELECT data FROM ${table} WHERE userId=? AND subKey=?`,
          [userId, subKey],
          (err, row) => {
            db.close();
            if (err) {
              return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err.message } });
            }
            const data = row ? safeParse(row.data || row[0], {}) : {};
            resolve({ statusCode: 200, body: { code: 1, message: 'Success', data } });
          },
        );
      });
    }

    return await new Promise((resolve) => {
      db.all(`SELECT userId, subKey, data FROM ${table}`, [], (err, rows) => {
        db.close();
        if (err) {
          return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err.message } });
        }
        const data = {};
        for (const r of rows || []) {
          const key = `${r.userId}:${r.subKey}`;
          data[key] = safeParse(r.data, {});
        }
        resolve({ statusCode: 200, body: { code: 1, message: 'Success', data } });
      });
    });
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

async function setGameData({ tableName, rows }) {
  if (!tableName) {
    return { statusCode: 400, body: { code: 3, message: 'tableName required' } };
  }

  const payload = Array.isArray(rows) ? rows : [rows || {}];

  try {
    const table = await ensureTableExists(tableName);
    const db = getMainDb();

    return await new Promise((resolve) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const tasks = payload.map((row) => new Promise((resolveOne, rejectOne) => {
          const userId = parseInt(row.userId ?? 0, 10);
          const subKey = String(row.subKey ?? 'unknown');
          const rest = Object.fromEntries(Object.entries(row).filter(([k]) => k !== 'userId' && k !== 'subKey'));

          ensureRowExists(table, userId, subKey, {})
            .then(() => {
              db.get(
                `SELECT data FROM ${table} WHERE userId=? AND subKey=?`,
                [userId, subKey],
                (err, dbRow) => {
                  if (err) return rejectOne(err);
                  const existing = dbRow ? safeParse(dbRow.data, {}) : {};
                  const merged = applySpecialMerge(existing, rest);
                  const dataStr = JSON.stringify(merged);
                  db.run(
                    `UPDATE ${table} SET data=? WHERE userId=? AND subKey=?`,
                    [dataStr, userId, subKey],
                    (err2) => {
                      if (err2) return rejectOne(err2);
                      resolveOne();
                    },
                  );
                },
              );
            })
            .catch(rejectOne);
        }));

        Promise.all(tasks)
          .then(() => {
            db.run('COMMIT', (err) => {
              db.close();
              if (err) {
                return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err.message } });
              }
              return resolve({ statusCode: 200, body: { code: 1, message: 'success' } });
            });
          })
          .catch((e) => {
            db.run('ROLLBACK', () => {
              db.close();
              return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } });
            });
          });
      });
    });
  } catch (e) {
    return { statusCode: 500, body: { code: 4, message: 'inner error', detail: e.message } };
  }
}

module.exports = {
  getGameData,
  setGameData,
};
