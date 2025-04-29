const express = require('express');
const router = express.Router();
const axios = require('axios');
const Payment = require('../models/payment');
const auth = require('../middleware/auth');
const { 
  createPaymentIntent, 
  confirmPaymentIntent, 
  retrievePaymentIntent,
  createRefund
} = require('../utils/stripeConfig');

// Create payment intent for an order
router.post('/create-payment-intent', auth(['customer']), async (req, res) => {
  try {
    const { orderId, amount, currency = 'usd' } = req.body;
    
    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Order ID and amount are required' });
    }
    
    console.log(`Creating payment intent for order: ${orderId}, amount: ${amount}`);
    
    // Check if a payment intent already exists for this order
    let payment = await Payment.findOne({ orderId });
    
    if (payment && payment.status !== 'failed') {
      console.log(`Payment already exists for order ${orderId} with status: ${payment.status}`);
      
      // If payment is already completed, return success
      if (payment.status === 'completed') {
        return res.json({
          success: true,
          message: 'Payment already completed',
          clientSecret: payment.stripeClientSecret,
          paymentId: payment._id
        });
      }
      
      // If payment is pending or processing, return the existing client secret
      return res.json({
        success: true,
        message: 'Payment intent already exists',
        clientSecret: payment.stripeClientSecret,
        paymentId: payment._id
      });
    }
    
    // Create a payment intent with Stripe
    const paymentIntent = await createPaymentIntent(
      amount,
      currency,
      { orderId, userId: req.user.userId }
    );
    
    // Create or update payment record
    if (payment) {
      // Update existing payment
      payment.amount = amount;
      payment.currency = currency;
      payment.status = 'processing';
      payment.stripePaymentIntentId = paymentIntent.id;
      payment.stripeClientSecret = paymentIntent.client_secret;
    } else {
      // Create new payment
      payment = new Payment({
        orderId,
        userId: req.user.userId,
        amount,
        currency,
        status: 'processing',
        stripePaymentIntentId: paymentIntent.id,
        stripeClientSecret: paymentIntent.client_secret,
        metadata: { orderId }
      });
    }
    
    await payment.save();
    
    console.log(`Payment record created/updated with ID: ${payment._id}`);
    
    // Return client secret to frontend
    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      error: 'Payment processing error', 
      details: error.message 
    });
  }
});

// Confirm payment success
router.post('/confirm-payment/:paymentId', auth(['customer']), async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`Confirming payment: ${paymentId}`);
    console.log('Request body:', req.body); // Log the entire request body
    
    // For testing purposes, we'll auto-approve all payments
    // In a real implementation, we would check the payment status with Stripe
    console.log(`Auto-approving payment for testing: ${paymentId}`);
    
    // Find the payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check if user owns this payment
    if (payment.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // If payment is already completed, return success
    if (payment.status === 'completed') {
      return res.json({
        success: true,
        message: 'Payment already confirmed',
        payment: {
          id: payment._id,
          status: payment.status,
          orderId: payment.orderId
        }
      });
    }
    
    // Update payment status to completed
    payment.status = 'completed';
    await payment.save();
    
    console.log(`Payment ${paymentId} auto-approved successfully`);
    
    // Notify order service about successful payment
    try {
      const token = `Bearer ${process.env.JWT_SECRET}`;
      await axios.post(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/payment-completed`,
        { paymentId: payment._id.toString() },
        { headers: { Authorization: token } }
      );
      
      console.log(`Order service notified about payment for order: ${payment.orderId}`);
    } catch (notifyError) {
      console.error('Error notifying order service about payment:', notifyError);
      // Continue with the response even if notification fails
    }
    
    return res.json({ 
      success: true, 
      message: 'Payment confirmed successfully (auto-approved)',
      payment: {
        id: payment._id,
        status: payment.status,
        orderId: payment.orderId
      }
    });
  } catch (error) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      error: 'Payment confirmation error', 
      details: error.message 
    });
  }
});

// Get payment status
router.get('/status/:paymentId', auth(['customer', 'admin']), async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`Getting payment status for: ${paymentId}`);
    
    // Find the payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check if user owns this payment or is admin
    if (req.user.role !== 'admin' && payment.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Return payment status
    res.json({
      success: true,
      payment: {
        id: payment._id,
        orderId: payment.orderId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        createdAt: payment.createdAt
      }
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ 
      error: 'Error retrieving payment status', 
      details: error.message 
    });
  }
});

// Get payments for an order
router.get('/order/:orderId', auth(['customer', 'admin']), async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`Getting payments for order: ${orderId}`);
    
    // Find payments for the order
    const payments = await Payment.find({ orderId });
    
    // If user is not admin, check if they own the payments
    if (req.user.role !== 'admin') {
      const userPayments = payments.filter(payment => payment.userId === req.user.userId);
      
      if (userPayments.length === 0) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      return res.json({
        success: true,
        payments: userPayments
      });
    }
    
    // Return all payments for admin
    res.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error getting payments for order:', error);
    res.status(500).json({ 
      error: 'Error retrieving payments', 
      details: error.message 
    });
  }
});

// Get all payments (Admin only)
router.get('/', auth(['admin']), async (req, res) => {
  try {
    console.log('Getting all payments (admin)');
    
    // Get query parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Find payments with pagination
    const payments = await Payment.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Count total payments for pagination
    const total = await Payment.countDocuments();
    
    res.json({
      success: true,
      payments,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting all payments:', error);
    res.status(500).json({ 
      error: 'Error retrieving payments', 
      details: error.message 
    });
  }
});

// Process refund (Admin only)
router.post('/refund/:paymentId', auth(['admin']), async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount } = req.body; // Optional partial refund amount
    
    console.log(`Processing refund for payment: ${paymentId}`);
    
    // Find the payment
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Check if payment is completed
    if (payment.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Cannot refund payment', 
        message: `Payment is in ${payment.status} status` 
      });
    }
    
    // Process refund with Stripe
    const refund = await createRefund(
      payment.stripePaymentIntentId,
      amount // Pass amount if partial refund
    );
    
    // Update payment status
    payment.status = 'refunded';
    payment.metadata = {
      ...payment.metadata,
      refundId: refund.id,
      refundAmount: amount || payment.amount,
      refundDate: new Date()
    };
    await payment.save();
    
    console.log(`Refund processed for payment: ${paymentId}`);
    
    // Notify order service about refund
    try {
      const token = `Bearer ${process.env.JWT_SECRET}`;
      await axios.post(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${payment.orderId}/payment-refunded`,
        { 
          paymentId: payment._id.toString(),
          refundId: refund.id,
          amount: amount || payment.amount
        },
        { headers: { Authorization: token } }
      );
      
      console.log(`Order service notified about refund for order: ${payment.orderId}`);
    } catch (notifyError) {
      console.error('Error notifying order service about refund:', notifyError);
      // Continue with the response even if notification fails
    }
    
    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: (amount || payment.amount),
        status: refund.status
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ 
      error: 'Refund processing error', 
      details: error.message 
    });
  }
});

module.exports = router;
