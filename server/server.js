require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const User = require('./models/User');
const { demoUser } = require('./utils/demoAuth');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const socketHandler = require('./sockets/socketHandler');

// Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const problemRoutes = require('./routes/problemRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Connect to MongoDB and make the local demo account available to Mongo relations.
const ensureDemoUser = async () => {
  const existingUser = await User.findById(demoUser._id);
  if (existingUser) return;

  await User.create({
    _id: demoUser._id,
    name: demoUser.name,
    email: demoUser.email,
    password: 'demo123',
    skills: demoUser.skills,
    languages: demoUser.languages,
    profileImage: demoUser.profileImage,
    problemsSolved: demoUser.problemsSolved,
    codingHours: demoUser.codingHours,
    codingStreak: demoUser.codingStreak,
    score: demoUser.score,
    role: demoUser.role,
  });
  console.log('✅ Demo user ready');
};

connectDB().then(ensureDemoUser).catch((error) => {
  console.error(`❌ Demo user setup failed: ${error.message}`);
});

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
  'http://127.0.0.1:5176',
  'http://127.0.0.1:5177',
];

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  return allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);
};

// Socket.IO setup
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Attach socket handler
socketHandler(io);

// Make io accessible in controllers if needed
app.set('io', io);

// ─── MIDDLEWARE ──────────────────────────────────────────────────────────────

app.use(helmet());
app.use(morgan('dev'));

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
});
app.use('/api/auth/', authLimiter);

// ─── ROUTES ──────────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CodeTogether API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── ERROR HANDLING ──────────────────────────────────────────────────────────

app.use(notFound);
app.use(errorHandler);

// ─── START SERVER ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready`);
  console.log(`🌐 API: http://localhost:${PORT}/api`);
  console.log(`❤️  Health: http://localhost:${PORT}/api/health\n`);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} is already in use.`);
    console.error(`   Run this to fix it:`);
    console.error(`   Windows: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F`);
    console.error(`   Or change PORT in .env to another number like 5001\n`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});
