const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  restaurantId: { type: String, required: true },
  restaurantName: { type: String, default: '' }, // Added restaurant name field
  items: { type: Array, required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'pending_payment', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'cash_on_delivery'],
    default: 'card'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  deliveryAssigned: { type: Boolean, default: false },
  deliveryAddress: { type: String },
  structuredAddress: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String }
  },
  notificationSent: { type: Boolean, default: false }, // Track if delivery notification was sent
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);