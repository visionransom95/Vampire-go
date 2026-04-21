const express = require('express');

const router = express.Router();

// GET /mailbox/api/v1/mail/new
router.get('/api/v1/mail/new', (req, res) => {
  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      hasNew: false,
      mails: [],
    },
  });
});

// GET /mailbox/api/v1/mail
router.get('/api/v1/mail', (req, res) => {
  const headerUserId = req.headers['userid'] || req.headers['userId'];
  const userId = Number(headerUserId || 0);

  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      userId,
      mails: [],
    },
  });
});

module.exports = router;
