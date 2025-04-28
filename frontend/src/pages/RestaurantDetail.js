import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaMapMarkerAlt, FaUtensils, FaShoppingCart, FaCheck, FaInfoCircle, FaPlus, FaExclamationTriangle, FaDollarSign } from 'react-icons/fa';

const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [cart, setCart] = useState([]);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({ show: false, message: '', item: '' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRestaurant(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch restaurant');
      }
    };
    fetchRestaurant();
    setCart(JSON.parse(localStorage.getItem('cart') || '[]'));
  }, [id]);

  const addToCart = (item) => {
    // Check if item already exists in cart
    const existingItemIndex = cart.findIndex(cartItem => cartItem._id === item._id);
    let updatedCart;
    let message;
    
    if (existingItemIndex >= 0) {
      // If item exists, increase quantity
      updatedCart = [...cart];
      updatedCart[existingItemIndex].quantity = (updatedCart[existingItemIndex].quantity || 1) + 1;
      message = 'Quantity updated in cart!';
    } else {
      // If item doesn't exist, add it with a unique cart ID
      updatedCart = [...cart, { ...item, quantity: 1, cartId: `${item._id}-${Date.now()}` }];
      message = 'Added to cart!';
    }
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    
    // Show notification
    setNotification({ show: true, message: message, item: item.name });
    
    // Hide notification after 3 seconds
    setTimeout(() => {
      setNotification({ show: false, message: '', item: '' });
    }, 3000);
  };

  const handlePlaceOrder = () => {
    navigate('/place-order', { state: { restaurantId: id, menuItems: restaurant.menuItems } });
  };

  if (!restaurant) return (
    <div className="container mx-auto flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl relative">
      {notification.show && (
        <div className="fixed top-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-lg z-50 flex items-center">
          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
          <p className="font-medium"><strong>{notification.item}</strong> {notification.message}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <h2 className="text-2xl font-bold flex items-center">
            <FaStore className="mr-3" /> {restaurant.name}
          </h2>
          {restaurant.location && (
            <p className="text-blue-100 flex items-center mt-1">
              <FaMapMarkerAlt className="mr-2" /> {restaurant.location}
            </p>
          )}
        </div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row mb-6">
            {restaurant.picture ? (
              <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6">
                <img 
                  src={restaurant.picture} 
                  alt={restaurant.name} 
                  className="w-full h-64 object-cover rounded-lg shadow-md"
                />
              </div>
            ) : (
              <div className="md:w-1/3 mb-4 md:mb-0 md:mr-6 h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                <FaStore className="text-gray-400 text-5xl" />
              </div>
            )}
            
            <div className="md:w-2/3">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-4">
                <h3 className="font-medium text-gray-800 mb-2 flex items-center">
                  <FaInfoCircle className="text-blue-500 mr-2" /> About this Restaurant
                </h3>
                <p className="text-gray-700">{restaurant.description || 'No description available.'}</p>
              </div>
              
              {cart.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium text-gray-800 flex items-center">
                        <FaShoppingCart className="text-green-500 mr-2" /> Your Cart
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{cart.length} item(s) in cart</p>
                    </div>
                    <button
                      onClick={handlePlaceOrder}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 px-4 rounded-md flex items-center transition-colors duration-200 shadow-md"
                    >
                      <FaShoppingCart className="mr-2" />
                      Proceed to Order
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4 text-white">
          <h3 className="text-xl font-bold flex items-center">
            <FaUtensils className="mr-3" /> Menu Items
          </h3>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurant.menuItems.map((item) => (
              <div key={item._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                {item.picture ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={item.picture} 
                      alt={item.name} 
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gray-100 flex items-center justify-center">
                    <FaUtensils className="text-gray-400 text-4xl" />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-800 text-lg">{item.name}</h4>
                    <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                      <FaDollarSign className="mr-1" />
                      {item.price}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 h-12 overflow-hidden">{item.description || 'No description available'}</p>
                  
                  <button
                    onClick={() => addToCart(item)}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm"
                  >
                    <FaPlus className="mr-2" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;