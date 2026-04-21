const { getMainDb } = require('../config/db');

async function getUserDetails(userId) {
  if (!userId) {
    return { statusCode: 400, body: { code: 4, message: 'userId cannot be null' } };
  }

  const db = getMainDb();

  return await new Promise((resolve) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS UserDetails (
          userId INTEGER PRIMARY KEY,
          nickName TEXT NOT NULL,
          level INTEGER DEFAULT 1,
          experience INTEGER DEFAULT 0
        )`
      );

      db.get(
        'SELECT * FROM UserDetails WHERE userId=?',
        [userId],
        (err, row) => {
          if (err) {
            db.close();
            return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err.message } });
          }

          const insertIfMissing = (cb) => {
            if (row) return cb(row);

            const user = {
              userId,
              nickName: 'Gyt3lyz',
              level: 1,
              experience: 0,
            };

            db.run(
              'INSERT INTO UserDetails (userId, nickName, level, experience) VALUES (?, ?, ?, ?)',
              [user.userId, user.nickName, user.level, user.experience],
              (err2) => {
                if (err2) {
                  db.close();
                  return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err2.message } });
                }
                cb(user);
              }
            );
          };

          insertIfMissing((u) => {
            db.close();
            const base = row || u;
            const userObj = {
              userId: base.userId,
              nickName: base.nickName,
              level: base.level,
              experience: base.experience,
              appearance: {
                hairId: 5,
                faceId: 3,
                topsId: 12,
                pantsId: 8,
                shoesId: 4,
                glassesId: 0,
                scarfId: 0,
                wingId: 2,
                hatId: 1,
                decoratehatId: 0,
                armId: 0,
                extrawingId: 0,
                footHaloId: 0,
                skinColor: { r: 0.85, g: 0.7, b: 0.6, a: 1.0 },
              },
            };

            return resolve({ statusCode: 200, body: { code: 1, message: 'Success', data: userObj } });
          });
        }
      );
    });
  });
}

async function loginAppV2({ uid, password, hasPassword, appType, needReward }) {
  if (!uid) {
    return { statusCode: 400, body: { code: 4, message: 'uid cannot be null' } };
  }

  const db = getMainDb();

  return await new Promise((resolve) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS Accounts (
          account TEXT PRIMARY KEY,
          userId INTEGER,
          type INTEGER
        )`
      );

      db.get(
        'SELECT * FROM Accounts WHERE account=?',
        [uid],
        (err, row) => {
          if (err) {
            db.close();
            return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err.message } });
          }

          const ensureRow = (cb) => {
            if (row) return cb(row);

            const userId = 112;
            db.run(
              'INSERT OR IGNORE INTO Accounts (account, userId, type) VALUES (?, ?, ?)',
              [uid, userId, 0],
              (err2) => {
                if (err2) {
                  db.close();
                  return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err2.message } });
                }
                cb({ account: uid, userId, type: 0 });
              }
            );
          };

          ensureRow((acc) => {
            db.close();
            const data = {
              userId: acc.userId,
              uid,
              token: 'mock-token',
              hasPassword: !!hasPassword,
            };
            return resolve({ statusCode: 200, body: { code: 1, message: 'Success', data } });
          });
        }
      );
    });
  });
}

module.exports = { getUserDetails, loginAppV2 };