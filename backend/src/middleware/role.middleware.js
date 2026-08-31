const User = require('../models/user');
const logger = require('../utils/logger');

module.exports = (roles) => {
  return async (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role !== 'VENDOR') {
      return next();
    }

    try {
      const vendor = await User.findByPk(req.user.id, {
        attributes: ['id', 'role', 'isVerified']
      });

      if (!vendor || vendor.role !== 'VENDOR') {
        return res.status(403).json({ message: 'Vendor access denied' });
      }

      if (!vendor.isVerified) {
        return res.status(403).json({ message: 'Vendor account is awaiting admin approval' });
      }

      return next();
    } catch (error) {
      logger.error('Vendor authorization check failed', error);
      return res.status(503).json({ message: 'Unable to verify vendor access' });
    }
  };
};
