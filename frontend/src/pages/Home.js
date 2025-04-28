import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { FaUtensils, FaShippingFast, FaUserAlt, FaArrowRight, FaSearch } from 'react-icons/fa';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userName = localStorage.getItem('name');
    const userRole = localStorage.getItem('role');
    if (token) {
      setIsLoggedIn(true);
      setName(userName);
      setRole(userRole || '');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Hero Section with Background Image */}
      <div className="relative h-screen">
        <div 
          className="absolute inset-0 bg-cover" 
          style={{
            backgroundImage: `url('/grocery-store.jpg')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%', /* Adjusted to move image down */
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-purple-900/40"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 leading-tight">
              <span className="block">Fresh Food</span>
              <span className="block text-blue-300">Fast Delivery</span>
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Order fresh groceries and delicious meals from your favorite local restaurants and have them delivered to your doorstep in minutes.
            </p>
            
            {isLoggedIn ? (
              <div className="space-y-4">
                <p className="text-white text-lg">Welcome back, <span className="font-semibold">{name}</span>!</p>
                
                {role === 'customer' ? (
                  <Link 
                    to="/restaurants" 
                    className="inline-flex items-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaUtensils className="mr-2" />
                    Browse Restaurants
                    <FaArrowRight className="ml-2" />
                  </Link>
                ) : role === 'admin' ? (
                  <Link 
                    to="/admin" 
                    className="inline-flex items-center px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaUserAlt className="mr-2" />
                    Go to Admin Dashboard
                    <FaArrowRight className="ml-2" />
                  </Link>
                ) : role === 'restaurant_admin' ? (
                  <Link 
                    to="/restaurant-admin" 
                    className="inline-flex items-center px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaUtensils className="mr-2" />
                    Manage Your Restaurant
                    <FaArrowRight className="ml-2" />
                  </Link>
                ) : role === 'delivery_personnel' ? (
                  <Link 
                    to="/delivery-personnel" 
                    className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <FaShippingFast className="mr-2" />
                    View Delivery Assignments
                    <FaArrowRight className="ml-2" />
                  </Link>
                ) : (
                  <div className="text-white text-lg bg-gray-700 p-4 rounded-lg">
                    Please contact support to set up your account properly.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <Link 
                  to="/login" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <FaUserAlt className="mr-2" />
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">How Foodey Works</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-blue-50 p-6 rounded-xl shadow-md transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaSearch className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Search</h3>
              <p className="text-gray-600 text-center">Find your favorite restaurants and dishes with our powerful search.</p>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-xl shadow-md transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-500 text-white rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaUtensils className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Order</h3>
              <p className="text-gray-600 text-center">Place your order with just a few clicks and customize as needed.</p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl shadow-md transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mb-4 mx-auto">
                <FaShippingFast className="text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-center mb-2">Delivery</h3>
              <p className="text-gray-600 text-center">Track your order in real-time as it makes its way to your location.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;