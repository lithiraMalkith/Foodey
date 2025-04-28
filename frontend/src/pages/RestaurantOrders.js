import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaClipboardList, FaExclamationTriangle, FaSpinner, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaMoneyBillWave, FaCircle, FaCheckCircle, FaTimes, FaTruck, FaSearch, FaInfoCircle } from 'react-icons/fa';

const RestaurantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${process.env.REACT_APP_ORDER_API_URL}/api/orders/restaurant`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch customer names for each order
        const ordersWithCustomers = await Promise.all(
          response.data.map(async (order) => {
            try {
              const userResponse = await axios.get(
                `${process.env.REACT_APP_API_BASE_URL}/api/users/${order.userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              return {
                ...order,
                customerName: userResponse.data.name || 'Unknown Customer'
              };
            } catch (error) {
              console.error(`Error fetching customer for order ${order._id}:`, error);
              return {
                ...order,
                customerName: 'Unknown Customer'
              };
            }
          })
        );
        
        setOrders(ordersWithCustomers);
        setLoading(false);
      } catch (err) {
        setError('Failed to load restaurant orders');
        setLoading(false);
        console.error('Error fetching restaurant orders:', err);
      }
    };
    
    fetchOrders();
  }, []);

  // Filter orders based on search term and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order._id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Get status badge color and text
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' };
      case 'confirmed':
        return { color: 'bg-blue-100 text-blue-800', text: 'Confirmed' };
      case 'out_for_delivery':
        return { color: 'bg-purple-100 text-purple-800', text: 'Out for Delivery' };
      case 'delivered':
        return { color: 'bg-green-100 text-green-800', text: 'Delivered' };
      case 'cancelled':
        return { color: 'bg-red-100 text-red-800', text: 'Cancelled' };
      default:
        return { color: 'bg-gray-100 text-gray-800', text: status };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <FaSpinner className="text-blue-500 text-4xl animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaClipboardList className="text-blue-600 mr-3" />
        Restaurant Orders
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
          <h3 className="font-medium text-gray-700 flex items-center mb-2 md:mb-0">
            <FaSearch className="text-blue-500 mr-2" /> 
            Filter Orders
          </h3>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by customer or order ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2 px-3"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50 py-2 px-3"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <FaClipboardList className="text-gray-400 text-5xl mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Orders Found</h3>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Your restaurant has not received any orders yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const { color, text } = getStatusBadge(order.status);
                  return (
                    <tr key={order._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order._id.substring(order._id.length - 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaUser className="text-gray-400 mr-2" />
                          {order.customerName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaCalendarAlt className="text-gray-400 mr-2" />
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <FaMoneyBillWave className="text-green-500 mr-2" />
                          ${order.total.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${color}`}>
                          {text}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center mb-1">
                              <FaCircle className="text-blue-400 mr-2 text-xs" />
                              {item.name} x{item.quantity}
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <div className="text-xs text-gray-400 italic">
                              +{order.items.length - 2} more items
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 text-blue-700">
        <h3 className="font-medium mb-2 flex items-center">
          <FaInfoCircle className="mr-2" /> Order Status Information
        </h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mr-2">Pending</span>
            Order received but not yet confirmed
          </li>
          <li className="flex items-center">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 mr-2">Confirmed</span>
            Order confirmed and being prepared
          </li>
          <li className="flex items-center">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 mr-2">Out for Delivery</span>
            Order has been assigned to a delivery person
          </li>
          <li className="flex items-center">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 mr-2">Delivered</span>
            Order has been successfully delivered
          </li>
          <li className="flex items-center">
            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 mr-2">Cancelled</span>
            Order has been cancelled
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RestaurantOrders;
