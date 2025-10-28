// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// تعریف sequelize connection (مطمئن شیم این بخش وجود داره)
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER, 
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false
  }
);

// حالا مدل‌ها رو تعریف کنیم
const User = require('./User')(sequelize, DataTypes);
const TimeLog = require('./TimeLog')(sequelize, DataTypes);
const LeaveRequest = require('./LeaveRequest')(sequelize, DataTypes);

const models = {
  User,
  TimeLog,
  LeaveRequest
};

// ایجاد روابط اگر نیاز هست
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;