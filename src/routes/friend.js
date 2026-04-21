const express = require('express');

const router = express.Router();

// GET /friend/api/v2/friends/status
router.get('/api/v2/friends/status', (req, res) => {
  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      friends: [],
      requests: [],
    },
  });
});

module.exports = router;
