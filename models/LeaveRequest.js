// models/LeaveRequest.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LeaveRequest = sequelize.define('LeaveRequest', {
    id: { 
      type: DataTypes.INTEGER, 
      primaryKey: true, 
      autoIncrement: true 
    },
    userId: { 
      type: DataTypes.INTEGER, 
      allowNull: false 
    },
    type: { 
      type: DataTypes.ENUM('HOURLY', 'DAILY'), 
      allowNull: false 
    },
    startDate: { 
      type: DataTypes.DATE, 
      allowNull: false 
    },
    endDate: { 
      type: DataTypes.DATE, 
      allowNull: true 
    },
    hours: { 
      type: DataTypes.FLOAT, 
      allowNull: true 
    },
    reason: { 
      type: DataTypes.TEXT, 
      allowNull: true 
    },
    status: { 
      type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'), 
      defaultValue: 'PENDING' 
    }
  }, {
    tableName: 'LeaveRequests',
    timestamps: true
  });

  return LeaveRequest;
};