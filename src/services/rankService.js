const { LEADERBOARD } = require('../state/memory');
const { saveLeaderboard } = require('../utils/helpers');
const { client } = require('../config/redis');

async function getZScore(setName, member) {
  try {
    const score = await client.zScore(setName, String(member));
    return score !== null ? score : 0;
  } catch (error) {
    console.error('Redis ZSCORE error:', error);
    return 0;
  }
}

async function handleExpireRequest() {
  return { statusCode: 200, body: { status: 'ok' } };
}

function getRankList({ start, end }) {
  const ranks = [{ userId: 112, score: 9999 }];
  return { statusCode: 200, body: { code: 1, message: 'Success', data: ranks.slice(start, end) } };
}

async function handleRankRequest(data) {
  const action = data.action;
  const userId = data.user_id ? String(data.user_id) : null;
  const memberId = data.member || userId; // Support both member and user_id
  const isNew = data.isNew === '1' || data.isNew === 1;
  const key = data.key || '';
  const timestamp = data.timestamp || Date.now();
  const nonce = data.nonce || '';
  const signature = data.signature || '';

  try {
    // Handle game rank request (new format)
    if (key && memberId) {
      const [gameId, scoreType, period, weekNumber] = key.split('.');
      
      // Try to get score from Redis first, fallback to in-memory
      let score = await getZScore(key, memberId);
      if (score === 0 && LEADERBOARD[memberId]) {
        score = LEADERBOARD[memberId];
      }
      
      // Get rank from Redis if available
      let rank = 0;
      try {
        const rankResult = await client.zRevRank(key, String(memberId));
        rank = rankResult !== null ? rankResult + 1 : 0; // Convert from 0-based to 1-based
      } catch (error) {
        console.error('Error getting rank from Redis:', error);
      }
      
      return {
        statusCode: 200,
        body: {
          code: 1,
          message: 'Success',
          data: {
            rank,
            score,
            member: memberId,
            key,
            isNew: isNew ? 1 : 0,
            timestamp: parseInt(timestamp, 10) || Date.now(),
            nonce: nonce || '0',
            signature
          }
        }
      };
    }

    // Original action-based logic
    if (action === 'get') {
      if (userId) {
        const score = LEADERBOARD[userId] || 0;
        return { statusCode: 200, body: { user_id: userId, score } };
      }
      const leaderboardList = Object.entries(LEADERBOARD).map(([k, v]) => ({ user_id: k, score: v }));
      leaderboardList.sort((a, b) => b.score - a.score);
      return { statusCode: 200, body: { leaderboard: leaderboardList } };
    }

    if (action === 'set') {
      if (!userId || typeof data.score === 'undefined') {
        return { statusCode: 400, body: { error: 'user_id and score required' } };
      }
      const score = parseInt(data.score, 10) || 0;
      
      // Update both Redis and in-memory leaderboard
      try {
        if (data.key) {
          await client.zAdd(data.key, { score, value: String(userId) });
        }
        LEADERBOARD[userId] = score;
        saveLeaderboard(LEADERBOARD);
        return { statusCode: 200, body: { status: 'ok', user_id: userId, score } };
      } catch (error) {
        console.error('Error updating score:', error);
        return { statusCode: 500, body: { error: 'Failed to update score' } };
      }
    }
  } catch (e) {
    return { statusCode: 500, body: { error: e.message } };
  }
}

module.exports = {
  getRankList,
  handleRankRequest,
  handleExpireRequest,
};
