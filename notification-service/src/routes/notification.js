const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const emailService = require('../utils/emailService');

// Send customer order confirmation email
router.post('/customer/confirmation', auth(['admin', 'restaurant_admin']), async (req, res) => {
  try {
    console.log('Received order confirmation request:', JSON.stringify(req.body));
    console.log('Auth user:', req.user);
    
    const { orderId, customerEmail, orderDetails } = req.body;
    if (!orderId || !customerEmail) {
      console.error('Missing required fields:', { orderId, customerEmail });
      return res.status(400).json({ error: 'Order ID and customer email required' });
    }

    console.log(`Attempting to send confirmation email to ${customerEmail} for order ${orderId}`);
    console.log('Order details:', JSON.stringify(orderDetails));

    // Send real email notification
    const emailResult = await emailService.sendOrderConfirmationEmail(customerEmail, orderId, orderDetails);
    
    console.log('Email result:', JSON.stringify(emailResult));
    
    if (!emailResult.success) {
      console.error(`Failed to send confirmation email for order ${orderId}:`, emailResult.error);
      return res.status(500).json({ error: 'Failed to send email notification', details: emailResult.error });
    }

    // Log for tracking
    console.log(`Order confirmation email sent to ${customerEmail} for order ${orderId}`);

    res.json({ message: 'Order confirmation email sent successfully', messageId: emailResult.messageId });
  } catch (error) {
    console.error('Error in order confirmation notification:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
  }
});

// Send delivery notification email to customer
router.post('/customer/delivery', auth(['admin', 'delivery_personnel']), async (req, res) => {
  try {
    console.log('Received delivery notification request:', JSON.stringify(req.body));
    console.log('Auth user:', req.user);
    
    const { orderId, customerEmail, deliveryDetails } = req.body;
    if (!orderId || !customerEmail) {
      console.error('Missing required fields:', { orderId, customerEmail });
      return res.status(400).json({ error: 'Order ID and customer email required' });
    }

    console.log(`Attempting to send delivery email to ${customerEmail} for order ${orderId}`);
    console.log('Delivery details:', JSON.stringify(deliveryDetails));

    // Send real email notification
    const emailResult = await emailService.sendOrderDeliveryEmail(customerEmail, orderId, deliveryDetails);
    
    console.log('Email result:', JSON.stringify(emailResult));
    
    if (!emailResult.success) {
      console.error(`Failed to send delivery email for order ${orderId}:`, emailResult.error);
      return res.status(500).json({ error: 'Failed to send email notification', details: emailResult.error });
    }

    // Log for tracking
    console.log(`Order delivery email sent to ${customerEmail} for order ${orderId}`);

    res.json({ message: 'Order delivery email sent successfully', messageId: emailResult.messageId });
  } catch (error) {
    console.error('Error in order delivery notification:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
  }
});

// Send delivery completion notification to customer (backend service call)
router.post('/customer/delivery-complete', auth(['admin', 'delivery_personnel']), async (req, res) => {
  try {
    console.log('Received delivery completion notification request:', JSON.stringify(req.body));
    console.log('Auth user:', req.user);
    
    const { orderId, customerEmail, deliveryDetails } = req.body;
    if (!orderId || !customerEmail) {
      console.error('Missing required fields:', { orderId, customerEmail });
      return res.status(400).json({ error: 'Order ID and customer email required' });
    }

    console.log(`Attempting to send delivery completion email to ${customerEmail} for order ${orderId}`);
    console.log('Delivery details:', JSON.stringify(deliveryDetails));

    // Send real email notification
    const emailResult = await emailService.sendOrderDeliveryEmail(customerEmail, orderId, {
      ...deliveryDetails,
      isCompleted: true,
      message: 'Your order has been successfully delivered!'
    });
    
    console.log('Email result:', JSON.stringify(emailResult));
    
    if (!emailResult.success) {
      console.error(`Failed to send delivery completion email for order ${orderId}:`, emailResult.error);
      return res.status(500).json({ error: 'Failed to send email notification', details: emailResult.error });
    }

    // Log for tracking
    console.log(`Order delivery completion email sent to ${customerEmail} for order ${orderId}`);

    res.json({ message: 'Order delivery completion email sent successfully', messageId: emailResult.messageId });
  } catch (error) {
    console.error('Error in delivery completion notification:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
  }
});

// Notify driver (mock push notification)
router.post('/driver/assignment', auth(['admin']), async (req, res) => {
  try {
    const { orderId, driverId } = req.body;
    if (!orderId || !driverId) {
      return res.status(400).json({ error: 'Order ID and driver ID required' });
    }

    // Mock Firebase Cloud Messaging
    console.log(`[Mock Push] Order ${orderId} assigned to driver ${driverId}`);

    res.json({ message: 'Driver notified (mocked)' });
  } catch (error) {
    console.error('Error in driver assignment notification:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Frontend API: Send order confirmation notification
router.post('/frontend/order-confirmation', auth(['admin', 'customer']), async (req, res) => {
  try {
    console.log('Received frontend order confirmation notification request:', JSON.stringify(req.body));
    console.log('Auth user:', req.user);
    
    const { orderId, customerEmail, orderDetails } = req.body;
    if (!orderId || !customerEmail) {
      console.error('Missing required fields:', { orderId, customerEmail });
      return res.status(400).json({ error: 'Order ID and customer email required' });
    }

    console.log(`Attempting to send confirmation email to ${customerEmail} for order ${orderId}`);
    console.log('Order details:', JSON.stringify(orderDetails));

    // Send real email notification
    const emailResult = await emailService.sendOrderConfirmationEmail(customerEmail, orderId, orderDetails);
    
    console.log('Email result:', JSON.stringify(emailResult));
    
    if (!emailResult.success) {
      console.error(`Failed to send confirmation email for order ${orderId}:`, emailResult.error);
      return res.status(500).json({ error: 'Failed to send email notification', details: emailResult.error });
    }

    // Log for tracking
    console.log(`Order confirmation email sent to ${customerEmail} for order ${orderId}`);

    res.json({ message: 'Order confirmation email sent successfully', messageId: emailResult.messageId });
  } catch (error) {
    console.error('Error in frontend order confirmation notification:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
  }
});

// Frontend API: Send delivery success notification
router.post('/frontend/delivery-success', auth(['admin', 'delivery_personnel']), async (req, res) => {
  try {
    console.log('Received frontend delivery success notification request:', JSON.stringify(req.body));
    console.log('Auth user:', req.user);
    
    const { orderId, customerEmail, deliveryDetails } = req.body;
    if (!orderId || !customerEmail) {
      console.error('Missing required fields:', { orderId, customerEmail });
      return res.status(400).json({ error: 'Order ID and customer email required' });
    }

    console.log(`Attempting to send delivery success email to ${customerEmail} for order ${orderId}`);
    console.log('Delivery details:', JSON.stringify(deliveryDetails));

    // Send real email notification with isCompleted flag
    const emailResult = await emailService.sendOrderDeliveryEmail(customerEmail, orderId, {
      ...deliveryDetails,
      isCompleted: true,
      deliveryPerson: req.user.name || 'Delivery Personnel',
      completedAt: new Date().toISOString()
    });
    
    console.log('Email result:', JSON.stringify(emailResult));
    
    if (!emailResult.success) {
      console.error(`Failed to send delivery success email for order ${orderId}:`, emailResult.error);
      return res.status(500).json({ error: 'Failed to send email notification', details: emailResult.error });
    }

    // Log for tracking
    console.log(`Delivery success email sent to ${customerEmail} for order ${orderId}`);

    res.json({ message: 'Delivery success email sent successfully', messageId: emailResult.messageId });
  } catch (error) {
    console.error('Error in frontend delivery success notification:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Server error', details: error.message, stack: error.stack });
  }
});

module.exports = router;