import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaShoppingBag, FaExclamationTriangle, FaBox, FaTruck, FaCheckCircle, FaUtensils, FaMoneyBillWave, FaCalendarAlt, FaTrash, FaSpinner, FaStore, FaMapMarkerAlt } from 'react-icons/fa';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const fetchOrders = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_ORDER_API_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);
  
  const handleDeleteOrder = async (orderId) => {
    try {
      setError('');
      setSuccess('');
      setDeletingOrderId(orderId);
      
      const token = localStorage.getItem('token');
      await axios.delete(`${process.env.REACT_APP_ORDER_API_URL}/api/orders/customer/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update the orders list after successful deletion
      setOrders(orders.filter(order => order._id !== orderId));
      setSuccess('Order deleted successfully');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete order');
    } finally {
      setDeletingOrderId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaShoppingBag className="text-blue-600 mr-3" />
        My Orders
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{success}</p>
        </div>
      )}
      
      {orders.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
          <FaShoppingBag className="text-gray-400 text-4xl mx-auto mb-3 opacity-50" />
          <p className="text-gray-500 font-medium">No orders found. Start ordering delicious food!</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className={`bg-gradient-to-r px-4 py-3 text-white ${order.status === 'delivered' ? 'from-green-500 to-green-600' : order.status === 'in progress' ? 'from-blue-500 to-blue-600' : 'from-yellow-500 to-yellow-600'}`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    {order.status === 'delivered' ? (
                      <FaCheckCircle className="mr-2" />
                    ) : order.status === 'in progress' ? (
                      <FaTruck className="mr-2" />
                    ) : (
                      <FaBox className="mr-2" />
                    )}
                    <h3 className="font-medium">Order #{order._id.substring(order._id.length - 6)}</h3>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium bg-white/20">
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
              
              {/* Restaurant Information - Highlighted Section */}
              {order.restaurantName && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 border-b border-blue-100 flex items-center">
                  <div className="bg-white p-2 rounded-full shadow-sm mr-3">
                    <FaStore className="text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-800">{order.restaurantName}</h4>
                    {order.restaurantAddress && (
                      <p className="text-xs text-gray-600 flex items-center">
                        <FaMapMarkerAlt className="mr-1 text-blue-500" />
                        {order.restaurantAddress}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-gray-500 mr-2" />
                    <span className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                    <FaMoneyBillWave className="mr-1" />
                    ${order.total.toFixed(2)}
                  </div>
                </div>
                
                <div className="border-t border-gray-100 pt-4">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center">
                    <FaUtensils className="text-gray-500 mr-2" /> Order Items
                  </h4>
                  <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                        {item.picture ? (
                          <img 
                            src={item.picture} 
                            alt={item.name} 
                            className="w-12 h-12 object-cover rounded-md mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-md mr-3 flex items-center justify-center text-gray-400">
                            <FaUtensils />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{item.name}</p>
                          <p className="text-gray-600 text-sm">${item.price} × {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-gray-100 space-y-2">
                  <Link 
                    to={`/track/${order._id}`} 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm"
                  >
                    <FaTruck className="mr-2" />
                    Track Delivery
                  </Link>
                  
                  {order.status === 'pending' && (
                    <button
                      onClick={() => handleDeleteOrder(order._id)}
                      disabled={deletingOrderId === order._id}
                      className="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {deletingOrderId === order._id ? (
                        <>
                          <FaSpinner className="mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash className="mr-2" />
                          Cancel Order
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;