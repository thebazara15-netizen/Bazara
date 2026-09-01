const User = require('../../../models/user');

const safeFields = [
  'id', 'email', 'firstName', 'lastName', 'companyName',
  'phone', 'location', 'businessType', 'aboutCompany'
];
const editableFields = ['firstName', 'lastName', 'companyName', 'phone', 'location', 'businessType', 'aboutCompany'];
const limits = { firstName: 100, lastName: 100, companyName: 200, phone: 30, location: 200, businessType: 150, aboutCompany: 2000 };

const serialize = (user) => Object.fromEntries(safeFields.map((field) => [field, user[field] ?? null]));

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: safeFields });
    if (!user || user.role && user.role !== 'CLIENT') return res.status(404).json({ message: 'Buyer profile not found' });
    return res.json(serialize(user));
  } catch {
    return res.status(500).json({ message: 'Unable to load buyer profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== 'CLIENT') return res.status(404).json({ message: 'Buyer profile not found' });

    const updates = {};
    for (const field of editableFields) {
      if (req.body?.[field] === undefined) continue;
      const value = String(req.body[field] ?? '').trim();
      if (value.length > limits[field]) return res.status(400).json({ message: `${field} is too long` });
      updates[field] = value || null;
    }
    if (updates.phone && !/^[+()\-\s\d]{7,30}$/.test(updates.phone)) {
      return res.status(400).json({ message: 'Enter a valid phone number' });
    }
    if (!Object.keys(updates).length) return res.status(400).json({ message: 'No editable profile fields provided' });

    await user.update(updates, { fields: editableFields });
    return res.json({ message: 'Profile updated', profile: serialize(user) });
  } catch {
    return res.status(500).json({ message: 'Unable to update buyer profile' });
  }
};
