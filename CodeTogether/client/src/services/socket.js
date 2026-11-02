import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', (reason) => console.log('Socket disconnected:', reason));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Room events
export const joinRoom = (roomId) => socket?.emit('join-room', { roomId });
export const leaveRoom = (roomId) => socket?.emit('leave-room', { roomId });
export const sendCodeChange = (roomId, code, userId) => socket?.emit('code-change', { roomId, code, userId });
export const sendCursorChange = (roomId, userId, username, position) => socket?.emit('cursor-change', { roomId, userId, username, position });
export const sendMessage = (roomId, message) => socket?.emit('send-message', { roomId, message });
export const sendTyping = (roomId, username, isTyping) => socket?.emit('typing', { roomId, username, isTyping });
export const sendFileChange = (roomId, fileId, content) => socket?.emit('file-change', { roomId, fileId, content });

// Whiteboard events
export const sendWhiteboardDraw = (roomId, stroke) => socket?.emit('whiteboard-draw', { roomId, stroke });
export const sendWhiteboardClear = (roomId) => socket?.emit('whiteboard-clear', { roomId });

// Video Call events
export const joinVideoCall = (roomId, user) => socket?.emit('join-video-call', { roomId, user });
export const leaveVideoCall = (roomId) => socket?.emit('leave-video-call', { roomId });
export const sendVideoSignal = (to, signal) => socket?.emit('video-signal', { to, signal });
export const sendMediaToggle = (roomId, state) => socket?.emit('video-media-toggle', { roomId, ...state });
