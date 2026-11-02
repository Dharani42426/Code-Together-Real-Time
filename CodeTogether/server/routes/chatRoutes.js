const express = require('express');
const router = express.Router();
const { getChatHistory, sendMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

router.get('/:roomId', protect, getChatHistory);
router.post('/:roomId', protect, sendMessage);

module.exports = router;
