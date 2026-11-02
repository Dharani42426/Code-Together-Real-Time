const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getLeaderboard,
  getNotifications,
  markNotificationRead,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/leaderboard', getLeaderboard);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/:id/read', protect, markNotificationRead);

module.exports = router;
