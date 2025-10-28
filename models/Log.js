const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  enterTime: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  exitTime: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  deductions: {
    type: DataTypes.BIGINT,
    defaultValue: 0
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: false
});

module.exports = Log;
