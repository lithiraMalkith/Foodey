import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaShoppingCart, FaCheck, FaExclamationTriangle, FaTrash, FaArrowLeft, FaStore, FaClock, FaMoneyBillWave } from 'react-icons/fa';

const PlaceOrder = () => {
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showConfirmation, setShowConfirmation] = useState(false);
  // Use a ref instead of state for tracking submission to avoid race conditions
  const orderSubmittedRef = useRef(false);
  const countdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  // Provide fallback values for restaurantId to prevent undefined errors
  const { restaurantId = '', menuItems = [] } = location.state || {};

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(storedCart);
  }, []);

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
      
      // Place the order
      const res = await axios.post(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders`,
        {
          restaurantId,
          items: cart,
          total,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Show success message
      setSuccess('Order placed successfully! We will send a confirmation shortly.');
      
      // Clear cart
      localStorage.removeItem('cart');
      setCart([]);
      
      // No need to send notification here - notifications will be sent when admin confirms the order
      console.log('Order placed successfully, awaiting admin confirmation');
      
      // Try to assign driver
      try {
        await axios.post(
          `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/assign`,
          {
            orderId: res.data._id,
            driverId: 'mock_driver_1',
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (deliveryError) {
        console.log('Delivery service unavailable, but order was placed successfully');
      }
      
      // Redirect after 2 seconds to show the success message
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
      
    } catch (err) {
      setError(err.response?.data?.error || 'Order placement failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setError('Your cart is empty. Please add items before placing an order.');
      return;
    }
    
    setError('');
    setSuccess('');
    
    // Start the countdown without making an API call yet
    startCountdown();
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaShoppingCart className="text-blue-600 mr-3" />
        Place Order
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}
      
      {/* Confirmation modal with countdown timer */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FaClock className="text-blue-600 mr-2" /> Confirm Your Order
            </h3>
            <div className="bg-blue-50 p-4 rounded-md mb-4 text-center">
              <p className="text-gray-700">Your order will be placed in</p>
              <p className="font-bold text-3xl text-blue-600 my-2">{countdown}</p>
              <p className="text-gray-700">seconds</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-md mb-6 flex justify-between items-center">
              <div className="flex items-center">
                <FaMoneyBillWave className="text-green-600 mr-2" />
                <span className="text-gray-700">Total:</span>
              </div>
              <span className="text-xl font-bold text-green-600">${total.toFixed(2)}</span>
            </div>
            
            <div className="flex space-x-4">
              <button 
                onClick={handleCancel}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={() => placeOrderInApi('button-click')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-md"
              >
                Place Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {cart.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center border border-gray-200">
          <FaShoppingCart className="text-gray-400 text-5xl mx-auto mb-4 opacity-50" />
          <p className="text-gray-500 font-medium mb-6">Your cart is empty</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center mx-auto transition-all duration-200 shadow-md"
          >
            <FaStore className="mr-2" /> Browse Restaurants
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
            <h3 className="font-bold text-xl flex items-center">
              <FaShoppingCart className="mr-2" /> Your Cart Items
            </h3>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {cart.map(item => (
                <div key={item.cartId || `${item._id}-${Math.random()}`} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-3">
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
                    <FaShoppingCart className="mr-2" />
                    {isSubmitting ? 'Processing...' : 'Place Order'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlaceOrder;