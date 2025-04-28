const express = require('express');
const router = express.Router();
const axios = require('axios');
const Order = require('../models/order');
const auth = require('../middleware/auth');
const notificationService = require('../utils/notificationService');

// Place order
router.post('/', auth(['customer']), async (req, res) => {
  try {
    console.log('Placing order with payload:', { ...req.body, items: req.body.items ? `${req.body.items.length} items` : 'No items' });
    
    const { restaurantId, items, total } = req.body;
    if (!restaurantId || !items || !total) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Ensure items have the necessary properties
    const validItems = items.map(item => ({
      _id: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity || 1,
      description: item.description || '',
      picture: item.picture || ''
    }));

    // Fetch restaurant name from restaurant service
    let restaurantName = '';
    try {
      const token = req.headers.authorization;
      const restaurantResponse = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3003'}/api/restaurants/${restaurantId}`,
        { headers: { Authorization: token } }
      );
      
      if (restaurantResponse.data && restaurantResponse.data.name) {
        restaurantName = restaurantResponse.data.name;
        console.log(`Retrieved restaurant name: ${restaurantName} for ID: ${restaurantId}`);
      }
    } catch (restaurantError) {
      console.error('Error fetching restaurant name:', restaurantError.message);
      // Continue with order creation even if we can't get the restaurant name
    }

    const order = new Order({
      userId: req.user.userId,
      restaurantId,
      restaurantName,
      items: validItems,
      total,
      status: 'pending',
    });

    await order.save();
    console.log('Order created successfully:', order._id);
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Get all orders (Admin only)
router.get('/admin', auth(['admin']), async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Get orders for a specific restaurant (Restaurant Admin)
router.get('/restaurant', auth(['restaurant_admin']), async (req, res) => {
  try {
    // Get the restaurant ID for this restaurant admin
    const token = req.headers.authorization;
    let restaurantId;
    
    try {
      // First, get the restaurant for this admin
      const restaurantResponse = await axios.get(
        `${process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3003'}/api/restaurants/my-restaurant`,
        { headers: { Authorization: token } }
      );
      
      if (restaurantResponse.data && restaurantResponse.data._id) {
        restaurantId = restaurantResponse.data._id;
      } else {
        return res.status(404).json({ error: 'Restaurant not found for this admin' });
      }
    } catch (restaurantError) {
      console.error('Error fetching restaurant:', restaurantError.message);
      return res.status(500).json({ error: 'Error fetching restaurant information' });
    }
    
    // Now get all orders for this restaurant
    const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });
    
    console.log(`Found ${orders.length} orders for restaurant ${restaurantId}`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching restaurant orders:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Modify order
router.put('/:id', auth(['customer']), async (req, res) => {
  try {
    const { id } = req.params;
    const { items, total } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot modify confirmed order' });
    }

    order.items = items || order.items;
    order.total = total || order.total;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get order status
router.get('/:id/status', auth(['customer']), async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ id: order._id, status: order.status });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get customer orders (limited to 5 most recent)
router.get('/', auth(['customer']), async (req, res) => {
  try {
    // Find orders for the current user, sort by createdAt in descending order (newest first)
    // and limit to 5 results
    const orders = await Order.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .limit(5);
    
    res.json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all pending orders (Admin only)
router.get('/pending', auth(['admin']), async (req, res) => {
  try {
    const orders = await Order.find({ status: 'pending' });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get orders pending delivery (Admin only)
router.get('/pending-delivery', auth(['admin']), async (req, res) => {
  try {
    // Find orders that are confirmed but not yet assigned for delivery
    const orders = await Order.find({ 
      status: 'confirmed',
      deliveryAssigned: { $ne: true } // Only get orders where delivery is not yet assigned
    });
    
    console.log('Found pending delivery orders:', orders.length);
    
    // Log whether orders have structured address
    orders.forEach(order => {
      if (order.structuredAddress && order.structuredAddress.city) {
        console.log(`Order ${order._id} has structured address with city: ${order.structuredAddress.city}`);
      } else if (order.deliveryAddress) {
        console.log(`Order ${order._id} has string address: ${order.deliveryAddress}`);
      } else {
        console.log(`Order ${order._id} has no address information`);
      }
    });
    
    // Enhance with customer and restaurant details if needed
    // For now, we'll return the basic order information
    res.json(orders);
  } catch (error) {
    console.error('Error fetching pending delivery orders:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Confirm order (Admin only)
router.put('/:id/confirm', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryAddress, customerEmail, structuredAddress } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order is not in pending status' });
    }
    
    // Update order status to confirmed
    order.status = 'confirmed';
    
    // Store both structured address and formatted address string
    if (structuredAddress) {
      order.structuredAddress = structuredAddress;
      console.log('Storing structured address with city:', structuredAddress.city);
    }
    
    if (deliveryAddress) {
      order.deliveryAddress = deliveryAddress;
    }
    
    await order.save();
    
    // Send email notification to customer
    try {
      // Use provided email or fetch from user service
      let emailToUse = customerEmail;
      
      if (!emailToUse) {
        // Fetch user email from user service
        try {
          const userResponse = await axios.get(
            `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/api/users/${order.userId}/email`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}`
              }
            }
          );
          
          if (userResponse.data && userResponse.data.email) {
            emailToUse = userResponse.data.email;
            console.log(`Retrieved email ${emailToUse} for user ${order.userId}`);
          }
        } catch (userServiceError) {
          console.error('Failed to fetch user email from user service:', userServiceError.message);
        }
      }
      
      if (emailToUse) {
        await notificationService.sendOrderConfirmation(id, emailToUse, {
          items: order.items,
          total: order.total
        });
        console.log(`Order confirmation email sent to ${emailToUse} for order ${id}`);
      } else {
        console.warn(`No email available for order ${id}, notification not sent`);
      }
    } catch (notificationError) {
      console.error('Failed to send order confirmation email:', notificationError);
      // Continue with the response even if notification fails
    }
    
    res.json({ message: 'Order confirmed successfully', order });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order when delivery is assigned
router.put('/:id/assign-delivery', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId, customerEmail, deliveryPerson, eta } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if already assigned to avoid duplicate assignments
    if (order.deliveryAssigned) {
      console.log(`Order ${id} is already assigned for delivery, no update needed`);
      return res.json({ 
        message: 'Order already assigned for delivery', 
        order,
        deliveryAssigned: true 
      });
    }
    
    // Mark the order as having delivery assigned
    order.deliveryAssigned = true;
    order.status = 'out_for_delivery';
    await order.save();
    
    console.log(`Order ${id} successfully marked as assigned for delivery`);
    
    
    // Send delivery notification to customer
    try {
      // Use provided email or fetch from user service
      let emailToUse = customerEmail;
      
      if (!emailToUse) {
        // Fetch user email from user service
        try {
          const userResponse = await axios.get(
            `${process.env.USER_SERVICE_URL || 'http://localhost:3001'}/api/users/${order.userId}/email`,
            {
              headers: {
                'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}`
              }
            }
          );
          
          if (userResponse.data && userResponse.data.email) {
            emailToUse = userResponse.data.email;
            console.log(`Retrieved email ${emailToUse} for user ${order.userId}`);
          }
        } catch (userServiceError) {
          console.error('Failed to fetch user email from user service:', userServiceError.message);
        }
      }
      
      if (emailToUse) {
        await notificationService.sendDeliveryNotification(id, emailToUse, {
          deliveryPerson,
          eta,
          phoneNumber: req.body.phoneNumber
        });
        console.log(`Order delivery email sent to ${emailToUse} for order ${id}`);
      } else {
        console.warn(`No email available for order ${id}, delivery notification not sent`);
      }
    } catch (notificationError) {
      console.error('Failed to send delivery notification email:', notificationError);
      // Continue with the response even if notification fails
    }
    
    // Notify driver if driver ID is provided
    if (driverId) {
      try {
        await notificationService.sendDriverAssignmentNotification(id, driverId);
      } catch (driverNotificationError) {
        console.error('Failed to send driver notification:', driverNotificationError);
        // Continue with the response even if driver notification fails
      }
    }
    
    res.json({ message: 'Order updated with delivery assignment', order });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order (Admin only)
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Delete the order
    await Order.findByIdAndDelete(id);
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order (Customer only - can only delete their own orders)
router.delete('/customer/:id', auth(['customer']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Verify that the order belongs to the customer
    if (order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized: You can only delete your own orders' });
    }
    
    // Only allow deletion of pending orders
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Cannot delete orders that are already confirmed or in delivery' });
    }
    
    // Delete the order
    await Order.findByIdAndDelete(id);
    
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific order by ID (Admin and delivery personnel)
router.get('/:id', auth(['admin', 'delivery_personnel', 'customer']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching order with ID: ${id}`);
    
    const order = await Order.findById(id);
    
    if (!order) {
      console.log(`Order with ID ${id} not found`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if order has restaurant name
    if (!order.restaurantName && order.restaurantId) {
      console.log(`Order ${id} missing restaurant name, has restaurant ID: ${order.restaurantId}`);
      
      try {
        // Fetch restaurant name from restaurant service if missing
        // Use JWT_SECRET directly for service-to-service communication
        const token = `Bearer ${process.env.JWT_SECRET}`;
        console.log(`Fetching restaurant details for restaurant ID: ${order.restaurantId}`);
        
        const restaurantResponse = await axios.get(
          `${process.env.RESTAURANT_SERVICE_URL || 'http://restaurant-service:3003'}/api/restaurants/${order.restaurantId}`,
          { headers: { Authorization: token } }
        );
        
        if (restaurantResponse.data && restaurantResponse.data.name) {
          // Update order with restaurant name
          order.restaurantName = restaurantResponse.data.name;
          console.log(`Retrieved and updated restaurant name: ${order.restaurantName}`);
          
          // Save the updated order
          await order.save();
        }
      } catch (restaurantError) {
        console.error('Error fetching restaurant details:', restaurantError.message);
        // Continue with response even if restaurant name fetch fails
      }
    }
    
    // Create a response object with enhanced restaurant information
    const enhancedOrder = order.toObject();
    
    // Ensure restaurant name is never empty in the response
    if (!enhancedOrder.restaurantName && enhancedOrder.restaurantId) {
      enhancedOrder.restaurantName = 'Restaurant #' + enhancedOrder.restaurantId;
    }
    
    console.log(`Returning order with restaurant name: ${enhancedOrder.restaurantName || 'Not available'}`);
    res.json(enhancedOrder);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order status to delivered (Delivery Personnel only)
router.put('/:id/mark-delivered', auth(['delivery_personnel']), async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Delivery personnel marking order ${id} as delivered`);
    
    const order = await Order.findById(id);
    
    if (!order) {
      console.log(`Order with ID ${id} not found`);
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order status to delivered
    order.status = 'delivered';
    await order.save();
    
    console.log(`Order ${id} successfully marked as delivered`);
    
    // Send delivery completion notification to customer if not already sent
    try {
      // Get user email
      const token = `Bearer ${process.env.JWT_SECRET}`;
      const userResponse = await axios.get(
        `${process.env.USER_SERVICE_URL || 'http://user-service:3001'}/api/users/${order.userId}/email`,
        { headers: { Authorization: token } }
      );
      
      if (userResponse.data && userResponse.data.email) {
        const customerEmail = userResponse.data.email;
        
        // Send delivery completion notification
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005'}/api/notifications/delivery-complete`,
          {
            orderId: id,
            customerEmail,
            orderDetails: {
              items: order.items,
              total: order.total,
              restaurantName: order.restaurantName
            }
          },
          { headers: { Authorization: token } }
        );
        
        console.log(`Delivery completion notification sent to ${customerEmail} for order ${id}`);
      }
    } catch (notificationError) {
      console.error('Error sending delivery completion notification:', notificationError);
      // Continue with the response even if notification fails
    }
    
    res.json({ 
      message: 'Order marked as delivered successfully',
      order
    });
  } catch (error) {
    console.error('Error marking order as delivered:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;