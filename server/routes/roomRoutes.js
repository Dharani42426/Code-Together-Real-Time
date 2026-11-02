const express = require('express');
const router = express.Router();
const {
  createRoom, joinRoom, getRoom, getMyRooms, getPublicRooms, updateRoom, deleteRoom,
  addFile, updateFile, deleteFile, getCodeHistory, saveCodeVersion, getUserCodeHistory,
} = require('../controllers/roomController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, createRoom);
router.post('/join', protect, joinRoom);
router.get('/my-rooms', protect, getMyRooms);
router.get('/public', protect, getPublicRooms);
router.get('/user/history', protect, getUserCodeHistory);
router.get('/:roomId', protect, getRoom);
router.put('/:roomId', protect, updateRoom);
router.delete('/:roomId', protect, deleteRoom);

router.post('/:roomId/files', protect, addFile);
router.put('/:roomId/files/:fileId', protect, updateFile);
router.delete('/:roomId/files/:fileId', protect, deleteFile);

router.get('/:roomId/history', protect, getCodeHistory);
router.post('/:roomId/history', protect, saveCodeVersion);

module.exports = router;
