require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });
const { sequelize, User } = require('./src/models');

(async () => {
  try {
    await sequelize.authenticate();
    const [tables] = await sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name"
    );
    console.log('Tables:', tables.map((table) => table.table_name).join(', '));

    const admins = await User.findAll({
      where: { role: 'ADMIN' },
      attributes: ['id', 'email', 'role', 'isVerified', 'createdAt', 'updatedAt']
    });
    console.log('Admins:', JSON.stringify(admins.map(u => u.toJSON()), null, 2));
  } catch (error) {
    console.error('ERROR:', error.message || error);
  } finally {
    await sequelize.close();
  }
})();
