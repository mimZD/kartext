require('dotenv').config(); // ADD AT TOP
const { Sequelize } = require('sequelize');

// Validate database environment variables
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD) {
  console.error('❌ DATABASE ERROR: Database credentials not configured');
  console.error('   Please set in .env file:');
  console.error('   DB_NAME=your_database_name');
  console.error('   DB_USER=your_database_user'); 
  console.error('   DB_PASSWORD=your_database_password');
  process.exit(1);
}

// تنظیمات اتصال به پایگاه داده - از environment variables
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER, 
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development', // Log only in development
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// تست اتصال به پایگاه داده
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connection to MySQL database has been established successfully.');
    console.log('🔧 Database:', process.env.DB_NAME);
    
    // همگام‌سازی مدل‌ها با پایگاه داده
    await sequelize.sync({ force: false });
    console.log('✅ Database tables synchronized successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error.message);
    console.log('💡 Please check:');
    console.log('   1. MySQL server is running');
    console.log('   2. Database and user exist');
    console.log('   3. Environment variables are set correctly');
    process.exit(1);
  }
}

testConnection();

module.exports = sequelize;