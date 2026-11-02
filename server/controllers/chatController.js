const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/generateRoomId');

// @desc    Get chat history for a room
// @route   GET /api/chat/:roomId
// @access  Private
const getChatHistory = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await Message.find({ roomId: req.params.roomId.toUpperCase() })
      .populate('sender', 'name profileImage')
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, 'Chat history fetched', { messages });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch chat history', error.message);
  }
};

// @desc    Send a message (REST fallback)
// @route   POST /api/chat/:roomId
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return errorResponse(res, 400, 'Message is required');

    const newMessage = await Message.create({
      roomId: req.params.roomId.toUpperCase(),
      sender: req.user._id,
      senderName: req.user.name,
      message,
    });

    await newMessage.populate('sender', 'name profileImage');
    return successResponse(res, 201, 'Message sent', { message: newMessage });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to send message', error.message);
  }
};

module.exports = { getChatHistory, sendMessage };
