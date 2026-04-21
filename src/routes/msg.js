const express = require('express');

const router = express.Router();

// GET /msg/api/v1/msg/group/chat/list
router.get('/api/v1/msg/group/chat/list', (req, res) => {
  const { pageNo = '0', pageSize = '20' } = req.query;

  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      pageNo: Number(pageNo),
      pageSize: Number(pageSize),
      total: 0,
      chats: [],
    },
  });
});

module.exports = router;
