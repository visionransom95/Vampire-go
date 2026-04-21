const express = require('express');

const router = express.Router();

// GET /clan/api/v1/clan/tribe/id
router.get('/api/v1/clan/tribe/id', (req, res) => {
  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      hasClan: false,
      clanId: null,
    },
  });
});

module.exports = router;
