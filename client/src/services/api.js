import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ct_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ct_token');
      localStorage.removeItem('ct_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── USERS ───────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  getLeaderboard: () => api.get('/users/leaderboard'),
  getNotifications: () => api.get('/users/notifications'),
  markNotificationRead: (id) => api.put(`/users/notifications/${id}/read`),
};

// ─── ROOMS ───────────────────────────────────────────────────────────────────
export const roomAPI = {
  createRoom: (data) => api.post('/rooms/create', data),
  joinRoom: (data) => api.post('/rooms/join', data),
  getMyRooms: (params) => api.get('/rooms/my-rooms', { params }),
  getPublicRooms: (params) => api.get('/rooms/public', { params }),
  getRoom: (roomId) => api.get(`/rooms/${roomId}`),
  updateRoom: (roomId, data) => api.put(`/rooms/${roomId}`, data),
  deleteRoom: (roomId) => api.delete(`/rooms/${roomId}`),
  addFile: (roomId, data) => api.post(`/rooms/${roomId}/files`, data),
  updateFile: (roomId, fileId, data) => api.put(`/rooms/${roomId}/files/${fileId}`, data),
  deleteFile: (roomId, fileId) => api.delete(`/rooms/${roomId}/files/${fileId}`),
  getHistory: (roomId) => api.get(`/rooms/${roomId}/history`),
  saveVersion: (roomId, data) => api.post(`/rooms/${roomId}/history`, data),
  getUserHistory: () => api.get('/rooms/user/history'),
};

// ─── PROBLEMS ────────────────────────────────────────────────────────────────
export const problemAPI = {
  getProblems: (params) => api.get('/problems', { params }),
  getProblem: (id) => api.get(`/problems/${id}`),
  seedProblems: () => api.post('/problems/seed'),
};

// ─── SUBMISSIONS ─────────────────────────────────────────────────────────────
export const submissionAPI = {
  runCode: (data) => api.post('/submissions/run', data),
  submitSolution: (data) => api.post('/submissions', data),
  getUserSubmissions: (userId) => api.get(`/submissions/user/${userId}`),
  getProblemSubmissions: (problemId) => api.get(`/submissions/problem/${problemId}`),
};

// ─── CHAT ────────────────────────────────────────────────────────────────────
export const chatAPI = {
  getHistory: (roomId) => api.get(`/chat/${roomId}`),
  sendMessage: (roomId, data) => api.post(`/chat/${roomId}`, data),
};

// ─── AI ──────────────────────────────────────────────────────────────────────
export const aiAPI = {
  explain: (data) => api.post('/ai/explain', data),
  debug: (data) => api.post('/ai/debug', data),
  optimize: (data) => api.post('/ai/optimize', data),
  complexity: (data) => api.post('/ai/complexity', data),
};

export default api;
