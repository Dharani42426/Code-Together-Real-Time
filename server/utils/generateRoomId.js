const Room = require('../models/Room');

const generateRoomId = async () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let roomId;
  let exists = true;

  while (exists) {
    roomId =
      'CT-' +
      Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    exists = await Room.findOne({ roomId });
  }

  return roomId;
};

const generateToken = (id) => {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

const successResponse = (res, statusCode, message, data = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const errorResponse = (res, statusCode, message, error = '') => {
  return res.status(statusCode).json({ success: false, message, error });
};

module.exports = { generateRoomId, generateToken, successResponse, errorResponse };
