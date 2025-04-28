const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true }, // Added unique index to prevent duplicates
  driverId: { type: String, required: true },
  restaurantName: { type: String, default: '' }, // Added restaurant name field
  status: { 
    type: String, 
    enum: ['assigned', 'picked_up', 'delivered'], 
    default: 'assigned' 
  },
  location: { type: String, default: 'Restaurant' }, // Mock location
  deliveryAddress: { type: String }, // Address where the order should be delivered (string format)
  structuredAddress: { // Structured address object
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String }
  },
  createdAt: { type: Date, default: Date.now },
});

// Create an index on orderId to ensure uniqueness and improve query performance
deliverySchema.index({ orderId: 1 }, { unique: true });

module.exports = mongoose.model('Delivery', deliverySchema);