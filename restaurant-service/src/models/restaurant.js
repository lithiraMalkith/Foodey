const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  picture: { type: String }, // URL or base64 string
  ownerId: { type: String, required: true }, // Links to User (Restaurant Admin)
  isAvailable: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  menuItems: [{
    name: { type: String, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    picture: { type: String }, // URL or base64 string
    available: { type: Boolean, default: true }, // Whether the item is available to order
  }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Restaurant', restaurantSchema);