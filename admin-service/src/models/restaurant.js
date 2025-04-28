const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerId: { type: String, required: true }, // Links to User (Restaurant Admin)
  isAvailable: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  menuItems: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Restaurant', restaurantSchema);

