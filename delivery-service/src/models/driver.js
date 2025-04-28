const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['available', 'busy', 'offline'], 
    default: 'offline' 
  },
  currentLocation: {
    city: { type: String, required: true },
    area: { type: String },
    lastUpdated: { type: Date, default: Date.now }
  },
  serviceAreas: [{ type: String }], // List of cities the driver serves
  activeDeliveries: { type: Number, default: 0 },
  maxConcurrentDeliveries: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Driver', driverSchema);
