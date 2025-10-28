const User = require('./User')(sequelize, DataTypes);
const TimeLog = require('./TimeLog')(sequelize, DataTypes);
const LeaveRequest = require('./LeaveRequest')(sequelize, DataTypes); // این خط رو اضافه کنید

const models = {
  User,
  TimeLog,
  LeaveRequest  // اینم اضافه کنید
};

// روابط بین مدل‌ها (اختیاری - اگر نیاز هست)
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;