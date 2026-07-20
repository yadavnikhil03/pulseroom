console.log('[DEBUG] server.js: Script execution started.');
require('dotenv').config();
const express = require('express'),
  cors = require('cors'),
  morgan = require('morgan'),
  path = require('path'),
  http = require('http'),
  { Server } = require('socket.io'),
  mongoose = require('mongoose'),
  routes = require('./routes'),
  handlers = require('./handlers');

console.log('[DEBUG] server.js: Dependencies loaded.');

const app = express();
const port = process.env.PORT || 8888;
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

console.log('[DEBUG] server.js: Express app and server created.');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (process.env.FRONTEND_URL) {
  console.log(`[DEBUG] server.js: Adding FRONTEND_URL to allowed origins: ${process.env.FRONTEND_URL}`);
  allowedOrigins.push(process.env.FRONTEND_URL);
}
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(morgan('tiny'));

app.use(routes);

console.log('[DEBUG] server.js: Middleware and routes configured.');

if (process.env.DEMO_MODE === 'true') {
  console.log('[DEBUG] server.js: Demo mode enabled. Skipping database connection.');
} else {
  console.log('[DEBUG] server.js: Attempting to connect to database...');
  mongoose
    .connect(process.env.MONGODB_ATLAS_URI || 'mongodb://localhost/pulseroom', {
      useNewUrlParser: true, 
      useUnifiedTopology: true
    })
    .then(() => console.log('[DEBUG] server.js: Database connection successful.'))
    .catch(err => console.error('[DEBUG] server.js: Database connection FAILED.', err));
}



io.on('connection', socket => {
  console.log('Client connected to server:', socket.id);

  socket.on('join room', (roomId, user) => {
    handlers.addUser(roomId, user, socket);
    socket.join(roomId);

    socket.to(roomId).emit('user status', {
      text: `${user.name} joined...`,
      user
    });

    const currentUsers = handlers.getUsersInRoom(roomId);
    io.in(roomId).emit('current users', currentUsers);
  });

  socket.on('playback_update', ({ roomId, ...playbackState }) => {
    io.in(roomId).emit('playback_update', playbackState);
  });

  socket.on('queue_update', ({ roomId }) => {
    io.in(roomId).emit('queue_update', { roomId });
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

      console.log('Client disconnected from server: ', user.socketId);
    }
  });
});

console.log(`[DEBUG] server.js: Socket.IO configured. Starting server on port ${port}.`);

server.listen(port);
