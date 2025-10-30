  require('dotenv').config();
  const express = require('express');
  const session = require('express-session');
  const SequelizeStore = require('connect-session-sequelize')(session.Store);
  const { sequelize } = require('./models'); // This imports your existing database connection
  const path = require('path');

  const app = express();

  // Trust reverse proxy
  app.set('trust proxy', 1);

  // middlewareهای پایه
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Create Sequelize session store
  const sessionStore = new SequelizeStore({
    db: sequelize,
    tableName: 'sessions',
    checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
    expiration: 24 * 60 * 60 * 1000 // 24 hours
  });

  // لاگینگ کامل همه درخواست‌ها
  app.use((req, res, next) => {
    const start = Date.now();
    const requestId = Date.now() + Math.random().toString(36).substr(2, 5);
    
    console.log(`📥 [${requestId}] ${req.method} ${req.originalUrl}`, {
      body: req.body,
      query: req.query,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    // ذخیره توابع اصلی
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Override json function
    res.json = function(body) {
      const duration = Date.now() - start;
      
      console.log(`📤 [${requestId}] RESPONSE ${res.statusCode}`, {
        duration: `${duration}ms`,
        success: body?.success,
        dataLength: body?.data ? (Array.isArray(body.data) ? body.data.length : 1) : 0,
        error: body?.error,
        path: req.path
      });
      
      originalJson.call(this, body);
    };

    // Override send function
    res.send = function(body) {
      const duration = Date.now() - start;
      
      console.log(`📤 [${requestId}] RESPONSE ${res.statusCode}`, {
        duration: `${duration}ms`,
        contentLength: body?.length,
        path: req.path
      });
      
      originalSend.call(this, body);
    };

    next();
  });

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

  // لاگ برای بررسی لود شدن routeها
  console.log('🔄 LOADING ROUTES...');
  console.log('📁 Auth routes:', authRoutes ? 'LOADED' : 'FAILED');
  console.log('📁 Leave routes:', leaveRoutes ? 'LOADED' : 'FAILED'); 
  console.log('📁 Log routes:', logRoutes ? 'LOADED' : 'FAILED');

  // استفاده از routeها - ترتیب مهم است!
  app.use('/admin', adminRoutes);
  app.use('/api', authRoutes);  // تغییر داده شد از '/api/auth' به '/api'
  //app.use('/api', logRoutes);
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
    console.log(`❌ 404 ROUTE NOT FOUND: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
      success: false,
      error: 'Route not found',
      path: req.originalUrl
    });
  });

  // مدیریت خطای سرور
  app.use((err, req, res, next) => {
    console.error('💥 SERVER ERROR:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
  });

  module.exports = app;