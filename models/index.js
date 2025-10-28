const User = require('./User');
const Log = require('./Log');
const sequelize = require('../config/database');
const LeaveRequest = require('./LeaveRequest')(sequelize, DataTypes);
// ایجاد ارتباط بدون foreign key constraint برای جلوگیری از خطا
User.hasMany(Log, { foreignKey: 'userId' });
Log.belongsTo(User, { foreignKey: 'userId' });

module.exports = {  
  User,
  Log,
  sequelize
};
