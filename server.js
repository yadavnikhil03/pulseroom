require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const routes = require('./routes');
const handlers = require('./handlers');
const { optionalAuthenticateSocket } = require('./middlewares/auth.middleware');

const app = express();
const port = process.env.PORT || 8888;
const server = http.createServer(app);
const localOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, '');
const allowedOrigins = frontendUrl
  ? [...localOrigins, frontendUrl]
  : localOrigins;

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('tiny'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'pulseroom-api',
    demoMode: process.env.DEMO_MODE === 'true'
  });
});

app.use(routes);

// Serve React client build (production)
const clientBuild = './client/build';
app.use(express.static(clientBuild));

// SPA fallback — send index.html for any non-API route
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/health') return;
  res.sendFile('index.html', { root: clientBuild }, err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

if (process.env.DEMO_MODE === 'true') {
  console.log('[startup] Demo mode enabled; using in-memory room storage.');
} else {
  const mongoUri = process.env.MONGODB_ATLAS_URI || 'mongodb://localhost/pulseroom';
  console.log('[startup] Connecting to MongoDB...');
  mongoose
    .connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => console.log('[startup] MongoDB connection established.'))
    .catch(err => console.error('[startup] MongoDB connection failed:', err.message));
}

io.use(async (socket, next) => {
  try {
    socket.accountUser = await optionalAuthenticateSocket(socket);
    next();
  } catch {
    next(new Error('Invalid or expired account token.'));
  }
});

io.on('connection', socket => {
  console.log('Client connected to server:', socket.id);

  socket.on('join room', (roomId, user) => {
    const roomUser = socket.accountUser
      ? { ...user, id: socket.accountUser._id.toString(), name: socket.accountUser.name, accountId: socket.accountUser._id.toString() }
      : user;
    handlers.addUser(roomId, roomUser, socket);
    socket.join(roomId);

    socket.to(roomId).emit('user status', {
      text: `${roomUser.name} joined...`,
      user: roomUser
    });

    const currentUsers = handlers.getUsersInRoom(roomId);
    io.in(roomId).emit('current users', currentUsers);

    // Tell the connecting socket whether they are host
    const roomUsersAfter = handlers.getUsersInRoom(roomId);
    const myUser = roomUsersAfter.find(u => u.socketId === socket.id);
    socket.emit('user role', { isHost: !!myUser?.isHost });
  });

  socket.on('playback_update', ({ roomId, ...playbackState }) => {
    io.in(roomId).emit('playback_update', playbackState);
  });

  socket.on('queue_update', ({ roomId }) => {
    io.in(roomId).emit('queue_update', { roomId });
  });

  socket.on('host action', ({ type, roomId }) => {
    io.in(roomId).emit('playback_update', { action: type, roomId });
  });

  socket.on('transfer host', ({ roomId, targetSocketId }) => {
    const roomUsers = handlers.getUsersInRoom(roomId);
    const requester = roomUsers.find(u => u.socketId === socket.id);
    if (!requester?.isHost) return;
    const newHost = handlers.transferHost(roomId, targetSocketId);
    if (newHost) {
      io.in(roomId).emit('current users', handlers.getUsersInRoom(roomId));
      io.in(roomId).emit('user status', { text: `${newHost.name} is now the host.` });
    }
  });

  socket.on('kick user', ({ roomId, targetSocketId }) => {
    const roomUsers = handlers.getUsersInRoom(roomId);
    const requester = roomUsers.find(u => u.socketId === socket.id);
    if (!requester?.isHost) return;
    const kicked = handlers.kickUser(roomId, targetSocketId);
    if (kicked) {
      io.to(targetSocketId).emit('kicked', { reason: 'You were removed by the host.' });
      io.sockets.sockets.get(targetSocketId)?.leave(roomId);
      io.in(roomId).emit('current users', handlers.getUsersInRoom(roomId));
      io.in(roomId).emit('user status', { text: `${kicked.name} was removed.` });
    }
  });

  socket.on('host song', ({ song, roomId }) => {
    io.in(roomId).emit('room song', song);
  });

  socket.on('disconnect', () => {
    const user = handlers.removeUser(socket);

    if (user) {
      io.to(user.room).emit('user status', { text: `${user.name} left...` });
      const currentUsers = handlers.getUsersInRoom(user.room);
      io.to(user.room).emit('current users', currentUsers);
      console.log('Client disconnected from server:', user.socketId);
    }
  });
});

server.listen(port, () => {
  console.log(`[startup] Pulseroom API listening on port ${port}.`);
});
