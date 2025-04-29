import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaTruck, FaMapMarkerAlt, FaBox, FaCheckCircle, FaExclamationTriangle, FaShippingFast, FaClipboardCheck, FaStore, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';

const DeliveryPersonnel = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/driver`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDeliveries(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch deliveries');
      }
    };
    fetchDeliveries();
  }, []);

  const handleUpdateStatus = async (id, status, location) => {
    try {
      const token = localStorage.getItem('token');
      
      // Update the delivery status
      const res = await axios.put(
        `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/${id}/status`,
        { status, location },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the UI
      setDeliveries(deliveries.map(d => d._id === id ? res.data : d));
      
      // If the status is 'delivered', also update the order status
      if (status === 'delivered' && res.data.orderId) {
        try {
          // Call the order service to mark the order as delivered
          await axios.put(
            `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${res.data.orderId}/mark-delivered`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          console.log(`Order ${res.data.orderId} marked as delivered successfully`);
        } catch (orderError) {
          console.error(`Error updating order status for order ${res.data.orderId}:`, orderError);
          // Don't block the UI update if order status update fails
        }
      }
      
      // Success message
      setSuccess(`Delivery status updated to ${status}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center border-b pb-3">
        <FaTruck className="text-blue-600 mr-3" /> My Deliveries
      </h2>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-start">
          <FaInfoCircle className="text-blue-500 mr-3 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-blue-700 mb-1">Delivery Instructions</h3>
            <p className="text-blue-600 text-sm">Pick up orders from the restaurant and deliver them to the customer's address. Update the status as you progress.</p>
          </div>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
            <p className="font-medium">{success}</p>
          </div>
        </div>
      )}
      
      {deliveries.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
          <FaTruck className="text-gray-400 text-4xl mx-auto mb-3 opacity-50" />
          <p className="text-gray-500 font-medium">No deliveries assigned to you at this time.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {deliveries.map((delivery) => (
            <div key={delivery._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
              <div className={`bg-gradient-to-r px-4 py-3 text-white ${delivery.status === 'delivered' ? 'from-green-500 to-green-600' : delivery.status === 'picked_up' ? 'from-blue-500 to-blue-600' : 'from-yellow-500 to-yellow-600'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {delivery.status === 'delivered' ? (
                      <FaCheckCircle className="mr-2" />
                    ) : delivery.status === 'picked_up' ? (
                      <FaShippingFast className="mr-2" />
                    ) : (
                      <FaBox className="mr-2" />
                    )}
                    <h4 className="font-medium">Order #{delivery.orderId.substring(delivery.orderId.length - 6)}</h4>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-white/20">
                    {delivery.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                {/* Payment information badges */}
                <div className="flex mt-2 space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    delivery.paymentMethod === 'card' 
                      ? 'bg-purple-700/60' 
                      : 'bg-green-700/60'
                  }`}>
                    {delivery.paymentMethod === 'card' ? '💳 Card' : '💵 Cash on Delivery'}
                  </span>
                  
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    delivery.paymentStatus === 'completed' 
                      ? 'bg-green-700/60' 
                      : delivery.paymentStatus === 'pending' 
                        ? 'bg-yellow-700/60' 
                        : delivery.paymentStatus === 'failed' 
                          ? 'bg-red-700/60' 
                          : 'bg-gray-700/60'
                  }`}>
                    {delivery.paymentStatus === 'completed' 
                      ? '✅ Paid' 
                      : delivery.paymentStatus === 'pending' 
                        ? '⏳ Payment Pending' 
                        : delivery.paymentStatus === 'failed' 
                          ? '❌ Payment Failed' 
                          : '↩️ Refunded'}
                  </span>
                </div>
              </div>
              
              <div className="p-4">
                {/* Restaurant Name Section */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <FaStore className="mr-2 text-green-500" /> Restaurant
                  </h5>
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <p className="text-gray-700 font-medium">{delivery.restaurantName || 'Restaurant information not available'}</p>
                  </div>
                </div>

                {/* Delivery Address Section - Highlighted as requested in memory */}
                {delivery.deliveryAddress && (
                  <div className="mb-4">
                    <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-red-500" /> Delivery Address
                    </h5>
                    <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 shadow-sm">
                      <p className="text-gray-700">{delivery.deliveryAddress}</p>
                    </div>
                  </div>
                )}
                
                {/* Current Location */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <FaMapMarkerAlt className="mr-2 text-blue-500" /> Current Location
                  </h5>
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200 shadow-sm">
                    <p className="text-gray-700">{delivery.location || 'Not yet updated'}</p>
                  </div>
                </div>
                
                {/* Delivery Time */}
                <div className="mb-4">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <FaCalendarAlt className="mr-2 text-purple-500" /> Assigned On
                  </h5>
                  <div className="bg-purple-50 p-3 rounded-md border border-purple-200 shadow-sm">
                    <p className="text-gray-700">{new Date(delivery.createdAt).toLocaleString()}</p>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {delivery.status !== 'delivered' && (
                  <div className="flex space-x-3 mt-4 pt-3 border-t border-gray-100">
                    {delivery.status !== 'picked_up' && (
                      <button
                        onClick={() => handleUpdateStatus(delivery._id, 'picked_up', 'On the way')}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow"
                      >
                        <FaShippingFast className="mr-2" />
                        Pick Up Order
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(delivery._id, 'delivered', 'Delivered')}
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <FaClipboardCheck className="mr-2" />
                      Mark Delivered
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryPersonnel;