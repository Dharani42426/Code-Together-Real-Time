const jwt = require('jsonwebtoken');
const Room = require('../models/Room');
const Message = require('../models/Message');
const User = require('../models/User');
const { getDemoUserById } = require('../utils/demoAuth');

// Debounce map for code saves: roomId -> timeout
const codeSaveTimers = {};

const socketHandler = (io) => {
  // Authenticate socket connection via JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const demoUser = getDemoUserById(decoded.id);

      if (demoUser) {
        socket.user = { ...demoUser, _id: demoUser.id, id: demoUser.id };
        return next();
      }

      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} | User: ${socket.user.name}`);

    // ─── JOIN ROOM ───────────────────────────────────────────────
    socket.on('join-room', async ({ roomId }) => {
      try {
        const room = await Room.findOne({ roomId: roomId.toUpperCase() });
        if (!room) return socket.emit('error', { message: 'Room not found' });

        socket.join(roomId);
        socket.currentRoom = roomId;

        // Add to activeUsers or update socketId if already present
        const existingIndex = room.activeUsers.findIndex(
          (u) => u.userId === socket.user._id.toString()
        );
        if (existingIndex > -1) {
          room.activeUsers[existingIndex].socketId = socket.id;
          room.activeUsers[existingIndex].username = socket.user.name;
        } else {
          room.activeUsers.push({
            userId: socket.user._id.toString(),
            username: socket.user.name,
            socketId: socket.id,
          });
        }
        await room.save();

        // Notify others in the room
        socket.to(roomId).emit('user-joined', {
          userId: socket.user._id,
          username: socket.user.name,
          socketId: socket.id,
        });

        // Send current active users list to the joining user
        const updatedRoom = await Room.findOne({ roomId: roomId.toUpperCase() });
        io.to(roomId).emit('participant-update', {
          activeUsers: updatedRoom.activeUsers,
        });

        // Send current code state to the joining user
        const initialCode = room.code || (room.files && room.files[0] ? room.files[0].content : '') || '';
        socket.emit('code-update', { code: initialCode, roomId });

        console.log(`${socket.user.name} joined room ${roomId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // ─── LEAVE ROOM ──────────────────────────────────────────────
    socket.on('leave-room', async ({ roomId }) => {
      await handleLeaveRoom(socket, io, roomId);
    });

    // ─── CODE CHANGE ─────────────────────────────────────────────
    socket.on('code-change', async ({ roomId, code, userId }) => {
      // Broadcast to everyone else in the room immediately
      socket.to(roomId).emit('code-update', { code, userId, roomId });

      // Debounce MongoDB save — only write after 2 seconds of inactivity
      if (codeSaveTimers[roomId]) clearTimeout(codeSaveTimers[roomId]);

      codeSaveTimers[roomId] = setTimeout(async () => {
        try {
          await Room.findOneAndUpdate(
            { roomId: roomId.toUpperCase() },
            { code, updatedAt: Date.now() }
          );
        } catch (err) {
          console.error('Failed to save code:', err.message);
        }
      }, 2000);
    });

    // ─── CURSOR CHANGE ───────────────────────────────────────────
    socket.on('cursor-change', ({ roomId, userId, username, position }) => {
      socket.to(roomId).emit('cursor-update', { userId, username, position });
    });

    // ─── TYPING INDICATOR ────────────────────────────────────────
    socket.on('typing', ({ roomId, username, isTyping }) => {
      socket.to(roomId).emit('typing', { username, isTyping });
    });

    // ─── SEND MESSAGE ────────────────────────────────────────────
    socket.on('send-message', async ({ roomId, message }) => {
      try {
        if (!message || !message.trim()) return;

        const newMessage = await Message.create({
          roomId: roomId.toUpperCase(),
          sender: socket.user._id,
          senderName: socket.user.name,
          message: message.trim(),
        });

        const populated = await newMessage.populate('sender', 'name profileImage');

        io.to(roomId).emit('receive-message', {
          _id: populated._id,
          sender: populated.sender,
          senderName: populated.senderName,
          message: populated.message,
          createdAt: populated.createdAt,
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ─── FILE CHANGE ─────────────────────────────────────────────
    socket.on('file-change', ({ roomId, fileId, content }) => {
      socket.to(roomId).emit('file-update', { fileId, content });
    });

    // ─── NOTIFICATION ────────────────────────────────────────────
    socket.on('notification', ({ targetUserId, type, message }) => {
      const targetSocket = [...io.sockets.sockets.values()].find(
        (s) => s.user?._id?.toString() === targetUserId
      );
      if (targetSocket) {
        targetSocket.emit('notification', { type, message });
      }
    });

    // ─── WHITEBOARD COLLABORATION ─────────────────────────────────
    socket.on('whiteboard-draw', ({ roomId, stroke }) => {
      socket.to(roomId).emit('whiteboard-draw', { stroke, userId: socket.user?._id });
    });

    socket.on('whiteboard-clear', ({ roomId }) => {
      socket.to(roomId).emit('whiteboard-clear', { userId: socket.user?._id });
    });

    // ─── VIDEO CALL & WEBRTC SIGNALING ────────────────────────────
    socket.on('join-video-call', ({ roomId, user: callUser }) => {
      socket.to(roomId).emit('user-joined-call', {
        socketId: socket.id,
        user: callUser || {
          _id: socket.user?._id,
          name: socket.user?.name,
        },
      });
    });

    socket.on('leave-video-call', ({ roomId }) => {
      socket.to(roomId).emit('user-left-call', {
        socketId: socket.id,
        userId: socket.user?._id,
      });
    });

    socket.on('video-signal', ({ to, signal }) => {
      io.to(to).emit('video-signal', {
        from: socket.id,
        user: { _id: socket.user?._id, name: socket.user?.name },
        signal,
      });
    });

    socket.on('video-media-toggle', ({ roomId, isMuted, isCameraOff, isScreenSharing }) => {
      socket.to(roomId).emit('peer-media-toggle', {
        socketId: socket.id,
        userId: socket.user?._id,
        isMuted,
        isCameraOff,
        isScreenSharing,
      });
    });

    // ─── DISCONNECT ──────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id} | User: ${socket.user?.name}`);
      if (socket.currentRoom) {
        await handleLeaveRoom(socket, io, socket.currentRoom);
      }
    });
  });
};

// Helper: remove user from activeUsers and broadcast
const handleLeaveRoom = async (socket, io, roomId) => {
  try {
    socket.leave(roomId);

    await Room.findOneAndUpdate(
      { roomId: roomId.toUpperCase() },
      { $pull: { activeUsers: { socketId: socket.id } } }
    );

    socket.to(roomId).emit('user-left', {
      userId: socket.user._id,
      username: socket.user.name,
    });

    const updatedRoom = await Room.findOne({ roomId: roomId.toUpperCase() });
    if (updatedRoom) {
      io.to(roomId).emit('participant-update', {
        activeUsers: updatedRoom.activeUsers,
      });
    }

    console.log(`${socket.user.name} left room ${roomId}`);
  } catch (err) {
    console.error('Failed to handle leave room:', err.message);
  }
};

module.exports = socketHandler;
