require('dotenv').config();
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./models'); // This imports your existing database connection
const path = require('path');

const app = express();

// Create Sequelize session store
const sessionStore = new SequelizeStore({
  db: sequelize,
  tableName: 'sessions',
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: 24 * 60 * 60 * 1000 // 24 hours
});

// Trust reverse proxy
app.set('trust proxy', 1);

// middlewareهای پایه
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { 
    secure: true, 
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  },
  proxy: true
}));

// Sync session store (create sessions table)
sessionStore.sync();

// ایمپورت routeها
const adminRoutes = require('./routes/admin');
const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/logs');
const leaveRoutes = require('./routes/leaves');
// استفاده از routeها
app.use('/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/logs', logRoutes);

app.use('/api', leaveRoutes);

// route سلامت
app.get('/health', (req, res) => {
  res.json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Kartext API is running',
    environment: process.env.NODE_ENV
  });
});

// صفحه اصلی - هدایت به پنل ادمین
app.get('/', (req, res) => {
  res.redirect('/admin/login');
});

// مدیریت خطای 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

module.exports = app;