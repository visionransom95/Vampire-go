const { loadLeaderboard } = require('../utils/helpers');

// In-memory stores mirroring the Python globals
const usersWealth = {}; // userId -> wealth object
const usersTasks = {};
const usersAchievements = {};
const usersProps = {}; // userId -> { propId: count }
const usersRanks = {};
const parties = {}; // partyId -> party data
const partyCooldowns = {}; // userId -> { create, rename }
const players = {}; // used by collect_game_props_route

// Load leaderboard from disk once (like Python SAVE_FILE)
const LEADERBOARD = loadLeaderboard();

module.exports = {
  usersWealth,
  usersTasks,
  usersAchievements,
  usersProps,
  usersRanks,
  parties,
  partyCooldowns,
  players,
  LEADERBOARD,
};
