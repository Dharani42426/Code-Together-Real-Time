const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: [true, 'Message cannot be empty'],
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    type: {
      type: String,
      enum: ['text', 'system', 'code'],
      default: 'text',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);
