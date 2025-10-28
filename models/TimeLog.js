// models/TimeLog.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TimeLog = sequelize.define('TimeLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    enterTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    exitTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deductions: {
      type: DataTypes.FLOAT,
      defaultValue: 0
    },
    totalTime: {
      type: DataTypes.FLOAT,
      allowNull: true
    }
  }, {
    tableName: 'time_logs',
    timestamps: true
  });

  return TimeLog;
};