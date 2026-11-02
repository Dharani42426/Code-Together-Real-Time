const User = require('../models/User');
const Notification = require('../models/Notification');
const { successResponse, errorResponse } = require('../utils/generateRoomId');

// @desc    Get logged-in user profile
// @route   GET /api/users/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return errorResponse(res, 404, 'User not found');
    return successResponse(res, 200, 'Profile fetched', { user });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch profile', error.message);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, email, skills, languages, profileImage, bio } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return errorResponse(res, 404, 'User not found');

    if (name) user.name = name;
    if (email) user.email = email;
    if (skills) user.skills = skills;
    if (languages) user.languages = languages;
    if (profileImage !== undefined) user.profileImage = profileImage;
    if (bio !== undefined) user.bio = bio;

    await user.save();

    return successResponse(res, 200, 'Profile updated successfully', {
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
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
    return errorResponse(res, 500, 'Failed to update profile', error.message);
  }
};

// @desc    Get leaderboard
// @route   GET /api/users/leaderboard
// @access  Private
const getLeaderboard = async (req, res) => {
  try {
    const { sortBy = 'score' } = req.query;
    const sortField = ['score', 'problemsSolved', 'codingStreak', 'codingHours'].includes(sortBy)
      ? sortBy
      : 'score';

    const sortOption = {};
    sortOption[sortField] = -1;
    if (sortField !== 'score') sortOption.score = -1;

    const users = await User.find({ role: 'user' })
      .select('name email profileImage problemsSolved codingHours codingStreak score')
      .sort(sortOption)
      .limit(50);

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      problemsSolved: user.problemsSolved || 0,
      codingHours: user.codingHours || 0,
      codingStreak: user.codingStreak || 0,
      score: user.score || 0,
    }));

    return successResponse(res, 200, 'Leaderboard fetched', { leaderboard });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch leaderboard', error.message);
  }
};

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(20);
    return successResponse(res, 200, 'Notifications fetched', { notifications });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to fetch notifications', error.message);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!notification) return errorResponse(res, 404, 'Notification not found');
    return successResponse(res, 200, 'Notification marked as read', { notification });
  } catch (error) {
    return errorResponse(res, 500, 'Failed to update notification', error.message);
  }
};

module.exports = { getProfile, updateProfile, getLeaderboard, getNotifications, markNotificationRead };
