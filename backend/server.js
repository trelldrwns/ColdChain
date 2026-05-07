require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://wdbgvttgojmcmphmzhgq.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYmd2dHRnb2ptY21waG16aGdxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwODM3NjAsImV4cCI6MjA5MzY1OTc2MH0.kaOenYR7H0JC78sicUEReJKeLQQRYx4sQX8w4HJAsvc';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const { query } = require('./db');
const { connectMongo } = require('./mongo');
const { authenticateToken, requireRole } = require('./middleware/auth');
const shipmentsRouter = require('./routes/shipments');
const sensorsRouter = require('./routes/sensors');
const telemetryRouter = require('./routes/telemetry');
const alertsRouter = require('./routes/alerts');
const reportsRouter = require('./routes/reports');
const trackRouter = require('./routes/track');
const productsRouter = require('./routes/products');
const statsRouter = require('./routes/stats');
const auditRouter = require('./routes/audit');
const carriersRouter = require('./routes/carriers');

// Initialize NoSQL DB
connectMongo();

const allowedOrigins = ['http://localhost:3000', 'https://cold-chain-livid.vercel.app'];

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
app.locals.io = io;

io.on('connection', (socket) => {
  console.log('Frontend connected to WebSockets:', socket.id);
});

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// --- Auth Routes ---
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return res.status(401).json({ error: error.message });

    // Store the Supabase access token in the secure HTTP-only cookie
    res.cookie('jwt', data.session.access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    const userObj = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || 'Admin',
      role: data.user.user_metadata?.role || 'admin'
    };

    res.json({ message: 'Logged in successfully', user: userObj });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: `Server error: ${err.message}` });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out successfully' });
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Logout endpoint to clear the HttpOnly cookie
app.get('/auth/logout', (req, res) => {
  res.clearCookie('jwt', { path: '/', httpOnly: true, secure: true, sameSite: 'none' });
  res.json({ message: 'Logged out successfully' });
});

// --- API Routes ---
app.use('/api/v1/shipments', authenticateToken, shipmentsRouter);
app.use('/api/v1/sensors', authenticateToken, sensorsRouter);
app.use('/api/v1/alerts', authenticateToken, alertsRouter);
app.use('/api/v1/reports', authenticateToken, reportsRouter);
app.use('/api/v1/products', authenticateToken, productsRouter);
app.use('/api/v1/stats', authenticateToken, statsRouter);
app.use('/api/v1/audit', authenticateToken, requireRole('admin'), auditRouter);
app.use('/api/v1/carriers', authenticateToken, carriersRouter);
app.use('/api/v1/telemetry', telemetryRouter);
app.use('/api/v1/track', trackRouter); // Public route

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
