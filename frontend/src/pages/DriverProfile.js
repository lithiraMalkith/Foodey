import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaMapMarkerAlt, FaCheckCircle, FaTimes, FaTruck, FaExclamationTriangle, FaUserAlt, FaIdCard, FaLocationArrow, FaEdit, FaBox, FaShippingFast, FaClipboardCheck } from 'react-icons/fa';

const DriverProfile = () => {
  const [profile, setProfile] = useState(null);
  const [status, setStatus] = useState('offline');
  const [city, setCity] = useState('');
  const [area, setArea] = useState('');
  const [activeDeliveries, setActiveDeliveries] = useState(0);
  const [maxConcurrentDeliveries, setMaxConcurrentDeliveries] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_DELIVERY_API_URL}/api/drivers/profile`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setProfile(response.data);
        setStatus(response.data.status);
        setCity(response.data.currentLocation.city || '');
        setArea(response.data.currentLocation.area || '');
        setActiveDeliveries(response.data.activeDeliveries || 0);
        setMaxConcurrentDeliveries(response.data.maxConcurrentDeliveries || 1);
        setLoading(false);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // No profile yet
          setLoading(false);
        } else {
          setError('Error loading profile');
          setLoading(false);
        }
      }
    };
    
    fetchProfile();
  }, [token]);
  
  const updateStatus = async () => {
    try {
      if (!city) {
        setError('City is required');
        return;
      }
      
      const response = await axios.put(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/drivers/status`,
        {
          status,
          city,
          area,
          activeDeliveries,
          maxConcurrentDeliveries
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProfile(response.data);
      setSuccessMessage('Status updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Error updating status');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  const registerDriver = async (e) => {
    e.preventDefault();
    
    try {
      if (!city) {
        setError('City is required');
        return;
      }
      
      const response = await axios.post(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/drivers/register`,
        {
          name: e.target.name.value,
          city,
          area
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setProfile(response.data);
      setSuccessMessage('Driver profile created successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setError('Error creating driver profile');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  if (loading) {
    return (
      <div className="container mx-auto flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaUserAlt className="text-blue-600 mr-3" />
        Driver Profile
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      
      {!profile ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 max-w-2xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
            <h3 className="font-bold text-xl flex items-center">
              <FaIdCard className="mr-2" /> Register as a Driver
            </h3>
          </div>
          
          <div className="p-6">
            <form onSubmit={registerDriver} className="space-y-4">
              <div className="mb-4">
                <label htmlFor="name" className="block text-gray-700 font-medium mb-2">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    placeholder="Your Name"
                    required
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="city" className="block text-gray-700 font-medium mb-2">City</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Your City"
                    required
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="area" className="block text-gray-700 font-medium mb-2">Area/Neighborhood (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLocationArrow className="text-gray-400" />
                  </div>
                  <input
                    id="area"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Your Area"
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
              >
                <FaIdCard className="mr-2" />
                Register as Driver
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-full">
                <FaUserAlt className="text-2xl" />
              </div>
              <div>
                <h3 className="font-bold text-xl">{profile.name}</h3>
                <p className="text-blue-100 text-sm">Driver ID: {profile.userId.substring(0, 8)}...</p>
              </div>
              <div className="ml-auto flex items-center">
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
                  profile.status === 'available' ? 'bg-green-500' : 
                  profile.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
                  {profile.status === 'available' ? 'Available' : 
                   profile.status === 'busy' ? 'Busy' : 'Offline'}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <FaMapMarkerAlt className="text-blue-500 mr-2" /> Current Location
                </h4>
                <div className="text-gray-700">
                  <p className="font-medium">
                    {profile.currentLocation.city}
                    {profile.currentLocation.area && `, ${profile.currentLocation.area}`}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date(profile.currentLocation.lastUpdated).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center">
                  <FaTruck className="text-purple-500 mr-2" /> Delivery Stats
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-md shadow-sm text-center">
                    <p className="text-2xl font-bold text-blue-600">{profile.activeDeliveries}</p>
                    <p className="text-gray-500 text-sm">Active Deliveries</p>
                  </div>
                  <div className="bg-white p-3 rounded-md shadow-sm text-center">
                    <p className="text-2xl font-bold text-purple-600">{profile.maxConcurrentDeliveries}</p>
                    <p className="text-gray-500 text-sm">Max Concurrent</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
              <h4 className="font-medium text-gray-800 mb-4 flex items-center">
                <FaEdit className="text-gray-700 mr-2" /> Update Status
              </h4>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="status" className="block text-gray-700 font-medium mb-2">Status</label>
                  <select
                    id="status"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    <option value="available">Available</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="update-city" className="block text-gray-700 font-medium mb-2">City</label>
                  <input
                    id="update-city"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="update-area" className="block text-gray-700 font-medium mb-2">Area (Optional)</label>
                  <input
                    id="update-area"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="text"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                  />
                </div>
                
                <div>
                  <label htmlFor="active-deliveries" className="block text-gray-700 font-medium mb-2">Active Deliveries</label>
                  <input
                    id="active-deliveries"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="number"
                    min="0"
                    max="10"
                    value={activeDeliveries}
                    onChange={(e) => setActiveDeliveries(parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <label htmlFor="max-concurrent" className="block text-gray-700 font-medium mb-2">Max Concurrent Deliveries</label>
                  <input
                    id="max-concurrent"
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    type="number"
                    min="1"
                    max="10"
                    value={maxConcurrentDeliveries}
                    onChange={(e) => setMaxConcurrentDeliveries(parseInt(e.target.value))}
                  />
                </div>
              </div>
              
              <button
                onClick={updateStatus}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center transition-colors duration-200"
              >
                <FaEdit className="mr-2" />
                Update Status
              </button>
            </div>
            
            <button
              onClick={() => navigate('/delivery-personnel')}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-md"
            >
              <FaTruck className="mr-2" />
              View My Deliveries
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfile;
