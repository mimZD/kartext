// models/index.js
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

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

// تعریف مدل‌ها
const User = require('./User')(sequelize, DataTypes);
const TimeLog = require('./TimeLog')(sequelize, DataTypes);
const LeaveRequest = require('./LeaveRequest')(sequelize, DataTypes);

// ایجاد روابط بین مدل‌ها
User.hasMany(TimeLog, { foreignKey: 'userId', as: 'timeLogs' });
TimeLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LeaveRequest, { foreignKey: 'userId', as: 'leaveRequests' });
LeaveRequest.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const models = {
  User,
  TimeLog,
  LeaveRequest
};

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;