import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTruck, FaBoxOpen, FaMapMarkerAlt, FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const DeliveryAssignment = () => {
  const [orders, setOrders] = useState([]);
  const [deliveryPersonnel, setDeliveryPersonnel] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch orders that need delivery
      const ordersRes = await axios.get(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders/pending-delivery`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Fetch available delivery personnel
      const personnelRes = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/delivery-personnel`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Fetch all current deliveries
      const deliveriesRes = await axios.get(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setOrders(ordersRes.data);
      setDeliveryPersonnel(personnelRes.data);
      setDeliveries(deliveriesRes.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
      setLoading(false);
    }
  };

  const handleAssignDelivery = async (orderId, driverId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/assign`,
        { orderId, driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove the assigned order from the local state immediately
      setOrders(orders.filter(order => order._id !== orderId));
      
      setSuccessMessage('Delivery assigned successfully!');
      // Refresh all data to get updated deliveries
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign delivery');
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Delivery Assignment only For Longdue Orders</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md shadow-sm flex items-center">
          <FaCheckCircle className="text-green-500 mr-3" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      
      <div className="mb-8">
        <div className="flex items-center mb-4 border-b pb-3">
          <FaBoxOpen className="text-blue-600 text-xl mr-2" />
          <h3 className="text-xl font-bold text-gray-800">Assign Deliveries</h3>
        </div>
        
        {orders.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-3" />
            <p className="text-gray-600">No orders pending delivery</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Order #{order._id.substring(order._id.length - 6)}</h4>
                    <span className="bg-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      ${order.total.toFixed(2)}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-start mb-3">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <FaBoxOpen className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Items from</p>
                        <p className="font-medium text-gray-800">{order.restaurantName}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start mb-3">
                      <div className="bg-green-100 p-2 rounded-full mr-3">
                        <FaMapMarkerAlt className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Delivery Address</p>
                        <p className="font-medium text-gray-800">{order.deliveryAddress}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign to:</label>
                    <select
                      className="w-full p-3 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      onChange={(e) => handleAssignDelivery(order._id, e.target.value)}
                      defaultValue=""
                    >
                      <option value="" disabled>Select Delivery Personnel</option>
                      {deliveryPersonnel.map((person) => (
                        <option key={person._id} value={person._id}>
                          {person.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div>
        <div className="flex items-center mb-4 border-b pb-3">
          <FaTruck className="text-green-600 text-xl mr-2" />
          <h3 className="text-xl font-bold text-gray-800">Active Deliveries</h3>
        </div>
        
        {deliveries.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center">
            <FaTruck className="text-gray-400 text-4xl mx-auto mb-3 opacity-50" />
            <p className="text-gray-600">No active deliveries</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {deliveries.map((delivery) => (
              <div key={delivery._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-4 py-3 text-white">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <FaTruck className="mr-2" />
                      <h4 className="font-medium">Delivery #{delivery._id.substring(delivery._id.length - 6)}</h4>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${delivery.status === 'delivered' ? 'bg-green-700' : delivery.status === 'picked_up' ? 'bg-blue-700' : 'bg-yellow-700'}`}>
                      {delivery.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="p-4">
                  {/* Item Details Section */}
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                      <FaBoxOpen className="mr-2 text-blue-500" /> Order Items
                    </h5>
                    <div className="bg-gray-50 p-3 rounded-md">
                      {delivery.items ? (
                        <ul className="divide-y divide-gray-200">
                          {delivery.items.map((item, index) => (
                            <li key={index} className="py-2 flex justify-between">
                              <span>{item.name} × {item.quantity}</span>
                              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm italic">Item details not available</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Delivery Address Section */}
                  {delivery.deliveryAddress && (
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                        <FaMapMarkerAlt className="mr-2 text-red-500" /> Delivery Address
                      </h5>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-gray-700">{delivery.deliveryAddress}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Status and Location */}
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-4 pt-3 border-t border-gray-100">
                    <div>
                      <span className="font-medium">Current Location:</span> {delivery.location || 'Unknown'}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">{new Date(delivery.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryAssignment;
