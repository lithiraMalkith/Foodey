const mongoose = require('mongoose');

const adminActionSchema = new mongoose.Schema({
  adminId: { type: String, required: true },
  action: { type: String, required: true },
  targetId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('AdminAction', adminActionSchema);