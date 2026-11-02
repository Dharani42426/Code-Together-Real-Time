const Room = require('../models/Room');
const CodeHistory = require('../models/CodeHistory');
const { generateRoomId, successResponse, errorResponse } = require('../utils/generateRoomId');
const bcrypt = require('bcryptjs');

// @desc    Create a new room
// @route   POST /api/rooms/create
// @access  Private
const createRoom = async (req, res) => {
  try {
    const { name, description, language, isPrivate, password, maxParticipants } = req.body;

    if (!name) return errorResponse(res, 400, 'Room name is required');

    const roomId = await generateRoomId();

    let hashedPassword = '';
    if (isPrivate && password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const langKey = (language || 'javascript').toLowerCase();
    const starterFiles = {
      javascript: { name: 'main.js', language: 'javascript', content: '// Start coding here\nconsole.log("Hello CodeTogether!");\n' },
      python: { name: 'main.py', language: 'python', content: '# Start coding here\nprint("Hello CodeTogether!")\n' },
      java: { name: 'Main.java', language: 'java', content: '// Start coding here\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeTogether!");\n    }\n}\n' },
      'c++': { name: 'main.cpp', language: 'c++', content: '// Start coding here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello CodeTogether!" << std::endl;\n    return 0;\n}\n' },
      cpp: { name: 'main.cpp', language: 'cpp', content: '// Start coding here\n#include <iostream>\n\nint main() {\n    std::cout << "Hello CodeTogether!" << std::endl;\n    return 0;\n}\n' },
      c: { name: 'main.c', language: 'c', content: '// Start coding here\n#include <stdio.h>\n\nint main() {\n    printf("Hello CodeTogether!\\n");\n    return 0;\n}\n' },
      typescript: { name: 'main.ts', language: 'typescript', content: '// Start coding here\nconst msg: string = "Hello CodeTogether!";\nconsole.log(msg);\n' },
      go: { name: 'main.go', language: 'go', content: '// Start coding here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello CodeTogether!")\n}\n' },
      rust: { name: 'main.rs', language: 'rust', content: '// Start coding here\nfn main() {\n    println!("Hello CodeTogether!");\n}\n' },
    };
    const initialFile = starterFiles[langKey] || {
      name: `main.${langKey.slice(0, 3)}`,
      language: langKey,
      content: `// Start coding in ${language}\n`,
    };

    const room = await Room.create({
      roomId,
      name,
      description: description || '',
      owner: req.user._id,
      language: language || 'javascript',
      isPrivate: isPrivate || false,
      password: hashedPassword,
      maxParticipants: maxParticipants || 10,
      participants: [{ user: req.user._id, role: 'owner' }],
      code: initialFile.content || '',
      files: [initialFile],
    });

    await room.populate('owner', 'name email profileImage');

    return successResponse(res, 201, 'Room created successfully', {
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      language: room.language,
      isPrivate: room.isPrivate,
      maxParticipants: room.maxParticipants,
      owner: room.owner,
      files: room.files,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to create room', error.message);
  }
};

// @desc    Join a room
// @route   POST /api/rooms/join
// @access  Private
const joinRoom = async (req, res) => {
  try {
    const { roomId, password } = req.body;

    if (!roomId) return errorResponse(res, 400, 'Room ID is required');

    const room = await Room.findOne({ roomId: roomId.toUpperCase() })
      .select('+password')
      .populate('owner', 'name email')
      .populate('participants.user', 'name email profileImage');

    if (!room) return errorResponse(res, 404, 'Room not found');
    if (!room.isActive) return errorResponse(res, 400, 'Room is no longer active');

    // Check if already a participant
    const alreadyJoined = room.participants.some(
      (p) => p.user._id.toString() === req.user._id.toString()
    );

    if (!alreadyJoined) {
      // Check max participants
      if (room.participants.length >= room.maxParticipants) {
        return errorResponse(res, 400, 'Room is full');
      }

      // Check password for private rooms
      if (room.isPrivate && room.password) {
        if (!password) return errorResponse(res, 401, 'Password required for this room');
        const isMatch = await bcrypt.compare(password, room.password);
        if (!isMatch) return errorResponse(res, 401, 'Incorrect room password');
      }

      room.participants.push({ user: req.user._id, role: 'editor' });
      await room.save();
    }

    return successResponse(res, 200, 'Joined room successfully', {
      roomId: room.roomId,
      name: room.name,
      description: room.description,
      language: room.language,
      owner: room.owner,
      participants: room.participants,
      code: room.code,
      files: room.files,
      isPrivate: room.isPrivate,
      maxParticipants: room.maxParticipants,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to join room', error.message);
  }
};

// @desc    Get room by roomId
// @route   GET /api/rooms/:roomId
// @access  Private
const getRoom = async (req, res) => {
  try {
    let room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() })
      .populate('owner', 'name email profileImage')
      .populate('participants.user', 'name email profileImage');

    if (!room) return errorResponse(res, 404, 'Room not found');

    // Check if user is a participant
    const isParticipant = room.participants.some(
      (p) => p.user && (p.user._id ? p.user._id.toString() : p.user.toString()) === req.user._id.toString()
    );

    if (!isParticipant) {
      if (!room.isPrivate) {
        // Auto-join public room for authenticated user
        room.participants.push({ user: req.user._id, role: 'editor' });
        await room.save();
        room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() })
          .populate('owner', 'name email profileImage')
          .populate('participants.user', 'name email profileImage');
      } else {
        return errorResponse(res, 403, 'You are not a participant of this room');
      }
    }

    return successResponse(res, 200, 'Room fetched', { room });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch room', error.message);
  }
};

// @desc    Get all rooms for logged-in user with optional search
// @route   GET /api/rooms/my-rooms
// @access  Private
const getMyRooms = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {
      'participants.user': req.user._id,
    };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { roomId: regex },
        { description: regex },
        { language: regex },
      ];
    }

    const rooms = await Room.find(filter)
      .populate('owner', 'name email profileImage')
      .sort({ updatedAt: -1 });

    return successResponse(res, 200, 'Rooms fetched', { rooms });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch rooms', error.message);
  }
};

