import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaLock, 
  FaCreditCard, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaSpinner 
} from 'react-icons/fa';

// Mock Stripe payment form since we're not installing actual Stripe packages
const PaymentForm = ({ orderId, amount }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [nameOnCard, setNameOnCard] = useState('');
  
  const token = localStorage.getItem('token');

  useEffect(() => {
    // Create a mock payment intent when component mounts
    const createPaymentIntent = async () => {
      if (!orderId || !amount) return;
      
      setLoading(true);
      try {
        const response = await axios.post(
          `${process.env.REACT_APP_PAYMENT_API_URL}/api/payments/create-payment-intent`,
          {
            orderId,
            amount,
            currency: 'usd'
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.success) {
          setPaymentId(response.data.paymentId);
          
          // If payment was already completed, show success
          if (response.data.message === 'Payment already completed') {
            setSuccess(true);
          }
        } else {
          setError('Error creating payment: ' + response.data.error);
        }
      } catch (err) {
        setError('Error creating payment: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    createPaymentIntent();
  }, [orderId, amount, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!cardNumber || !expiryDate || !cvc || !nameOnCard) {
      setError('Please fill in all card details');
      return;
    }
    
    // Simple validation for card number format
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      setError('Card number must be 16 digits');
      return;
    }
    
    // Simple validation for expiry date format (MM/YY)
    if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
      setError('Expiry date must be in MM/YY format');
      return;
    }
    
    // Simple validation for CVC
    if (!/^\d{3,4}$/.test(cvc)) {
      setError('CVC must be 3 or 4 digits');
      return;
    }
    
    setProcessing(true);
    setError(null);
    
    try {
      // For testing, use specific card numbers to simulate different outcomes
      let simulatedResult;
      
      // Test card numbers for different scenarios
      const cardNumberWithoutSpaces = cardNumber.replace(/\s/g, '');
      
      if (cardNumberWithoutSpaces === '4242424242424242') {
        // Success case
        simulatedResult = 'succeeded';
      } else if (cardNumberWithoutSpaces === '4000000000000002') {
        // Declined case
        simulatedResult = 'failed';
        throw new Error('Your card was declined');
      } else if (cardNumberWithoutSpaces === '4000000000000341') {
        // 3D Secure required case
        simulatedResult = 'requires_action';
        throw new Error('This card requires additional authentication');
      } else {
        // Default success for demo purposes
        simulatedResult = 'succeeded';
      }
      
      // If payment is successful, confirm it with the payment service
      if (simulatedResult === 'succeeded') {
        // First, log what we're sending to help with debugging
        console.log('Sending payment confirmation with mockSuccess=true');
        
        const confirmResponse = await axios.post(
          `${process.env.REACT_APP_PAYMENT_API_URL}/api/payments/confirm-payment/${paymentId}`,
          {
            orderId,
            mockSuccess: true // This helps the backend identify it as a mock payment
          },
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );
        
        if (confirmResponse.data.success) {
          setSuccess(true);
          
          // Update order status to confirmed and payment status to completed
          try {
            await axios.post(
              `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}/update-status`,
              {
                status: 'confirmed',
                paymentStatus: 'completed'
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Order status and payment status updated successfully');
            
            // Call the order confirmation API to send confirmation email
            try {
              // Get order details for the confirmation email
              const orderResponse = await axios.get(
                `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              // Get user email
              const userResponse = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/me`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              
              if (orderResponse.data && userResponse.data && userResponse.data.email) {
                // Send confirmation email using notification service
                await axios.post(
                  `${process.env.REACT_APP_NOTIFICATION_API_URL}/api/notifications/frontend/order-confirmation`,
                  {
                    orderId: orderId,
                    customerEmail: userResponse.data.email,
                    orderDetails: {
                      items: orderResponse.data.items,
                      total: orderResponse.data.total,
                      restaurantName: orderResponse.data.restaurantName
                    }
                  },
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                console.log('Order confirmation email sent successfully');
              } else {
                console.error('Missing order or user data for confirmation email');
              }
            } catch (confirmError) {
              console.error('Error sending order confirmation email:', confirmError);
              // Continue even if confirmation email fails
            }
          } catch (orderUpdateError) {
            console.error('Error updating order status:', orderUpdateError);
            // Continue even if order update fails, as payment was successful
          }
          
          // Redirect to track delivery page after 2 seconds
          setTimeout(() => {
            navigate(`/track/${orderId}`);
          }, 2000);
        } else {
          throw new Error(confirmResponse.data.error || 'Payment confirmation failed');
        }
      }
    } catch (err) {
      setError('Payment failed: ' + (err.response?.data?.error || err.message));
      
      // Delete the order if payment fails
      try {
        await axios.delete(
          `${process.env.REACT_APP_ORDER_API_URL}/api/orders/customer/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Order deleted due to payment failure');
      } catch (orderError) {
        console.error('Error deleting order:', orderError);
      }
      
      // If payment fails, redirect back to place order page after a delay
      setTimeout(() => {
        // Clear the cart first to prevent issues
        localStorage.setItem('cart', JSON.stringify([]));
        
        // Redirect to home page
        navigate('/');
      }, 5000);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-5">
        <FaSpinner className="animate-spin text-3xl text-blue-500 mx-auto mb-3" />
        <p className="text-gray-600">Preparing payment...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800">Payment Details</h3>
        <div className="flex items-center text-green-600">
          <FaLock className="mr-1" />
          <span className="text-sm">Secure Payment</span>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {success ? (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-2" />
            <div>
              <p className="text-green-700 font-bold">Payment Successful!</p>
              <p className="text-green-600">Your order has been confirmed.</p>
              <p className="text-green-600 text-sm">Redirecting to order tracking...</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="card-number">
              Card Number
            </label>
            <div className="relative">
              <input
                id="card-number"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => {
                  // Format card number with spaces after every 4 digits
                  const input = e.target.value.replace(/\D/g, '');
                  const formatted = input.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
                  setCardNumber(formatted.substring(0, 19)); // Limit to 16 digits + 3 spaces
                }}
                required
              />
              <FaCreditCard className="absolute right-3 top-3 text-gray-400" />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              For testing: 4242 4242 4242 4242 (success), 4000 0000 0000 0002 (decline)
            </p>
          </div>
          
          <div className="flex mb-4 space-x-4">
            <div className="w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expiry">
                Expiry Date
              </label>
              <input
                id="expiry"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MM/YY"
                value={expiryDate}
                onChange={(e) => {
                  let input = e.target.value.replace(/\D/g, '');
                  
                  // Format as MM/YY
                  if (input.length > 2) {
                    input = input.substring(0, 2) + '/' + input.substring(2);
                  }
                  
                  setExpiryDate(input.substring(0, 5));
                }}
                required
              />
            </div>
            
            <div className="w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cvc">
                CVC
              </label>
              <input
                id="cvc"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="123"
                value={cvc}
                onChange={(e) => {
                  const input = e.target.value.replace(/\D/g, '');
                  setCvc(input.substring(0, 4));
                }}
                required
              />
            </div>
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
              Name on Card
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Smith"
              value={nameOnCard}
              onChange={(e) => setNameOnCard(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-2">
            <button
              type="submit"
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                processing ? 'opacity-75 cursor-not-allowed' : ''
              }`}
              disabled={processing}
            >
              {processing ? (
                <span className="flex items-center justify-center">
                  <FaSpinner className="animate-spin mr-2" />
                  Processing...
                </span>
              ) : (
                `Pay $${amount.toFixed(2)}`
              )}
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-4">
            Your payment information is encrypted and secure. We do not store your card details.
          </p>
        </form>
      )}
    </div>
  );
};

export default PaymentForm;
