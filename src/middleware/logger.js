const fs = require('fs');
const os = require('os');
const path = require('path');

const LOG_FILE = path.join(os.tmpdir(), 'http_requests.log');

function logRequestResponse(req, res, next) {
  const start = Date.now();
  const chunks = [];
  const oldJson = res.json.bind(res);

  // Capture JSON responses
  res.json = (body) => {
    chunks.push(body);
    return oldJson(body);
  };

  res.on('finish', () => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl || req.url,
      query: req.query,
      headers: req.headers,
      body: req.body,
      response: chunks[0] ?? { statusCode: res.statusCode },
      durationMs: Date.now() - start,
    };

    try {
      fs.appendFileSync(LOG_FILE, JSON.stringify(logEntry) + '\n', { encoding: 'utf8' });
    } catch (e) {
      console.error('Failed to write log entry', e);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log(JSON.stringify(logEntry, null, 2));
    }
  });

  next();
}

module.exports = { logRequestResponse, LOG_FILE };
