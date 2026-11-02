const mongoose = require('mongoose');

const codeHistorySchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      default: 'main',
    },
    version: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      default: 'Auto-saved',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CodeHistory', codeHistorySchema);
