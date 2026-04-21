function sellManor(userId) {
  console.log(`sellManor called for UserId=${userId}`);
  return { statusCode: 200, body: {} };
}

function manorPayResult(userId) {
  console.log(`manorPayResult called for UserId=${userId}`);
  return { statusCode: 200, body: {} };
}

module.exports = {
  sellManor,
  manorPayResult,
};
