import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaCheck, FaExclamationTriangle, FaTrash, FaArrowLeft, FaStore, FaClock, FaMoneyBillWave, FaCreditCard, FaMoneyBill } from 'react-icons/fa';

const PlaceOrder = () => {
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(localStorage.getItem('paymentMethod') || 'card');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState('');
  const [structuredAddress, setStructuredAddress] = useState({});
  // Use a ref instead of state for tracking submission to avoid race conditions
  const orderSubmittedRef = useRef(false);
  const countdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Provide fallback values for restaurantId to prevent undefined errors
  const { restaurantId = '', menuItems = [], restaurantName = '' } = location.state || {};

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(storedCart);
  }, []);

  // Fetch user's default address
  useEffect(() => {
    const fetchUserAddress = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      try {
        setAddressLoading(true);
        // Get user ID from token
        const userId = JSON.parse(atob(token.split('.')[1])).userId;
        
        const response = await axios.get(
          `${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}/address`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (response.data.defaultAddress) {
          const address = response.data.defaultAddress;
          // Format the address for display
          const formattedAddress = [
            address.street,
            address.city,
            address.state,
            address.zipCode
          ].filter(Boolean).join(', ');
          
          setDeliveryAddress(formattedAddress);
          setStructuredAddress({
            street: address.street || '',
            city: address.city || '',
            state: address.state || '',
            zipCode: address.zipCode || ''
          });
        }
      } catch (error) {
        console.error('Error fetching user address:', error);
        setAddressError('Could not load your saved address. Please enter it manually.');
      } finally {
        setAddressLoading(false);
      }
    };
    
    fetchUserAddress();
  }, []);

  // Save payment method to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('paymentMethod', paymentMethod);
  }, [paymentMethod]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleQuantityChange = (itemId, cartId, quantity) => {
    const updatedCart = cart.map(item => {
      // Use cartId for comparison if available, otherwise fall back to _id
      if ((cartId && item.cartId === cartId) || (!cartId && item._id === itemId)) {
        return { ...item, quantity: parseInt(quantity) || 1 };
      }
      return item;
    });
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
  };

  const handleCancel = () => {
    // Clear the countdown timer
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    
    // Reset UI state to return to order form
    setCountdown(0);
    setShowConfirmation(false);
    setIsSubmitting(false);
    orderSubmittedRef.current = false; // Reset the order submitted flag using ref
  };

  const startCountdown = () => {
    setCountdown(10);
    setShowConfirmation(true);
    orderSubmittedRef.current = false; // Reset the order submitted flag using ref
    
    // Clear any existing interval
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    
    // Start a new countdown
    countdownRef.current = setInterval(() => {
      setCountdown(prevCount => {
        if (prevCount <= 1) {
          // When countdown reaches 0, clear the interval
          clearInterval(countdownRef.current);
          countdownRef.current = null;
          
          // Don't place order automatically, just reset the UI
          if (!orderSubmittedRef.current) {
            // Reset the confirmation UI
            setShowConfirmation(false);
            setError('Order confirmation timed out. Please try again.');
          }
          return 0;
        }
        return prevCount - 1;
      });
    }, 1000);
  };
  
  const placeOrderInApi = async (source = 'button') => {
    console.log(`Attempting to place order from: ${source}`);
    
    // Prevent duplicate submissions - using ref for immediate effect
    if (isSubmitting || orderSubmittedRef.current) {
      console.log('Preventing duplicate submission - order already being processed');
      return;
    }
    
    // Set the ref value immediately to prevent race conditions
    orderSubmittedRef.current = true;
    
    // Then update UI state
    setIsSubmitting(true);
    setShowConfirmation(false);
    
    try {
      const token = localStorage.getItem('token');
      
      // For cash on delivery, place the order directly
      if (paymentMethod === 'cash_on_delivery') {
        // Place the order with status "confirmed" for cash on delivery
        const res = await axios.post(
          `${process.env.REACT_APP_ORDER_API_URL}/api/orders`,
          {
            restaurantId,
            items: cart,
            total,
            paymentMethod: 'cash_on_delivery',
            status: 'confirmed',
            paymentStatus: 'pending',
            deliveryAddress,
            structuredAddress
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Call the order confirmation API to send confirmation email
        try {
          const orderId = res.data._id;
          
          // Get user email
          const userResponse = await axios.get(
            `${process.env.REACT_APP_API_BASE_URL}/api/users/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (res.data && userResponse.data && userResponse.data.email) {
            // Send confirmation email using notification service
            await axios.post(
              `${process.env.REACT_APP_NOTIFICATION_API_URL}/api/notifications/frontend/order-confirmation`,
              {
                orderId: orderId,
                customerEmail: userResponse.data.email,
                orderDetails: {
                  items: cart,
                  total: total,
                  restaurantName: restaurantName
                }
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            console.log('Order confirmation email sent successfully for cash on delivery order');
          } else {
            console.error('Missing order or user data for confirmation email');
          }
        } catch (confirmError) {
          console.error('Error sending order confirmation email:', confirmError);
          // Continue even if confirmation email fails
        }
        
        // Show success message
        setSuccess('Order placed successfully! Redirecting to orders...');
        
        // Clear cart
        localStorage.setItem('cart', JSON.stringify([]));
        
        // Redirect to orders page
        setTimeout(() => {
          navigate('/orders');
        }, 1500);
      } else {
        // For card payment, create a pending order and redirect to payment page
        const res = await axios.post(
          `${process.env.REACT_APP_ORDER_API_URL}/api/orders`,
          {
            restaurantId,
            items: cart,
            total,
            paymentMethod: 'card',
            status: 'pending',
            paymentStatus: 'pending',
            deliveryAddress,
            structuredAddress
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        
        // Show success message
        setSuccess('Order created! Redirecting to payment...');
        
        // Clear cart
        localStorage.setItem('cart', JSON.stringify([]));
        
        // Redirect to payment page
        navigate(`/payment/${res.data._id}`);
      }
      
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.error || 'Failed to place order. Please try again.');
      setIsSubmitting(false);
      orderSubmittedRef.current = false;
    }
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate cart
    if (!cart.length) {
      setError('Your cart is empty. Add items to place an order.');
      return;
    }
    
    // Validate restaurant ID
    if (!restaurantId) {
      setError('Restaurant information is missing. Please try again.');
      return;
    }
    
    // Start the confirmation countdown
    startCountdown();
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Success message */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaCheck className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded shadow-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Confirm Your Order</h3>
            <p className="text-gray-600 mb-4">Are you sure you want to place this order?</p>
            <p className="text-gray-600 mb-4">
              <span className="font-semibold">Payment Method:</span> {paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery'}
            </p>
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold text-gray-700">Total:</span>
              <span className="text-xl font-bold text-green-600">${total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition-colors duration-200"
              >
                Cancel
              </button>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => placeOrderInApi('confirmation')}
                  className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Order'}
                </button>
                {countdown > 0 && (
                  <span className="ml-3 text-sm text-gray-500">
                    <FaClock className="inline mr-1" />
                    {countdown}s
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
        <FaShoppingCart className="mr-3 text-blue-600" />
        Place Your Order
      </h1>
      
      {/* Empty cart message */}
      {cart.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <FaShoppingCart className="mx-auto text-4xl text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add items from a restaurant to place an order.</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md flex items-center transition-colors duration-200"
          >
            Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
              <FaStore className="mr-2 text-blue-600" />
              Your Order
            </h2>
            
            {/* Cart items */}
            {cart.length > 0 && (
              <form onSubmit={handleSubmit}>
                {cart.map((item, index) => (
                  <div 
                    key={item.cartId || item._id} 
                    className={`border-b border-gray-200 pb-4 mb-4 ${index === cart.length - 1 ? 'border-b-0' : ''}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-gray-800">{item.name}</h4>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        ${item.price}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <div className="flex-grow">
                        <label className="block text-sm text-gray-600 mb-1">Quantity</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item._id, item.cartId, e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="1"
                        />
                      </div>
                      <div className="text-right">
                        <label className="block text-sm text-gray-600 mb-1">Subtotal</label>
                        <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => {
                          // Filter out the item to be removed using cartId if available, otherwise use _id
                          const updatedCart = cart.filter(cartItem => 
                            item.cartId ? cartItem.cartId !== item.cartId : cartItem._id !== item._id
                          );
                          // Update state and localStorage
                          setCart(updatedCart);
                          localStorage.setItem('cart', JSON.stringify(updatedCart));
                          
                          // If cart will be empty after removal, show a message
                          if (updatedCart.length === 0) {
                            setError('Your cart is now empty. Add items from a restaurant to place an order.');
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Delivery Address */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Delivery Address</h3>
                  {addressLoading ? (
                    <div className="flex items-center text-gray-500">
                      <div className="animate-spin mr-2">
                        <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      Loading your saved address...
                    </div>
                  ) : (
                    <>
                      {addressError && (
                        <p className="text-red-500 text-sm mb-2">{addressError}</p>
                      )}
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your delivery address"
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        {deliveryAddress ? 'Your saved address is loaded. You can edit it if needed.' : 'Please enter your delivery address'}
                      </p>
                    </>
                  )}
                </div>
                
                {/* Payment Method Selection */}
                <div className="border-t border-gray-200 pt-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Payment Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod === 'card' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border ${
                          paymentMethod === 'card' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-400'
                        } flex items-center justify-center mr-3`}>
                          {paymentMethod === 'card' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex items-center">
                          <FaCreditCard className={`mr-2 ${paymentMethod === 'card' ? 'text-blue-500' : 'text-gray-500'}`} />
                          <span className="font-medium">Credit/Debit Card</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-8">Pay securely with your card</p>
                    </div>
                    
                    <div 
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        paymentMethod === 'cash_on_delivery' 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 hover:border-blue-300'
                      }`}
                      onClick={() => setPaymentMethod('cash_on_delivery')}
                    >
                      <div className="flex items-center">
                        <div className={`w-5 h-5 rounded-full border ${
                          paymentMethod === 'cash_on_delivery' 
                            ? 'border-blue-500 bg-blue-500' 
                            : 'border-gray-400'
                        } flex items-center justify-center mr-3`}>
                          {paymentMethod === 'cash_on_delivery' && <div className="w-2 h-2 bg-white rounded-full"></div>}
                        </div>
                        <div className="flex items-center">
                          <FaMoneyBill className={`mr-2 ${paymentMethod === 'cash_on_delivery' ? 'text-blue-500' : 'text-gray-500'}`} />
                          <span className="font-medium">Cash on Delivery</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2 ml-8">Pay when your order arrives</p>
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4 mt-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-lg font-bold text-gray-800">Order Total:</h4>
                    <p className="text-2xl font-bold text-green-600">${total.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex space-x-4">
                    <button 
                      type="button" 
                      onClick={() => navigate(-1)}
                      className="flex-none bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md flex items-center transition-colors duration-200"
                    >
                      <FaArrowLeft className="mr-2" /> Back
                    </button>
                    
                    <button 
                      type="submit" 
                      className={`flex-grow ${isSubmitting ? 'bg-gray-500' : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'} text-white py-3 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-md`}
                      disabled={isSubmitting}
                    >
                      {paymentMethod === 'card' ? <FaCreditCard className="mr-2" /> : <FaMoneyBill className="mr-2" />}
                      {isSubmitting ? 'Processing...' : paymentMethod === 'card' ? 'Proceed to Payment' : 'Place Order'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;