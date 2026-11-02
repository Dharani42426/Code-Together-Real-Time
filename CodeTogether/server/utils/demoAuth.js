const demoUser = {
  _id: '64f1a2b3c4d5e6f789012345',
  id: '64f1a2b3c4d5e6f789012345',
  name: 'Alex Johnson',
  email: 'demo@codetogether.com',
  skills: ['React', 'Node.js', 'JavaScript'],
  languages: ['JavaScript', 'TypeScript'],
  profileImage: '',
  bio: 'Full-stack developer passionate about algorithms and open source.',
  problemsSolved: 142,
  codingHours: 24,
  codingStreak: 14,
  score: 4820,
  role: 'user',
};

const getDemoUserByCredentials = (email, password) => {
  if (!email || !password) return null;

  const normalizedEmail = String(email).trim().toLowerCase();
  if (normalizedEmail === demoUser.email.toLowerCase() && String(password) === 'demo123') {
    return { ...demoUser };
  }

  return null;
};

const getDemoUserById = (id) => {
  if (!id) return null;
  const normalizedId = String(id).trim();
  return normalizedId === demoUser.id || normalizedId === demoUser._id || normalizedId === 'demo-user-1'
    ? { ...demoUser, _id: demoUser._id, id: demoUser.id }
    : null;
};

module.exports = {
  demoUser,
  getDemoUserByCredentials,
  getDemoUserById,
};
