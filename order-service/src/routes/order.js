const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const auth = require('../middleware/auth');

// Place order
router.post('/', auth(['customer']), async (req, res) => {
  try {
    const { restaurantId, items, total } = req.body;
    if (!restaurantId || !items || !total) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const order = new Order({
      userId: req.user.userId,
      restaurantId,
      items,
      total,
      status: 'pending',
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Modify order
router.put('/:id', auth(['customer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { items, total } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot modify confirmed order' });
    }

    order.items = items || order.items;
    order.total = total || order.total;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order status
router.get('/:id/status', auth(['customer']), async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ id: order._id, status: order.status });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/', auth(['customer']), async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user.userId });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;