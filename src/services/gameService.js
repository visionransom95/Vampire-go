const RECENT_GAMES = [
  { gameId: "g1046", name: "BedWars Lobby", category: "lobby" }
];

const RECOMMENDED_GAMES = [
  {
    gameId: "g1046",
    gameTitle: "BedWars Lobby",
    gameCoverPic: "http://static.sandboxol.com/sandbox/games/images/g1008-1597206565180.png",
    visitorEnter: 0,
    praiseNumber: 0,
    gameTypes: ["Role-Play", "Multi-Player Competition", "Action", "Survival"],
    likeability: "95%"
  }
];

// --- Game endpoints ---
function getRecentlyPlayed({ isFilter }) {
  return {
    statusCode: 200,
    body: { code: 1, message: "Success", data: RECENT_GAMES }
  };
}

function getRecommended({ isFilter, os }) {
  return {
    statusCode: 200,
    body: {
      code: 1,
      message: "Success",
      data: RECOMMENDED_GAMES
    }
  };
}

function getGameById(id) {
  // Normalize input: allow number, string number, or "g1046"
  const idStr = String(id).toLowerCase();
  if (idStr !== "g1046" && idStr !== "1046") return null;

  return {
    id: 1046,
    gameId: "g1046",
    name: "BedWars Lobby",
    category: "lobby",
    version: 1,
    engineVersion: 90001,
    mapId: 1046,
    updateTime: Date.now(),
    resources: [],
    configs: {}
  };
}

function getMore({ isFilter, os, pageNo, pageSize }) {
  const all = [...RECENT_GAMES, ...RECOMMENDED_GAMES];
  const start = pageNo * pageSize;
  const page = all.slice(start, start + pageSize);

  return {
    statusCode: 200,
    body: { code: 1, message: "Success", data: page }
  };
}

// --- Editor config endpoint ---
function getGameDetailToEditor() {
  return {
    statusCode: 200,
    body: {
      code: 1,
      message: "Success",
      data: { editable: true, defaultMapId: 1046 }
    }
  };
}

// --- User endpoints ---
function getUserSegmentInfo(userId) {
  return {
    statusCode: 200,
    body: {
      code: 1,
      message: "Success",
      data: { userId, segment: "Bronze", rank: 1, score: 1000 }
    }
  };
}

function checkPasswordParam(type) {
  return {
    statusCode: 404,
    body: { code: 0, message: "Endpoint not implemented" }
  };
}

// --- Decoration endpoints ---
function getDecorationResource(userId, typeId, os, engineVersion) {
  return {
    statusCode: 200,
    body: {
      code: 1,
      message: "Success",
      data: []
    }
  };
}

function getDressListByType(language, userId, typeId, os, engineVersion) {
  return {
    statusCode: 200,
    body: {
      code: 1,
      message: "Success",
      data: []
    }
  };
}

// Export API
module.exports = {
  getRecentlyPlayed,
  getRecommended,
  getGameById,
  getMore,
  getGameDetailToEditor,
  getUserSegmentInfo,
  checkPasswordParam,
  getDecorationResource,
  getDressListByType
};
