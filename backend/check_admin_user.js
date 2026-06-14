require('dotenv').config();
const sequelize = require('./src/config/database');
const User = require('./src/models/user');

(async () => {
  try {
    await sequelize.authenticate();
    const admins = await User.findAll({
      where: { role: 'ADMIN' },
      attributes: ['id', 'email', 'role', 'password']
    });
    console.log(JSON.stringify(admins.map(u => u.toJSON()), null, 2));
  } catch (error) {
    console.error('ERROR:', error.message || error);
  } finally {
    await sequelize.close();
  }
})();
