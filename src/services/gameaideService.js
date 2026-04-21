const { parties, partyCooldowns } = require('../state/memory');
const { getGameaideDb } = require('../config/db');

const PARTY_COOLDOWNS = { create: 300, rename: 60 };

async function createOrRenameParty({ userId, gameId, name, type }) {
  const now = Date.now() / 1000;
  const userCds = partyCooldowns[userId] || { create: 0, rename: 0 };

  const existingParty = Object.values(parties).find(
    (p) => p.ownerId === userId && p.type === type,
  );

  if (existingParty) {
    const remaining = PARTY_COOLDOWNS.rename - (now - (userCds.rename || 0));
    if (remaining > 0) {
      return {
        statusCode: 429,
        body: {
          code: 2,
          message: `Rename cooldown active. Wait ${Math.floor(remaining)} seconds.`,
          cooldown: Math.floor(remaining),
        },
      };
    }
    existingParty.name = name;
    userCds.rename = now;
    partyCooldowns[userId] = userCds;
    return {
      statusCode: 200,
      body: { code: 1, message: 'Success', data: existingParty, cooldown: PARTY_COOLDOWNS.rename },
    };
  }

  const remaining = PARTY_COOLDOWNS.create - (now - (userCds.create || 0));
  if (remaining > 0) {
    return {
      statusCode: 429,
      body: {
        code: 2,
        message: `Create cooldown active. Wait ${Math.floor(remaining)} seconds.`,
        cooldown: Math.floor(remaining),
      },
    };
  }

  const partyId = `party_${Object.keys(parties).length + 1}`;
  const party = {
    partyId,
    gameId,
    ownerId: userId,
    name,
    members: [userId],
    type,
  };
  parties[partyId] = party;
  userCds.create = now;
  partyCooldowns[userId] = userCds;

  return {
    statusCode: 200,
    body: { code: 1, message: 'Success', data: party, cooldown: PARTY_COOLDOWNS.create },
  };
}

function listParties({ gameId, type }) {
  const filtered = Object.values(parties).filter(
    (p) => p.gameId === gameId && String(p.type) === String(type),
  );
  return { statusCode: 200, body: { code: 1, message: 'Success', data: filtered } };
}

function likeParty({ userId, targetUserId }) {
  return {
    statusCode: 200,
    body: { code: 1, message: 'Success', data: { userId, targetUserId, likes: 0 } },
  };
}

function getMyGameBuild({ userId, gameId }) {
  const buildData = {
    userId,
    gameId,
    buildGroups: [
      {
        groupId: userId,
        role: 'master',
        members: [],
      },
    ],
  };
  return { statusCode: 200, body: { code: 1, message: 'Success', data: buildData } };
}

function msgSend(payload) {
  console.log('Received message request:', payload);
  return { statusCode: 200, body: { code: 0, message: 'Message sent successfully' } };
}

async function segmentInfo(userId) {
  const table = 'UserSegmentInfo';
  const SEGMENTS = [
    [0, 1000],
    [1, 1100],
    [2, 1300],
    [3, 1600],
    [4, 2100],
  ];

  const db = getGameaideDb();

  return await new Promise((resolve) => {
    db.serialize(() => {
      db.run(
        `CREATE TABLE IF NOT EXISTS ${table} (
          userId INTEGER PRIMARY KEY,
          subKey TEXT NOT NULL DEFAULT 'default',
          integral INTEGER NOT NULL DEFAULT 1000,
          segment INTEGER NOT NULL DEFAULT 0,
          rank INTEGER NOT NULL DEFAULT 0,
          timeRemains INTEGER NOT NULL DEFAULT 0,
          needReward INTEGER NOT NULL DEFAULT 0,
          data TEXT NOT NULL DEFAULT '{}' 
        )`,
      );

      db.get(
        `SELECT userId FROM ${table} WHERE userId=? AND subKey='default'`,
        [userId],
        (err, row) => {
          if (err) {
            db.close();
            return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err.message } });
          }
          const ensureUser = (cb) => {
            if (row) return cb();
            db.run(
              `INSERT INTO ${table} (userId, subKey, data) VALUES (?, 'default', '{}')`,
              [userId],
              (err2) => {
                if (err2) {
                  db.close();
                  return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: err2.message } });
                }
                cb();
              },
            );
          };

          ensureUser(() => {
            db.all(`SELECT userId, integral FROM ${table}`, [], (e2, allUsers) => {
              if (e2) {
                db.close();
                return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: e2.message } });
              }

              const segForIntegral = (integral) => {
                let seg = 0;
                for (let i = SEGMENTS.length - 1; i >= 0; i -= 1) {
                  const [s, minIntegral] = SEGMENTS[i];
                  if (integral >= minIntegral) return s;
                }
                return seg;
              };

              const updateSegStmt = db.prepare(
                `UPDATE ${table} SET segment=? WHERE userId=?`,
              );
              for (const u of allUsers || []) {
                const segment = segForIntegral(u.integral);
                updateSegStmt.run([segment, u.userId]);
              }
              updateSegStmt.finalize();

              db.all(
                `SELECT userId, integral FROM ${table} ORDER BY integral DESC, userId ASC`,
                [],
                (e3, rankedUsers) => {
                  if (e3) {
                    db.close();
                    return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: e3.message } });
                  }

                  let currentRank = 0;
                  let lastIntegral = null;
                  const updateRankStmt = db.prepare(
                    `UPDATE ${table} SET rank=? WHERE userId=?`,
                  );
                  (rankedUsers || []).forEach((row, i) => {
                    const uid = row.userId;
                    const integral = row.integral;
                    if (uid == null || integral == null) {
                      return;
                    }
                    if (lastIntegral !== null && integral < lastIntegral) {
                      currentRank = i;
                    }
                    updateRankStmt.run([currentRank, uid]);
                    lastIntegral = integral;
                  });
                  updateRankStmt.finalize();

                  db.get(
                    `SELECT userId, segment, rank, integral, timeRemains, needReward FROM ${table} WHERE userId=?`,
                    [userId],
                    (e4, row2) => {
                      db.close();
                      if (e4) {
                        return resolve({ statusCode: 500, body: { code: 4, message: 'inner error', detail: e4.message } });
                      }
                      const data = {
                        userId: row2.userId,
                        segment: row2.segment,
                        rank: row2.rank,
                        integral: row2.integral,
                        timeRemains: row2.timeRemains,
                        needReward: row2.needReward,
                      };
                      return resolve({ statusCode: 200, body: { code: 1, message: 'Success', data } });
                    },
                  );
                },
              );
            });
          });
        },
      );
    });
  });
}

function stageReportG1055(payload, meta) {
  console.log('Received stage report g1055', {
    headers: meta.headers,
    payload,
    remote_addr: meta.remote_addr,
    path: meta.path,
    method: meta.method,
  });
  return { statusCode: 200, body: { code: 0, message: 'ok' } };
}

module.exports = {
  createOrRenameParty,
  listParties,
  likeParty,
  getMyGameBuild,
  msgSend,
  segmentInfo,
  stageReportG1055,
};
