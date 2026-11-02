const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: { type: String, required: true },
  language: { type: String, default: 'javascript' },
  content: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['owner', 'editor', 'viewer'], default: 'editor' },
  joinedAt: { type: Date, default: Date.now },
});

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      maxlength: [100, 'Room name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    language: {
      type: String,
      default: 'javascript',
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String,
      default: '',
      select: false,
    },
    maxParticipants: {
      type: Number,
      default: 10,
      min: 2,
      max: 50,
    },
    participants: [participantSchema],
    activeUsers: [
      {
        userId: String,
        username: String,
        socketId: String,
      },
    ],
    code: {
      type: String,
      default: '',
    },
    files: [fileSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
