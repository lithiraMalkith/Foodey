const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: { type: String, required: true }, 
  driverId: { type: String, required: true },
  restaurantName: { type: String, default: '' }, 
  status: { 
    type: String, 
    enum: ['assigned', 'picked_up', 'delivered'], 
    default: 'assigned' 
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
  location: { type: String, default: 'Restaurant' }, 
  deliveryAddress: { type: String }, 
  structuredAddress: { 
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String }
  },
  notificationSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

deliverySchema.index({ orderId: 1 }, { unique: true });

module.exports = mongoose.model('Delivery', deliverySchema);