// @desc    Get public rooms with search and language filter
// @route   GET /api/rooms/public
// @access  Private
const getPublicRooms = async (req, res) => {
  try {
    const { search, language, limit = 30 } = req.query;
    const filter = { isPrivate: false, isActive: true };

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { roomId: regex },
        { description: regex },
        { language: regex },
      ];
    }

    if (language && language !== 'All') {
      filter.language = new RegExp(`^${language}$`, 'i');
    }

    const rooms = await Room.find(filter)
      .populate('owner', 'name email profileImage')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    return successResponse(res, 200, 'Public rooms fetched', { rooms });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch public rooms', error.message);
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:roomId
// @access  Private (Owner only)
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return errorResponse(res, 404, 'Room not found');

    if (room.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the room owner can update settings');
    }

    const { name, description, language, maxParticipants } = req.body;

    if (name) room.name = name;
    if (description !== undefined) room.description = description;
    if (language) room.language = language;
    if (maxParticipants) room.maxParticipants = maxParticipants;

    await room.save();
    return successResponse(res, 200, 'Room updated successfully', { room });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update room', error.message);
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:roomId
// @access  Private (Owner only)
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return errorResponse(res, 404, 'Room not found');

    if (room.owner.toString() !== req.user._id.toString()) {
      return errorResponse(res, 403, 'Only the room owner can delete this room');
    }

    await room.deleteOne();
    return successResponse(res, 200, 'Room deleted successfully');
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete room', error.message);
  }
};

// @desc    Add file to room
// @route   POST /api/rooms/:roomId/files
// @access  Private (Owner/Editor)
const addFile = async (req, res) => {
  try {
    const { name, language, content } = req.body;
    if (!name) return errorResponse(res, 400, 'File name is required');

    const room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return errorResponse(res, 404, 'Room not found');

    const participant = room.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );
    if (!participant || participant.role === 'viewer') {
      return errorResponse(res, 403, 'Viewers cannot add files');
    }

    room.files.push({ name, language: language || 'javascript', content: content || '' });
    await room.save();

    return successResponse(res, 201, 'File added', { files: room.files });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to add file', error.message);
  }
};

