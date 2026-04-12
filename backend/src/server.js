// src/server.js

require('dotenv').config();

const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Step 1: Connect DB
    await sequelize.authenticate();
    console.log('PostgreSQL Connected');

    // Step 2: Sync tables
    await sequelize.sync({ alter: true });
    console.log('Tables synced');

    // Step 3: Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('Error starting server:', error);
  }
}

startServer();