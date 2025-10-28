require('dotenv').config(); // ADD AT TOP
const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 3003;
  
sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ Database synchronized');
    console.log('🔧 Environment:', process.env.NODE_ENV);
    
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Health: http://localhost:${PORT}/health`);
      console.log(`👨‍💼 Admin: http://localhost:${PORT}/admin`);
    });
  })
  .catch(error => {
    console.error('❌ Database sync error:', error);
    process.exit(1);
  });