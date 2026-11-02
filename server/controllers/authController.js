const User = require('../models/User');
const { getDemoUserByCredentials } = require('../utils/demoAuth');
const { generateToken, successResponse, errorResponse } = require('../utils/generateRoomId');

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, skills, languages } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Name, email and password are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 400, 'Email already registered');
    }

    const user = await User.create({
      name,
      email,
      password,
      skills: skills || [],
      languages: languages || [],
    });

    return successResponse(res, 201, 'User registered successfully', {
      id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    return errorResponse(res, 500, 'Registration failed', error.message);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Email and password are required');
    }

    const demoUser = getDemoUserByCredentials(email, password);
    if (demoUser) {
      const token = generateToken(demoUser._id || demoUser.id);
      return successResponse(res, 200, 'Login successful', {
        token,
        user: { ...demoUser, _id: demoUser._id || demoUser.id, id: demoUser.id || demoUser._id },
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    user.lastActive = Date.now();
    await user.save({ validateBeforeSave: false });

    const token = generateToken(user._id);

    return successResponse(res, 200, 'Login successful', {
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        skills: user.skills,
        languages: user.languages,
        profileImage: user.profileImage,
        problemsSolved: user.problemsSolved,
        codingHours: user.codingHours,
        codingStreak: user.codingStreak,
        score: user.score,
        role: user.role,
      },
    });
  } catch (error) {
    return errorResponse(res, 500, 'Login failed', error.message);
  }
};

// @desc    Get current logged-in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user && req.user.id ? req.user : await User.findById(req.user?._id || req.user?.id);
    return successResponse(res, 200, 'User fetched', { user });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch user', error.message);
  }
};

module.exports = { register, login, getMe };
