const { players } = require('../state/memory');

function getPlayerIdentityConfig() {
  return { statusCode: 200, body: { code: 1, message: 'Success', data: {} } };
}

function getTreasureboxTimeline() {
  return { statusCode: 200, body: { code: 1, message: 'Success', data: [] } };
}

function getSettlementRule() {
  return { statusCode: 200, body: { code: 1, message: 'Success', data: { rules: [] } } };
}

function getBlockmodsConfigV1() {
  return { statusCode: 200, body: { code: 1, message: 'Success', data: {} } };
}

function collectGameProps({ userId, gameId, gamePropsId, propsAmount, expiryDate }) {
  if (!userId) {
    return { statusCode: 400, body: { code: 400, message: 'Missing userId' } };
  }

  if (!players[userId]) players[userId] = { props: {} };
  const p = players[userId].props;
  p[gamePropsId] = (p[gamePropsId] || 0) + propsAmount;

  console.log(`Added ${propsAmount} of ${gamePropsId} to player ${userId} (expiry ${expiryDate} sec, gameId=${gameId})`);

  return { statusCode: 200, body: { code: 200, message: 'OK' } };
}

module.exports = {
  getPlayerIdentityConfig,
  getTreasureboxTimeline,
  getSettlementRule,
  collectGameProps,
  getBlockmodsConfigV1,
};
