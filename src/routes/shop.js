const express = require('express');

const router = express.Router();

// GET /shop/api/v1/new/shop/decorations/:id
router.get('/api/v1/new/shop/decorations/:id', (req, res) => {
  const id = Number(req.params.id);
  const { os = 'android', engineVersion = '90001' } = req.query;

  return res.status(200).json({
    code: 1,
    message: 'Success',
    data: {
      shopId: id,
      os,
      engineVersion: Number(engineVersion),
      decorations: [],
    },
  });
});

module.exports = router;
