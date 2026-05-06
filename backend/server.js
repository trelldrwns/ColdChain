require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
    const result = await query('SELECT id, email, name, role, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { sub: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({ message: 'Logged in successfully', user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/auth/logout', (req, res) => {
  res.clearCookie('jwt');
  res.json({ message: 'Logged out successfully' });
});

app.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
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
