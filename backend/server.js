require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

const pollRoutes = require('./routes/polls');
const voteRoutes = require('./routes/votes');

const app = express();
const server = http.createServer(app);
// Allow multiple origins via comma-separated env var
const rawOrigins = process.env.CORS_ORIGIN || 'http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
};

const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files from frontend build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pollapp')
  .then(() => {
    console.log('✓ MongoDB connected successfully');
  })
  .catch(err => {
    console.error('✗ MongoDB connection error:', err);
    process.exit(1);
  });

// Socket.IO Connection
let activePollConnections = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a poll room
  socket.on('joinPoll', (pollId) => {
    socket.join(`poll-${pollId}`);

    if (!activePollConnections[pollId]) {
      activePollConnections[pollId] = [];
    }
    activePollConnections[pollId].push(socket.id);

    console.log(`User ${socket.id} joined poll ${pollId}`);
    console.log(`Active connections for poll ${pollId}: ${activePollConnections[pollId].length}`);
  });

  // Broadcast vote updates to all users in the poll room
  socket.on('voteSubmitted', (data) => {
    const { pollId } = data;
    io.to(`poll-${pollId}`).emit('resultsUpdated', data);
  });

  // Leave poll
  socket.on('leavePoll', (pollId) => {
    socket.leave(`poll-${pollId}`);

    if (activePollConnections[pollId]) {
      activePollConnections[pollId] = activePollConnections[pollId].filter(
        id => id !== socket.id
      );
    }

    console.log(`User ${socket.id} left poll ${pollId}`);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove from all poll connections
    Object.keys(activePollConnections).forEach(pollId => {
      activePollConnections[pollId] = activePollConnections[pollId].filter(
        id => id !== socket.id
      );
      if (activePollConnections[pollId].length === 0) {
        delete activePollConnections[pollId];
      }
    });
  });
});

// Routes
app.use('/api/polls', pollRoutes);
app.use('/api/votes', voteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Serve React app for all other routes (SPA routing)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
} else {
  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
  });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`
POLL APP SERVER STARTED
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
  `);
});


process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
