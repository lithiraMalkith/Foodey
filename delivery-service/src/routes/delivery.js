const express = require('express');
const router = express.Router();
const Delivery = require('../models/delivery');
const Driver = require('../models/driver');
const auth = require('../middleware/auth');
const axios = require('axios');
const jwt = require('jsonwebtoken'); // Import jwt
const { extractCity } = require('../utils/assignmentService');

// Auto-assign delivery based on city matching
router.post('/auto-assign', auth(['admin']), async (req, res) => {
  try {
    const { orderId, orderAddress, restaurantName, restaurantId, paymentMethod, paymentStatus } = req.body;
    
    if (!orderId || !orderAddress) {
      return res.status(400).json({ error: 'Order ID and delivery address are required' });
    }

    // Check if delivery already exists - use findOne with a try/catch to handle race conditions
    try {
      const existingDelivery = await Delivery.findOne({ orderId });
      if (existingDelivery) {
        return res.status(200).json({
          success: true,
          message: 'Delivery already assigned',
          delivery: existingDelivery,
          alreadyAssigned: true
        });
      }
    } catch (findError) {
      console.error('Error checking for existing delivery:', findError);
    }

    // Find available drivers
    let city;
    
    // For structured address, always use the city field directly
    if (typeof orderAddress === 'object' && orderAddress.city) {
      city = orderAddress.city;
      console.log(`Using city from structured address: ${city}`);
    } else {
      // For string address, extract city
      city = extractCity(orderAddress);
      console.log(`Extracted city from string address: ${city}`);
    }

    if (!city) {
      return res.status(200).json({
        success: false,
        error: 'Could not determine city from address',
        pendingAssignment: true,
        orderId
      });
    }

    console.log(`Searching for drivers in city: ${city}`);

    // Find available drivers in the city - simple city matching
    const drivers = await Driver.find({
      status: 'available',
      activeDeliveries: { $lt: 1 },
      'currentLocation.city': { $regex: new RegExp(city, 'i') } // Case-insensitive match
    }).sort({ activeDeliveries: 1 });

    if (drivers.length === 0) {
      return res.status(200).json({
        success: false,
        error: `No available drivers found in ${city}`,
        pendingAssignment: true,
        orderId
      });
    }

    // Select the driver with fewest active deliveries
    const driver = drivers[0];

    // Format the address as a string if it's an object
    let deliveryAddressString = orderAddress;
    let structuredAddressObj = null;

    if (typeof orderAddress === 'object') {
      structuredAddressObj = orderAddress;
      deliveryAddressString = `${orderAddress.street || ''}, ${orderAddress.city || ''}, ${orderAddress.state || ''}, ${orderAddress.zipCode || ''}`;
    }

    // Create a new delivery
    let delivery;
    try {
      delivery = new Delivery({
        orderId,
        driverId: driver.userId,
        restaurantName: restaurantName || 'Unknown Restaurant',
        deliveryAddress: deliveryAddressString,
        structuredAddress: structuredAddressObj,
        paymentMethod: paymentMethod || 'card',
        paymentStatus: paymentStatus || 'pending',
        notificationSent: false
      });
      
      await delivery.save();
    } catch (saveError) {
      // Check if this is a duplicate key error (orderId already exists)
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.orderId) {
        // Try to fetch the existing delivery
        const existingDelivery = await Delivery.findOne({ orderId });
        if (existingDelivery) {
          return res.status(200).json({
            success: true,
            message: 'Delivery already assigned (detected during save)',
            delivery: existingDelivery,
            alreadyAssigned: true
          });
        }
      }
      
      // For other errors, return a failure response
      console.error('Error saving delivery:', saveError);
      return res.status(500).json({ error: 'Failed to create delivery assignment' });
    }

    // Update driver status
    driver.activeDeliveries += 1;
    if (driver.activeDeliveries >= driver.maxConcurrentDeliveries) {
      driver.status = 'busy';
    }
    await driver.save();

    // Update order service to mark delivery as assigned
    try {
      // Create an admin token for service-to-service communication
      const adminToken = jwt.sign(
        { userId: 'service', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      await axios.put(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}/assign-delivery`,
        {}, 
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch (error) {
      console.error('Error updating order delivery status:', error);
    }

    return res.status(201).json({
      success: true,
      delivery,
      driverName: driver.name,
      driverCity: driver.currentLocation.city
    });
  } catch (error) {
    console.error('Error auto-assigning delivery:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Manually assign delivery (Admin action)
router.post('/assign', auth(['admin']), async (req, res) => {
  try {
    const { orderId, driverId, orderAddress, restaurantName, paymentMethod, paymentStatus } = req.body;
    
    if (!orderId || !driverId) {
      return res.status(400).json({ error: 'Order ID and Driver ID required' });
    }

    // Check if delivery already exists - use findOne with a try/catch to handle race conditions
    try {
      const existingDelivery = await Delivery.findOne({ orderId });
      if (existingDelivery) {
        return res.status(200).json({
          success: true,
          message: 'Delivery already assigned',
          delivery: existingDelivery,
          alreadyAssigned: true
        });
      }
    } catch (findError) {
      console.error('Error checking for existing delivery:', findError);
    }

    // Get driver
    const driver = await Driver.findOne({ userId: driverId });
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Format the address as a string if it's an object
    let deliveryAddressString = orderAddress;
    let structuredAddressObj = null;

    if (typeof orderAddress === 'object') {
      structuredAddressObj = orderAddress;
      deliveryAddressString = `${orderAddress.street || ''}, ${orderAddress.city || ''}, ${orderAddress.state || ''}, ${orderAddress.zipCode || ''}`;
    }

    // Create a new delivery
    let delivery;
    try {
      delivery = new Delivery({
        orderId,
        driverId: driver.userId,
        restaurantName: restaurantName || 'Unknown Restaurant',
        deliveryAddress: deliveryAddressString || '',
        structuredAddress: structuredAddressObj,
        paymentMethod: paymentMethod || 'card',
        paymentStatus: paymentStatus || 'pending',
        notificationSent: false
      });
      
      await delivery.save();
    } catch (saveError) {
      // Check if this is a duplicate key error (orderId already exists)
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.orderId) {
        // Try to fetch the existing delivery
        const existingDelivery = await Delivery.findOne({ orderId });
        if (existingDelivery) {
          return res.status(200).json({
            success: true,
            message: 'Delivery already assigned (detected during save)',
            delivery: existingDelivery,
            alreadyAssigned: true
          });
        }
      }
      
      // For other errors, return a failure response
      console.error('Error saving delivery:', saveError);
      return res.status(500).json({ error: 'Failed to create delivery assignment' });
    }

    // Update driver status
    driver.activeDeliveries += 1;
    if (driver.activeDeliveries >= driver.maxConcurrentDeliveries) {
      driver.status = 'busy';
    }
    await driver.save();

    // Update order service to mark delivery as assigned
    try {
      // Create an admin token for service-to-service communication
      const adminToken = jwt.sign(
        { userId: 'service', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
      
      await axios.put(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}/assign-delivery`,
        {}, 
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
    } catch (error) {
      console.error('Error updating order delivery status:', error);
    }

    return res.status(201).json({
      success: true,
      delivery,
      driverName: driver.name,
      driverCity: driver.currentLocation.city
    });
  } catch (error) {
    console.error('Error manually assigning delivery:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Update delivery status (Delivery Personnel)
router.put('/:id/status', auth(['delivery_personnel']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, location } = req.body;

    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    if (delivery.driverId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    delivery.status = status || delivery.status;
    delivery.location = location || delivery.location;
    await delivery.save();
    
    // If the order is marked as delivered, send a delivery completion notification
    if (status === 'delivered') {
      try {
        // Add a flag to the delivery to track if notification was sent
        if (delivery.notificationSent) {
          console.log(`Notification already sent for delivery ${id}, skipping`);
        } else {
          // Get the order details to find the customer email
          const token = req.headers.authorization;
          const orderResponse = await axios.get(
            `${process.env.ORDER_SERVICE_URL}/api/orders/${delivery.orderId}`,
            { headers: { Authorization: token } }
          );
          
          if (orderResponse.data && orderResponse.data.userId) {
            // Get the customer's email from the user service
            const userResponse = await axios.get(
              `${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${orderResponse.data.userId}/email`,
              { headers: { Authorization: token } }
            );
            
            if (userResponse.data && userResponse.data.email) {
              // Send delivery completion notification
              await axios.post(
                `${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005'}/api/notifications/customer/delivery-complete`,
                {
                  orderId: delivery.orderId,
                  customerEmail: userResponse.data.email,
                  deliveryDetails: {
                    deliveryPerson: req.user.name || 'Delivery Personnel',
                    completedAt: new Date().toISOString(),
                    deliveryAddress: delivery.deliveryAddress
                  }
                },
                { headers: { Authorization: token } }
              );
              console.log(`Delivery completion notification sent for order ${delivery.orderId}`);
              
              // Mark notification as sent
              delivery.notificationSent = true;
              await delivery.save();
              
              // Also update the order service to let it know a notification was sent
              try {
                await axios.put(
                  `${process.env.ORDER_SERVICE_URL}/api/orders/${delivery.orderId}/update-notification-status`,
                  { notificationSent: true },
                  { headers: { Authorization: token } }
                );
                console.log(`Updated order service that notification was sent for order ${delivery.orderId}`);
              } catch (orderUpdateError) {
                console.error(`Failed to update order service about notification status: ${orderUpdateError.message}`);
                // Continue even if this update fails
              }
            }
          }
        }
      } catch (notificationError) {
        console.error('Failed to send delivery completion notification:', notificationError);
        // Continue even if notification fails
      }
    }
    
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List driver deliveries (Delivery Personnel)
router.get('/driver', auth(['delivery_personnel']), async (req, res) => {
  try {
    const deliveries = await Delivery.find({ driverId: req.user.userId });
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all deliveries for admin dashboard
router.get('/', auth(['admin']), async (req, res) => {
  try {
    const deliveries = await Delivery.find({});
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all deliveries (Admin only)
router.get('/all', auth(['admin']), async (req, res) => {
  try {
    const deliveries = await Delivery.find({});
    res.json(deliveries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track delivery (Customer) - Must be after all specific routes but before ID parameter routes
router.get('/:orderId/track', auth(['customer']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const delivery = await Delivery.findOne({ orderId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    res.json({ orderId, status: delivery.status, location: delivery.location });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update notification status (Service-to-service communication)
router.put('/:orderId/notification-sent', auth(['admin', 'service']), async (req, res) => {
  try {
    const { orderId } = req.params;
    const { notificationSent } = req.body;
    
    if (notificationSent === undefined) {
      return res.status(400).json({ error: 'notificationSent field is required' });
    }
    
    const delivery = await Delivery.findOne({ orderId });
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }
    
    // Update the delivery with notification status
    delivery.notificationSent = notificationSent;
    await delivery.save();
    
    console.log(`Delivery for order ${orderId} notification status updated to: ${notificationSent}`);
    
    res.json({ 
      success: true, 
      message: 'Delivery notification status updated successfully'
    });
  } catch (error) {
    console.error('Error updating delivery notification status:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

module.exports = router;