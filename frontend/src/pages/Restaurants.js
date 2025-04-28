import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaStore, FaMapMarkerAlt, FaUtensils, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';

const Restaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRestaurants(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch restaurants');
      }
    };
    fetchRestaurants();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaStore className="text-blue-600 mr-3" />
        Restaurants
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {restaurants.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
          <FaStore className="text-gray-400 text-4xl mx-auto mb-3 opacity-50" />
          <p className="text-gray-500 font-medium">No restaurants available at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant) => (
            <div key={restaurant._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
              {restaurant.picture ? (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={restaurant.picture} 
                    alt={restaurant.name} 
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-48 bg-gray-200 flex items-center justify-center">
                  <FaUtensils className="text-gray-400 text-4xl" />
                </div>
              )}
              
              <div className="p-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{restaurant.name}</h3>
                
                {restaurant.location && (
                  <p className="text-gray-600 mb-2 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-gray-500" /> 
                    {restaurant.location}
                  </p>
                )}
                
                {restaurant.description && (
                  <p className="text-gray-700 mb-4 line-clamp-2">{restaurant.description}</p>
                )}
                
                <Link 
                  to={`/restaurants/${restaurant._id}`} 
                  className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md transition-all duration-200 shadow-md"
                >
                  View Menu <FaArrowRight className="ml-2" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Restaurants;