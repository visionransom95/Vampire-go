const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { logRequestResponse } = require('./middleware/logger');

// Import routes
const rootRouter = require('./routes/root');
const configRouter = require('./routes/config');
const gameDataRouter = require('./routes/gameData');
const gameRouter = require('./routes/game');
const payRouter = require('./routes/pay');
const gameaideRouter = require('./routes/gameaide');
const userRouter = require('./routes/user');
const decorationRouter = require('./routes/decoration');
const activityRouter = require('./routes/activity');
const charmingtownRouter = require('./routes/charmingtown');
const rankRouter = require('./routes/rank');
const friendRouter = require('./routes/friend');
const shopRouter = require('./routes/shop');
const msgRouter = require('./routes/msg');
const clanRouter = require('./routes/clan');
const mailboxRouter = require('./routes/mailbox');
const gameRoutes = require('./routes/gameRoutes');

const app = express();

// ======================
// Security Middleware
// ======================
app.use(helmet());

// ======================
// Rate Limiting
// ======================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100000, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { 
    code: 0, 
    message: 'Too many requests, please try again later.' 
  }
});

// Apply rate limiting to all routes
app.use(apiLimiter);

// ======================
// Body Parser
// ======================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ 
  extended: true, 
  limit: '100000kb' 
}));

// ======================
// CORS Configuration
// ======================
const corsOptions = {
  origin: [
    'https://BliXO-Api-Inner.com',
    'http://localhost:38199',
    'http://127.0.0.1:38199',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// ======================
// Health Check Endpoint
// ======================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});

// ======================
// Request Timeout
// ======================
app.use((req, res, next) => {
  res.setTimeout(10000, () => {
    res.status(503).json({ 
      code: 0, 
      message: 'Request timeout' 
    });
  });
  next();
});

// ======================
// Logging
// ======================
app.use(morgan('dev'));
app.use(logRequestResponse);

// ======================
// Routes
// ======================
app.use('/', rootRouter);
app.use('/', configRouter);
app.use('/api/v2/game', gameDataRouter);
app.use('/', gameRouter);
app.use('/pay', payRouter);
app.use('/gameaide', gameaideRouter);
app.use('/user', userRouter);
app.use('/decoration', decorationRouter);
app.use('/activity', activityRouter);
app.use('/charmingtown', charmingtownRouter);
app.use('/api', rankRouter);
app.use('/friend', friendRouter);
app.use('/shop', shopRouter);
app.use('/msg', msgRouter);
app.use('/clan', clanRouter);
app.use('/mailbox', mailboxRouter);
app.use('', gameRoutes); // Mount game routes at /v1/game-map
app.use(express.static('public'));

// ======================
// Error Handling
// ======================
// 404 Handler
app.use((req, res) => {
  res.status(404).json({ 
    code: 0, 
    message: 'Endpoint not found' 
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    code: 0, 
    message: 'Internal Server Error' 
  });
});

// ======================
// Server Configuration
// ======================
const PORT = process.env.PORT || 38199;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server events
server.on('connection', (socket) => {
  socket.setTimeout(30 * 1000); // 30 seconds
  console.log('New connection established');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  server.close(() => process.exit(1));
});

module.exports = { app, server };
