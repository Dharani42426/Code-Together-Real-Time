# CodeTogether – Backend API

Real-Time Collaborative Coding Platform — Node.js/Express/MongoDB/Socket.IO Backend.

---

## Tech Stack

- **Node.js** + **Express.js** — REST API server
- **MongoDB** + **Mongoose** — Database & ODM
- **Socket.IO** — Real-time collaboration
- **JWT** — Authentication
- **bcryptjs** — Password hashing
- **Helmet** — Security headers
- **express-rate-limit** — Rate limiting
- **Judge0 API** — Code execution
- **Gemini API** — AI assistant

---

## Folder Structure

```
server/
├── config/db.js               # MongoDB connection
├── controllers/
│   ├── authController.js      # Register, Login, Me
│   ├── userController.js      # Profile, Leaderboard, Notifications
│   ├── roomController.js      # Room CRUD, Files, Code History
│   ├── problemController.js   # Problems CRUD + Seed
│   ├── submissionController.js# Run code, Submit solution
│   ├── chatController.js      # Chat history
│   └── aiController.js        # Explain, Debug, Optimize, Complexity
├── middleware/
│   ├── authMiddleware.js      # JWT protect + adminOnly
│   └── errorMiddleware.js     # 404 + global error handler
├── models/
│   ├── User.js
│   ├── Room.js
│   ├── Message.js
│   ├── Problem.js
│   ├── Submission.js
│   ├── CodeHistory.js
│   └── Notification.js
├── routes/
│   ├── authRoutes.js
│   ├── userRoutes.js
│   ├── roomRoutes.js
│   ├── problemRoutes.js
│   ├── submissionRoutes.js
│   ├── chatRoutes.js
│   └── aiRoutes.js
├── sockets/socketHandler.js   # All Socket.IO events
├── utils/generateRoomId.js    # Room ID, JWT, response helpers
├── .env
├── package.json
└── server.js                  # Entry point
```

---

## Installation

```bash
cd server
npm install
```

---

## Environment Variables

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/codetogether
JWT_SECRET=your_strong_secret_here
JWT_EXPIRE=7d

# Judge0 (get free key at rapidapi.com/judge0-official)
JUDGE0_API_URL=https://judge0-ce.p.rapidapi.com
JUDGE0_API_KEY=your_judge0_key
JUDGE0_API_HOST=judge0-ce.p.rapidapi.com

# Gemini AI (get key at aistudio.google.com)
GEMINI_API_KEY=your_gemini_key
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent

CLIENT_URL=http://localhost:5173
```

> Both Judge0 and Gemini keys are optional. The server uses mock responses if keys are not set.

---

## MongoDB Setup

**Option 1 — Local MongoDB:**
```bash
# Install MongoDB Community Edition, then:
mongod --dbpath /data/db
```

**Option 2 — MongoDB Atlas (Cloud, Free):**
1. Go to https://cloud.mongodb.com
2. Create free cluster
3. Get connection string
4. Set `MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/codetogether`

---

## Start the Server

```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server prints:
```
🚀 Server running on port 5000
📡 Socket.IO ready
🌐 API: http://localhost:5000/api
❤️  Health: http://localhost:5000/api/health
MongoDB Connected: localhost
```

---

## Seed Problems

After starting the server, seed the default 6 problems:

```
POST http://localhost:5000/api/problems/seed
Authorization: Bearer <your_token>
```

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users/profile | Get profile |
| PUT | /api/users/profile | Update profile |
| GET | /api/users/leaderboard | Get leaderboard |
| GET | /api/users/notifications | Get notifications |
| PUT | /api/users/notifications/:id/read | Mark read |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms/create | Create room |
| POST | /api/rooms/join | Join room |
| GET | /api/rooms/my-rooms | Get my rooms |
| GET | /api/rooms/:roomId | Get room details |
| PUT | /api/rooms/:roomId | Update room |
| DELETE | /api/rooms/:roomId | Delete room |
| POST | /api/rooms/:roomId/files | Add file |
| PUT | /api/rooms/:roomId/files/:fileId | Update file |
| DELETE | /api/rooms/:roomId/files/:fileId | Delete file |
| GET | /api/rooms/:roomId/history | Code history |
| POST | /api/rooms/:roomId/history | Save version |

### Problems
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/problems | List problems |
| GET | /api/problems/:id | Get problem |
| POST | /api/problems/seed | Seed defaults |
| POST | /api/problems | Create (admin) |
| PUT | /api/problems/:id | Update (admin) |
| DELETE | /api/problems/:id | Delete (admin) |

### Submissions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/submissions/run | Run code |
| POST | /api/submissions | Submit solution |
| GET | /api/submissions/user/:userId | User submissions |
| GET | /api/submissions/problem/:problemId | Problem submissions |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/chat/:roomId | Get chat history |
| POST | /api/chat/:roomId | Send message |

### AI Assistant
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/ai/explain | Explain code |
| POST | /api/ai/debug | Debug code |
| POST | /api/ai/optimize | Optimize code |
| POST | /api/ai/complexity | Analyze complexity |

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| join-room | { roomId } | Join a coding room |
| leave-room | { roomId } | Leave a room |
| code-change | { roomId, code, userId } | Broadcast code edit |
| cursor-change | { roomId, userId, username, position } | Cursor position |
| send-message | { roomId, message } | Send chat message |
| file-change | { roomId, fileId, content } | File content change |
| typing | { roomId, username, isTyping } | Typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| user-joined | { userId, username } | User joined room |
| user-left | { userId, username } | User left room |
| code-update | { code, userId, roomId } | Code was updated |
| cursor-update | { userId, username, position } | Cursor moved |
| receive-message | { message object } | New chat message |
| file-update | { fileId, content } | File was updated |
| participant-update | { activeUsers } | Active users list |
| notification | { type, message } | Push notification |
| error | { message } | Error event |

---

## Testing with Thunder Client

1. Install **Thunder Client** extension in VS Code
2. Import or manually create requests:

**Register:**
```
POST http://localhost:5000/api/auth/register
Body: { "name": "Test User", "email": "test@test.com", "password": "123456" }
```

**Login:**
```
POST http://localhost:5000/api/auth/login
Body: { "email": "test@test.com", "password": "123456" }
```
Copy the `token` from response.

**All protected routes:**
```
Header: Authorization: Bearer <token>
```

**Create Room:**
```
POST http://localhost:5000/api/rooms/create
Header: Authorization: Bearer <token>
Body: { "name": "My Room", "language": "javascript" }
```

**Run Code:**
```
POST http://localhost:5000/api/submissions/run
Header: Authorization: Bearer <token>
Body: { "language": "javascript", "code": "console.log(2+2)", "input": "" }
```
