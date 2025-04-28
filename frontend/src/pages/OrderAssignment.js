import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMotorcycle, FaMapMarkerAlt, FaUserAlt, FaSearch, FaCheckCircle, FaTimes, FaSyncAlt, FaFilter, FaBoxOpen, FaExclamationTriangle, FaShippingFast } from 'react-icons/fa';

const OrderAssignment = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const token = localStorage.getItem('token');
  
  // Function to fetch pending orders
  const fetchPendingOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders/pending-delivery`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPendingOrders(response.data);
      
      // Extract unique cities from orders (from both structured and string addresses)
      const cities = [...new Set(response.data.map(order => {
        // First try to get city from structured address
        if (order.structuredAddress && order.structuredAddress.city) {
          return order.structuredAddress.city;
        }
        // Fall back to extracting from string address
        return order.deliveryAddress ? extractCity(order.deliveryAddress) : '';
      }).filter(city => city))];
      
      console.log('Available cities:', cities);
      
      if (cities.length > 0 && !selectedCity) {
        setSelectedCity(cities[0]);
      }
      
      // Auto-assign orders if there are any pending
      if (response.data.length > 0) {
        autoAssignAllOrders(response.data);
      }
      
      setLoading(false);
    } catch (error) {
      setError('Error loading pending orders');
      setLoading(false);
    }
  };
  
  // Refresh all data (orders and drivers)
  const refreshAllData = async () => {
    setSuccessMessage('Refreshing data...');
    await fetchPendingOrders();
    await refreshAvailableDrivers();
    setSuccessMessage('Data refreshed successfully');
    setTimeout(() => setSuccessMessage(''), 3000);
  };
  
  // Load pending orders and auto-assign them
  useEffect(() => {
    fetchPendingOrders();
    
    // Set up polling to check for new orders every 30 seconds
    const interval = setInterval(fetchPendingOrders, 30000);
    return () => clearInterval(interval);
  }, [token]);
  
  // Load available drivers when city changes
  useEffect(() => {
    if (!selectedCity) return;
    
    const fetchAvailableDrivers = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_DELIVERY_API_URL}/api/drivers/available?city=${selectedCity}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setAvailableDrivers(response.data);
      } catch (error) {
        console.error('Error loading available drivers:', error);
      }
    };
    
    fetchAvailableDrivers();
  }, [selectedCity, token]);
  
  // Auto-assign a delivery
  const autoAssignDelivery = async (orderId, orderAddress, restaurantName, restaurantId) => {
    try {
      console.log('Auto-assigning delivery:', { orderId, orderAddress, restaurantName, restaurantId });
      const response = await axios.post(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/auto-assign`,
        { 
          orderId, 
          orderAddress, 
          restaurantName, 
          restaurantId 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Handle both success and already assigned cases
      if (response.data.success) {
        // Remove the assigned order from the list
        setPendingOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        
        // Refresh the available drivers list
        await refreshAvailableDrivers();
        
        // Check if this was already assigned
        if (response.data.alreadyAssigned) {
          setSuccessMessage(`Order ${orderId} was already assigned for delivery`);
        } else {
          setSuccessMessage(`Order ${orderId} assigned successfully`);
        }
        
        setTimeout(() => setSuccessMessage(''), 3000);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auto-assign error:', error.response?.data || error.message);
      
      // If the error is that the delivery is already assigned, handle it as a success
      if (error.response?.data?.error === 'Delivery already assigned') {
        setPendingOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
        setSuccessMessage(`Order ${orderId} was already assigned for delivery`);
        setTimeout(() => setSuccessMessage(''), 3000);
        return true;
      }
      
      setError(error.response?.data?.error || 'Error auto-assigning delivery');
      setTimeout(() => setError(null), 3000);
      return false;
    }
  };
  
  // Auto-assign all pending orders
  const autoAssignAllOrders = async (orders) => {
    if (!orders || orders.length === 0) return;
    
    console.log('Auto-assigning all pending orders...');
    let assignedCount = 0;
    
    // First, filter out orders that already have a delivery assigned
    const unassignedOrders = await filterUnassignedOrders(orders);
    
    if (unassignedOrders.length === 0) {
      console.log('No unassigned orders found');
      return;
    }
    
    // Try to assign each unassigned order
    for (const order of unassignedOrders) {
      if (order.deliveryAddress) {
        // Pass restaurant information along with order ID and address
        const success = await autoAssignDelivery(
          order._id, 
          order.deliveryAddress,
          order.restaurantName || '', // Pass restaurant name if available
          order.restaurantId || ''    // Pass restaurant ID if available
        );
        if (success) assignedCount++;
        // Add a small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Final refresh of available drivers after all assignments
    await refreshAvailableDrivers();
    
    if (assignedCount > 0) {
      setSuccessMessage(`Auto-assigned ${assignedCount} orders`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };
  
  // Filter orders to only include those without assigned deliveries
  const filterUnassignedOrders = async (orders) => {
    try {
      // Get all existing deliveries
      const deliveriesResponse = await axios.get(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const assignedOrderIds = deliveriesResponse.data.map(delivery => delivery.orderId);
      
      // Filter out orders that already have deliveries assigned
      return orders.filter(order => !assignedOrderIds.includes(order._id));
    } catch (error) {
      console.error('Error filtering unassigned orders:', error);
      return orders; // Return all orders if we can't filter
    }
  };
  
  // Manually assign a delivery
  const manuallyAssignDelivery = async (orderId, driverId, orderAddress) => {
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/assign`,
        { orderId, driverId, deliveryAddress: orderAddress },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data) {
        setSuccessMessage('Order manually assigned successfully');
        
        // Remove the assigned order from the list
        setPendingOrders(pendingOrders.filter(order => order._id !== orderId));
        
        // Refresh the available drivers list
        refreshAvailableDrivers();
        
        setTimeout(() => setSuccessMessage(''), 3000);
      }
    } catch (error) {
      setError(error.response?.data?.error || 'Error manually assigning delivery');
      setTimeout(() => setError(null), 3000);
    }
  };
  
  // Function to refresh available drivers
  const refreshAvailableDrivers = async () => {
    if (!selectedCity) return;
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/drivers/available?city=${selectedCity}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAvailableDrivers(response.data);
    } catch (error) {
      console.error('Error refreshing available drivers:', error);
    }
  };
  
  // Extract city from address
  const extractCity = (address) => {
    if (!address) return '';
    
    // If address is an object with a city property, use it directly
    if (typeof address === 'object' && address.city) {
      return address.city;
    }
    
    // Otherwise, handle string address
    if (typeof address === 'string') {
      // Split the address by commas
      const parts = address.split(',');
      
      // Address format should be: street, city, state, zipCode
      if (parts.length >= 3) {
        // If we have at least 3 parts, city is likely the second part
        return parts[1].trim();
      } else if (parts.length > 0) {
        // Fallback to the last part if we don't have enough parts
        return parts[parts.length - 1].trim();
      }
    }
    
    return '';
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-b-4 border-blue-500 animate-spin"></div>
          <div className="absolute top-0 left-0 h-24 w-24 flex items-center justify-center">
            <FaShippingFast className="text-blue-500 text-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Order Assignment</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h3 className="font-medium text-gray-700 flex items-center">
            <FaFilter className="text-blue-500 mr-2" /> 
            Filter & Actions
          </h3>
          
          <div className="flex flex-wrap gap-2 mt-2 md:mt-0">
            <button
              onClick={refreshAllData}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
              disabled={loading}
            >
              <FaSyncAlt className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            
            <button
              onClick={() => autoAssignAllOrders(pendingOrders)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center justify-center"
              disabled={loading}
            >
              <FaShippingFast className="mr-2" />
              Auto-Assign All
            </button>
          </div>
        </div>
        
        <div className="flex items-center">
          <label className="text-gray-600 mr-3 font-medium">Filter by City:</label>
          <div className="relative inline-block w-64">
            <select 
              value={selectedCity} 
              onChange={(e) => setSelectedCity(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2 pl-3 pr-10 text-sm"
            >
              <option value="">All Cities</option>
              {[...new Set(pendingOrders.map(order => {
                if (order.structuredAddress && order.structuredAddress.city) {
                  return order.structuredAddress.city;
                }
                return extractCity(order.deliveryAddress);
              }).filter(city => city))].map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <FaFilter className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center">
              <FaBoxOpen className="mr-2" /> Unassigned Orders ({pendingOrders.length})
            </h3>
            <span className="bg-blue-800 text-xs px-3 py-1 rounded-full flex items-center">
              <FaSyncAlt className="mr-1 animate-spin" /> Auto-assigning every 30 seconds
            </span>
          </div>
        </div>
        
        {pendingOrders.length === 0 ? (
          <div className="p-8 text-center">
            <FaExclamationTriangle className="text-yellow-400 text-4xl mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No pending orders to assign</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery Address</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pendingOrders
                  .filter(order => {
                    // Get city from structured address or extract from string address
                    const orderCity = order.structuredAddress?.city || extractCity(order.deliveryAddress);
                    return !selectedCity || orderCity === selectedCity;
                  })
                  .map(order => {
                    // Get city from structured address or extract from string address
                    const city = order.structuredAddress?.city || extractCity(order.deliveryAddress);
                    
                    return (
                      <tr key={order._id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                            {order._id.substring(0, 8)}...
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <div className="flex items-center">
                            <FaUserAlt className="text-gray-400 mr-2" />
                            {order.customerName || 'Customer'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700">
                          <div className="flex items-start">
                            <FaMapMarkerAlt className="text-red-500 mt-1 mr-2 flex-shrink-0" />
                            <span>{order.deliveryAddress}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            {city || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select 
                            onChange={(e) => {
                              if (e.target.value) {
                                manuallyAssignDelivery(order._id, e.target.value, order.deliveryAddress);
                              }
                            }}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2 px-3 text-sm"
                          >
                            <option value="">Manually Assign Driver</option>
                            {availableDrivers.map(driver => (
                              <option key={driver.userId} value={driver.userId}>
                                {driver.name} ({driver.activeDeliveries} active)
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderAssignment;
