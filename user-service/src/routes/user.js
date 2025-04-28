const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Automatically approve customer accounts, but require approval for other roles
    const approved = role === 'customer' ? true : false;
    
    const user = new User({ 
      email, 
      password: hashedPassword, 
      name, 
      role,
      approved
    });
    
    await user.save();
    
    // Different messages based on role
    const message = role === 'customer' 
      ? 'User registered successfully' 
      : 'Registration submitted successfully. Your account requires approval by an administrator.';

    res.status(201).json({ message });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Check if the user is approved (customers are automatically approved)
    if (user.role !== 'customer' && !user.approved) {
      return res.status(403).json({ 
        error: 'Your account is pending approval by an administrator. Please check back later.'
      });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token, role: user.role, name: user.name, userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Profile
router.get('/profile', auth(['customer', 'restaurant_admin', 'delivery_personnel', 'admin']), async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Add address
router.post('/address', auth(['customer']), async (req, res) => {
  try {
    const { street, city, state, zipCode, isDefault } = req.body;
    
    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({ error: 'All address fields are required' });
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If this is the default address, unset any existing default
    if (isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // If this is the first address, make it default
    const makeDefault = isDefault || user.addresses.length === 0;
    
    user.addresses.push({
      street,
      city,
      state,
      zipCode,
      isDefault: makeDefault
    });
    
    await user.save();
    
    res.json({ message: 'Address added successfully', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update address
router.put('/address/:addressId', auth(['customer']), async (req, res) => {
  try {
    const { addressId } = req.params;
    const { street, city, state, zipCode, isDefault } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    // If setting as default, unset any existing default
    if (isDefault && !address.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // Update address fields
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.zipCode = zipCode || address.zipCode;
    address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;
    
    await user.save();
    
    res.json({ message: 'Address updated successfully', addresses: user.addresses });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's default address
router.get('/:userId/address', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Find the default address
    const defaultAddress = user.addresses.find(addr => addr.isDefault);
    
    // If no default address is set but there are addresses, use the first one
    const addressToUse = defaultAddress || (user.addresses.length > 0 ? user.addresses[0] : null);
    
    res.json({ defaultAddress: addressToUse });
  } catch (error) {
    console.error('Error fetching user address:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete address
router.delete('/address/:addressId', auth(['customer']), async (req, res) => {
  try {
    const { addressId } = req.params;
    
    // Find the user and get the address to check if it was default
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ error: 'Address not found' });
    }
    
    const wasDefault = address.isDefault;
    
    // Remove the address using pull operator
    user.addresses.pull(addressId);
    
    // If the removed address was the default and there are other addresses,
    // make the first one the new default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save();
    
    res.json({ message: 'Address deleted successfully', addresses: user.addresses });
  } catch (error) {
    console.error('Error deleting address:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all users (Admin only)
router.get('/all', auth(['admin']), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Approve a user account (Admin only)
router.put('/:userId/approve', auth(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Only non-customer accounts need approval
    if (user.role === 'customer') {
      return res.status(400).json({ error: 'Customer accounts do not require approval' });
    }
    
    user.approved = true;
    await user.save();
    
    res.json({ message: 'User account approved successfully' });
  } catch (error) {
    console.error('Error approving user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all delivery personnel (Admin only)
router.get('/delivery-personnel', auth(['admin']), async (req, res) => {
  try {
    const deliveryPersonnel = await User.find({ role: 'delivery_personnel' }).select('-password');
    res.json(deliveryPersonnel);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user by ID (Admin only)
router.get('/:id', auth(['admin', 'restaurant_admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user email by ID (For notification service and delivery personnel)
router.get('/:id/email', auth(['admin', 'delivery_personnel']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('email');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ email: user.email });
  } catch (error) {
    console.error('Error fetching user email:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (Admin only)
router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const { name, email, role } = req.body;
    
    // Validate inputs
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }
    
    // Check if user exists
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is already taken by another user
    if (email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }
    
    // Update user
    user.name = name;
    user.email = email;
    user.role = role;
    
    await user.save();
    
    res.json({ message: 'User updated successfully', user: { _id: user._id, name, email, role } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (Admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;