const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const AdminAction = require('../models/adminAction');
const auth = require('../middleware/auth');

// Delete user (Admin)
router.delete('/users/:id', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await mongoose.model('User').findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const action = new AdminAction({
      adminId: req.user.userId,
      action: 'delete_user',
      targetId: id,
    });
    await action.save();

    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify restaurant (Admin)
router.put('/restaurants/:id/verify', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await mongoose.model('Restaurant').findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    restaurant.isVerified = true;
    await restaurant.save();

    const action = new AdminAction({
      adminId: req.user.userId,
      action: 'verify_restaurant',
      targetId: id,
    });
    await action.save();

    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;