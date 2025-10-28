// models/User.js (مثال)
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    // فیلدها...
  }, {
    tableName: 'Users',
    timestamps: true
  });

  return User;
};