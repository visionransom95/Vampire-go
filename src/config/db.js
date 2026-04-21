const sqlite3 = require('sqlite3').verbose();
const { SQLITE_FILE, GAMEAIDE_DB_FILE } = require('./env');

function getMainDb() {
  return new sqlite3.Database(SQLITE_FILE);
}

function getGameaideDb() {
  return new sqlite3.Database(GAMEAIDE_DB_FILE);
}

module.exports = { getMainDb, getGameaideDb };
