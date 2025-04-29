const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
  stripe,
  
  // Create a payment intent
  createPaymentIntent: async (amount, currency = 'usd', metadata = {}) => {
    try {
      console.log(`Creating payment intent for amount: ${amount} ${currency}`);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe expects amount in cents
        currency,
        metadata,
        payment_method_types: ['card'],
      });
      
      console.log(`Payment intent created with ID: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },
  
  // Confirm a payment intent
  confirmPaymentIntent: async (paymentIntentId, paymentMethodId) => {
    try {
      console.log(`Confirming payment intent: ${paymentIntentId} with payment method: ${paymentMethodId}`);
      
      const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
      
      console.log(`Payment intent confirmed with status: ${paymentIntent.status}`);
      return paymentIntent;
    } catch (error) {
      console.error('Error confirming payment intent:', error);
      throw error;
    }
  },
  
  // Retrieve a payment intent
  retrievePaymentIntent: async (paymentIntentId) => {
    try {
      console.log(`Retrieving payment intent: ${paymentIntentId}`);
      
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      console.log(`Retrieved payment intent with status: ${paymentIntent.status}`);
      return paymentIntent;
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      throw error;
    }
  },
  
  // Create a refund
  createRefund: async (paymentIntentId, amount = null) => {
    try {
      console.log(`Creating refund for payment intent: ${paymentIntentId}`);
      
      const refundParams = {
        payment_intent: paymentIntentId,
      };
      
      // If amount is specified, add it to the refund parameters
      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }
      
      const refund = await stripe.refunds.create(refundParams);
      
      console.log(`Refund created with ID: ${refund.id}`);
      return refund;
    } catch (error) {
      console.error('Error creating refund:', error);
      throw error;
    }
  }
};
