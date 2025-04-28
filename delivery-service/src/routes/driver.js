const express = require('express');
const auth = require('../middleware/auth');
const Driver = require('../models/driver');

const router = express.Router();

// Register as a driver (for delivery personnel)
router.post('/register', auth(['delivery_personnel']), async (req, res) => {
  try {
    const { name, city, area, serviceAreas } = req.body;
    
    if (!name || !city) {
      return res.status(400).json({ error: 'Name and city are required' });
    }
    
    // Check if driver already exists
    let driver = await Driver.findOne({ userId: req.user.userId });
    if (driver) {
      return res.status(400).json({ error: 'Driver profile already exists' });
    }
    
    // Create new driver profile
    driver = new Driver({
      userId: req.user.userId,
      name,
      currentLocation: {
        city,
        area: area || '',
        lastUpdated: new Date()
      },
      serviceAreas: serviceAreas || [city],
      status: 'offline'
    });
    
    await driver.save();
    res.status(201).json(driver);
  } catch (error) {
    console.error('Error registering driver:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get driver profile
router.get('/profile', auth(['delivery_personnel']), async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update driver status and location
router.put('/status', auth(['delivery_personnel']), async (req, res) => {
  try {
    const { status, city, area, activeDeliveries, maxConcurrentDeliveries } = req.body;
    
    if (!city) {
      return res.status(400).json({ error: 'City is required' });
    }
    
    // Find driver profile
    const driver = await Driver.findOne({ userId: req.user.userId });
    if (!driver) {
      return res.status(404).json({ error: 'Driver profile not found' });
    }
    
    // Update status and location
    if (status) {
      driver.status = status;
    }
    
    driver.currentLocation = {
      city,
      area: area || '',
      lastUpdated: new Date()
    };
    
    // Update delivery counts if provided
    if (activeDeliveries !== undefined) {
      driver.activeDeliveries = activeDeliveries;
    }
    
    if (maxConcurrentDeliveries !== undefined) {
      driver.maxConcurrentDeliveries = maxConcurrentDeliveries;
    }
    
    // Auto-update status based on active deliveries
    if (driver.activeDeliveries >= driver.maxConcurrentDeliveries) {
      driver.status = 'busy';
    } else if (driver.activeDeliveries === 0 && driver.status === 'busy') {
      driver.status = 'available';
    }
    
    // Add to service areas if not already included
    if (!driver.serviceAreas.includes(city)) {
      driver.serviceAreas.push(city);
    }
    
    await driver.save();
    res.json(driver);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get available drivers (for admin)
router.get('/available', auth(['admin']), async (req, res) => {
  try {
    const { city } = req.query;
    
    const query = { 
      status: 'available',
      activeDeliveries: { $lt: 1 } // Fixed query to use a literal value instead of a field reference
    };
    
    // Filter by city if provided
    if (city) {
      query['currentLocation.city'] = { $regex: new RegExp(city, 'i') };
    }
    
    const drivers = await Driver.find(query).sort({ activeDeliveries: 1 });
    res.json(drivers);
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get driver by ID (for admin and customers)
router.get('/:id', auth(['admin', 'customer']), async (req, res) => {
  try {
    const driver = await Driver.findOne({ userId: req.params.id });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    
    res.json(driver);
  } catch (error) {
    console.error('Error fetching driver:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