// @desc    Update file in room
// @route   PUT /api/rooms/:roomId/files/:fileId
// @access  Private (Owner/Editor)
const updateFile = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return errorResponse(res, 404, 'Room not found');

    const isOwner = room.owner.toString() === req.user._id.toString();
    const participant = room.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );
    if (!isOwner && (!participant || participant.role === 'viewer')) {
      return errorResponse(res, 403, 'Viewers cannot edit files');
    }

    let file = room.files.id(req.params.fileId);
    if (!file) {
      file = room.files.find(f => f.name === req.body.name || f._id?.toString() === req.params.fileId);
    }

    const { name, content, language } = req.body;
    if (!file) {
      room.files.push({
        name: name || 'main.js',
        content: content || '',
        language: language || 'javascript',
      });
      file = room.files[room.files.length - 1];
    } else {
      if (name) file.name = name;
      if (content !== undefined) file.content = content;
      if (language) file.language = language;
    }

    if (content !== undefined) {
      room.code = content;
    }

    await room.save();
    return successResponse(res, 200, 'File updated', { file });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update file', error.message);
  }
};

// @desc    Delete file from room
// @route   DELETE /api/rooms/:roomId/files/:fileId
// @access  Private (Owner/Editor)
const deleteFile = async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId.toUpperCase() });
    if (!room) return errorResponse(res, 404, 'Room not found');

    const isOwner = room.owner.toString() === req.user._id.toString();
    const participant = room.participants.find(
      (p) => p.user.toString() === req.user._id.toString()
    );
    if (!isOwner && (!participant || participant.role === 'viewer')) {
      return errorResponse(res, 403, 'Viewers cannot delete files');
    }

    room.files = room.files.filter((f) => f._id.toString() !== req.params.fileId);
    await room.save();

    return successResponse(res, 200, 'File deleted', { files: room.files });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to delete file', error.message);
  }
};

// @desc    Get code history for a room
// @route   GET /api/rooms/:roomId/history
// @access  Private
const getCodeHistory = async (req, res) => {
  try {
    const history = await CodeHistory.find({ roomId: req.params.roomId.toUpperCase() })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(30);

    return successResponse(res, 200, 'Code history fetched', { history });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch history', error.message);
  }
};

// @desc    Save code version
// @route   POST /api/rooms/:roomId/history
// @access  Private
const saveCodeVersion = async (req, res) => {
  try {
    const { code, language, fileName, description } = req.body;
    if (!code) return errorResponse(res, 400, 'Code is required');

    const lastVersion = await CodeHistory.findOne({ roomId: req.params.roomId.toUpperCase() })
      .sort({ version: -1 })
      .select('version');

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const history = await CodeHistory.create({
      roomId: req.params.roomId.toUpperCase(),
      userId: req.user._id,
      code,
      language: language || 'javascript',
      fileName: fileName || 'main',
      version,
      description: description || 'Manual save',
    });

    // Also persist code and language in Room model
    await Room.findOneAndUpdate(
      { roomId: req.params.roomId.toUpperCase() },
      { code, language: (language || 'javascript').toLowerCase(), updatedAt: Date.now() }
    );

    return successResponse(res, 201, 'Version saved', { history });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to save version', error.message);
  }
};

// @desc    Get all code saves by user
// @route   GET /api/rooms/user/history
// @access  Private
const getUserCodeHistory = async (req, res) => {
  try {
    const history = await CodeHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(40);
    return successResponse(res, 200, 'User code history fetched', { history });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch user history', error.message);
  }
};

module.exports = {
  createRoom, joinRoom, getRoom, getMyRooms, getPublicRooms, updateRoom, deleteRoom,
  addFile, updateFile, deleteFile, getCodeHistory, saveCodeVersion, getUserCodeHistory,
};
