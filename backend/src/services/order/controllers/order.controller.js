exports.placeOrder = async (req, res) => {
  try {
    res.status(400).json({ message: 'Please complete payment before placing an order' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
