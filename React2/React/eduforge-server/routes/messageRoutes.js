const express = require('express');
const router = express.Router();

router.get('/all', (req, res) => {
  res.json([
    { _id: '1', name: 'Admin', text: 'Welcome to EduForge!' },
    { _id: '2', name: 'System', text: 'Platform in beta' },
  ]);
});

module.exports = router;
