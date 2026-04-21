const path = require('path');

const PORT = parseInt(process.env.PORT || '38199', 10);
const SQLITE_FILE = process.env.SQLITE_FILE || path.join(process.cwd(), 'blockmango.db');
const GAMEAIDE_DB_FILE = process.env.GAMEAIDE_DB_FILE || path.join(process.cwd(), 'gameaide.db');
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const SECRET_KEY = process.env.SECRET_KEY || 'pq0194mxoqfh48L362G6R09T737E273X';

module.exports = {
  PORT,
  SQLITE_FILE,
  GAMEAIDE_DB_FILE,
  REDIS_HOST,
  REDIS_PORT,
  SECRET_KEY,
};
