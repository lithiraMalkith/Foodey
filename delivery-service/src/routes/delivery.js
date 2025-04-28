const express = require('express');
const router = express.Router();
const Delivery = require('../models/delivery');
const Driver = require('../models/driver');
const auth = require('../middleware/auth');
const axios = require('axios');
const { autoAssignDriver, extractCity } = require('../utils/assignmentService');

// Auto-assign delivery based on city matching
router.post('/auto-assign', auth(['admin']), async (req, res) => {
  try {
    console.log('Auto-assign request received:', req.body);
    const { orderId, orderAddress, restaurantName, restaurantId } = req.body;
    
    if (!orderId || !orderAddress) {
      console.log('Missing required fields:', { orderId, orderAddress });
      return res.status(400).json({ error: 'Order ID and delivery address are required' });
    }
    
    // Log restaurant information if provided
    if (restaurantName) {
      console.log(`Restaurant name provided in request: ${restaurantName}`);
    }
    if (restaurantId) {
      console.log(`Restaurant ID provided in request: ${restaurantId}`);
    }
    
    // First check if delivery already exists for this order using a robust query
    try {
      const existingDelivery = await Delivery.findOne({ orderId });
      if (existingDelivery) {
        console.log(`Delivery already exists for order: ${orderId}`);
        
        // Instead of returning an error, return the existing delivery with a message
        return res.status(200).json({
          message: 'Delivery already assigned',
          delivery: existingDelivery,
          success: true,
          alreadyAssigned: true
        });
      }
    } catch (findError) {
      console.error(`Error checking for existing delivery for order ${orderId}:`, findError);
      // Continue with the assignment attempt even if the check fails
    }
    
    console.log('Order address type:', typeof orderAddress);
    if (typeof orderAddress === 'object') {
      console.log('Using structured address object with city:', orderAddress.city);
    }
    
    let addressToUse = orderAddress;
    
    if (typeof orderAddress === 'string') {
      try {
        // Create proper authorization header for service-to-service communication
        let token = req.headers.authorization;
        if (!token || token === 'undefined' || token === 'null') {
          token = `Bearer ${process.env.JWT_SECRET}`;
        }
        
        // Fetch the order to get the structured address
        const orderResponse = await axios.get(
          `${process.env.ORDER_SERVICE_URL || 'http://order-service:3002'}/api/orders/${orderId}`,
          { headers: { Authorization: token } }
        );
        
        // Use structured address if available
        if (orderResponse.data && orderResponse.data.structuredAddress && orderResponse.data.structuredAddress.city) {
          addressToUse = orderResponse.data.structuredAddress;
          console.log('Using structured address from order service:', addressToUse);
        }
      } catch (error) {
        console.error('Error fetching order details:', error.message);
        // Continue with the string address if we can't fetch the structured address
      }
    }
    
    // Assign driver using the best available address information and restaurant info if provided
    const result = await autoAssignDriver(orderId, addressToUse, restaurantName, restaurantId);
    
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    
    // Update order service to mark delivery as assigned
    try {
      const token = req.headers.authorization;
      // Call the assign-delivery endpoint instead of status endpoint
      await axios.put(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}/assign-delivery`,
        {}, // No need to pass additional data as the endpoint handles setting deliveryAssigned=true
        { headers: { Authorization: token } }
      );
      console.log(`Successfully marked order ${orderId} as assigned for delivery`);
    } catch (notifyError) {
      console.error('Error updating order delivery status:', notifyError);
      // Continue even if notification fails
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error auto-assigning delivery:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Manually assign delivery (Admin action)
router.post('/assign', auth(['admin']), async (req, res) => {
  try {
    const { orderId, driverId } = req.body;
    if (!orderId || !driverId) {
      return res.status(400).json({ error: 'Order ID and Driver ID required' });
    }

    // Fetch the order to get the delivery address and restaurant name - simplified approach
    let deliveryAddress = null;
    let restaurantName = '';
    let structuredAddress = null;
    
    try {
      console.log(`Fetching order details for order ID: ${orderId}`);
      
      // Create proper authorization header for service-to-service communication
      // Use JWT_SECRET directly for reliable service-to-service communication
      const token = `Bearer ${process.env.JWT_SECRET}`;
      
      console.log('Using authorization header:', token.substring(0, 15) + '...');
      console.log('Calling order service URL:', process.env.ORDER_SERVICE_URL || 'http://order-service:3002');
      
      // The enhanced order endpoint now handles restaurant name retrieval internally
      const orderResponse = await axios.get(
        `${process.env.ORDER_SERVICE_URL || 'http://order-service:3002'}/api/orders/${orderId}`,
        { headers: { Authorization: token } }
      );
      
      console.log('Order response status:', orderResponse.status);
      
      // Get the delivery address and restaurant name from the order
      if (orderResponse.data) {
        // Get delivery address
        if (orderResponse.data.deliveryAddress) {
          deliveryAddress = orderResponse.data.deliveryAddress;
          console.log(`Found delivery address: ${deliveryAddress}`);
        }
        
        // Get structured address
        if (orderResponse.data.structuredAddress) {
          structuredAddress = orderResponse.data.structuredAddress;
          console.log(`Found structured address with city: ${structuredAddress.city || 'N/A'}`);
        }
        
        // Get restaurant name - the enhanced order endpoint ensures this is available
        if (orderResponse.data.restaurantName) {
          restaurantName = orderResponse.data.restaurantName;
          console.log(`Using restaurant name from order: ${restaurantName}`);
        } else {
          console.warn('Order data received but missing restaurant name');
        }
      }
    } catch (orderFetchError) {
      console.error('Failed to fetch order details:', orderFetchError.message);
      if (orderFetchError.response) {
        console.error('Order service response:', orderFetchError.response.status, orderFetchError.response.data);
      }
      // Continue even if we can't fetch the order, but log the error
    }

    // Create the delivery assignment with the address and restaurant name if available
    const delivery = new Delivery({ 
      orderId, 
      driverId,
      restaurantName: restaurantName || 'Unknown Restaurant', // Provide a fallback value if restaurant name is empty
      deliveryAddress,
      structuredAddress
    });
    
    console.log('Creating delivery with restaurant name:', restaurantName || 'Unknown Restaurant');
    await delivery.save();
    
    // Update the order status via the order service to set deliveryAssigned=true
    try {
      const token = req.headers.authorization;
      const orderUpdateResponse = await axios.put(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}/assign-delivery`,
        {},
        { headers: { Authorization: token } }
      );
      
      console.log(`Successfully marked order ${orderId} as assigned for delivery`);
      
      // Verify the response to ensure the update was successful
      if (orderUpdateResponse.data && orderUpdateResponse.data.deliveryAssigned) {
        console.log(`Order ${orderId} deliveryAssigned flag confirmed as true`);
      } else {
        console.warn(`Order ${orderId} was updated but deliveryAssigned flag status is unclear`);
      }
    } catch (orderError) {
      console.error('Failed to update order delivery status:', orderError.message);
      if (orderError.response) {
        console.error('Error response:', orderError.response.status, orderError.response.data);
      }
      // Continue even if order update fails, but log the error
    }
    
    res.status(201).json(delivery);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
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

module.exports = router;