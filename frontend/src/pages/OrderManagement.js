import { useState, useEffect } from 'react';
import axios from 'axios';

const OrderManagement = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [addressForm, setAddressForm] = useState({
    orderId: '',
    deliveryAddress: ''
  });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders/pending`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPendingOrders(res.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch pending orders');
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      const token = localStorage.getItem('token');
      
      // First, get the order to find the customer ID
      const orderResponse = await axios.get(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const userId = orderResponse.data.userId;
      const orderDetails = orderResponse.data;
      
      // Get the user's default address and email from the user service
      const userResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}/address`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Get the user's email
      const userEmailResponse = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${userId}/email`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Prepare payload with email and address
      let payload = {};
      let customerEmail = '';
      
      // Add customer email for notification
      if (userEmailResponse.data && userEmailResponse.data.email) {
        customerEmail = userEmailResponse.data.email;
        payload.customerEmail = customerEmail;
        console.log(`Including customer email in confirmation: ${payload.customerEmail}`);
      }
      
      // Add delivery address if available
      if (userResponse.data && userResponse.data.defaultAddress) {
        // Store both structured address object and formatted string
        const address = userResponse.data.defaultAddress;
        payload.structuredAddress = address; // Pass the full address object
        payload.deliveryAddress = `${address.street}, ${address.city}, ${address.state}, ${address.zipCode}`;
        console.log(`Including delivery address in confirmation: ${payload.deliveryAddress}`);
        console.log('Including structured address with city:', address.city);
      }
      
      console.log('Confirming order with payload:', payload);
      
      // Confirm the order with the address and email
      const confirmResponse = await axios.put(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}/confirm`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Order confirmation response:', confirmResponse.data);
      
      // Send email notification using the new frontend API
      if (customerEmail) {
        try {
          const notificationResponse = await axios.post(
            `${process.env.REACT_APP_NOTIFICATION_API_URL}/api/notifications/frontend/order-confirmation`,
            {
              orderId,
              customerEmail,
              orderDetails: {
                items: orderDetails.items,
                total: orderDetails.total,
                deliveryAddress: payload.deliveryAddress
              }
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('Notification response:', notificationResponse.data);
        } catch (notificationError) {
          console.error('Failed to send notification:', notificationError);
          // Continue even if notification fails
        }
      }
      
      setSuccessMessage('Order confirmed successfully! Email notification sent to customer.');
      // Refresh data
      fetchPendingOrders();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error confirming order:', err);
      setError(err.response?.data?.error || 'Failed to confirm order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      
      await axios.delete(
        `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('Order deleted successfully!');
      // Refresh data
      fetchPendingOrders();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete order');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddressChange = (e) => {
    setAddressForm({
      ...addressForm,
      deliveryAddress: e.target.value
    });
  };

  const handleAddressSubmit = (e, orderId) => {
    e.preventDefault();
    handleConfirmOrder(orderId, addressForm.deliveryAddress);
    setAddressForm({
      orderId: '',
      deliveryAddress: ''
    });
  };

  const handleEditAddress = (orderId) => {
    setAddressForm({
      orderId,
      deliveryAddress: ''
    });
  };

  const handleCancelEdit = () => {
    setAddressForm({
      orderId: '',
      deliveryAddress: ''
    });
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Order Management</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-sm">
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-sm">
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      
      <div className="mb-8">
        <h3 className="text-xl font-bold mb-4 text-gray-700 border-b pb-2">Pending Orders</h3>
        {pendingOrders.length === 0 ? (
          <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
            <p>No pending orders</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {pendingOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow duration-300">
                <div className="bg-blue-50 px-4 py-3 border-b border-gray-200">
                  <p className="font-semibold text-blue-800">Order #{order._id.substring(order._id.length - 6)}</p>
                  <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleString()}</p>
                </div>
                
                <div className="p-4">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Status:</span>
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                        {order.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">Total:</span>
                      <span className="font-bold text-green-600">${order.total.toFixed(2)}</span>
                    </div>
                    
                    {order.deliveryAddress && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-md">
                        <p className="text-gray-700 font-medium mb-1">Delivery Address:</p>
                        <p className="text-gray-600">{order.deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-gray-700 font-medium mb-2">Items:</p>
                    <ul className="divide-y divide-gray-100">
                      {order.items.map((item, index) => (
                        <li key={index} className="py-2 flex justify-between">
                          <span className="text-gray-800">{item.name} × {item.quantity}</span>
                          <span className="text-gray-600 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  {addressForm.orderId === order._id ? (
                    <form onSubmit={(e) => handleAddressSubmit(e, order._id)} className="bg-white p-4 rounded-md shadow-sm">
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                        <textarea
                          value={addressForm.deliveryAddress}
                          onChange={handleAddressChange}
                          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          rows="3"
                          required
                          placeholder="Enter delivery address"
                        ></textarea>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="submit"
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                          Confirm Order
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex flex-col space-y-2">
                      <button
                        onClick={() => handleEditAddress(order._id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                        </svg>
                        Add Delivery Address
                      </button>
                      <button
                        onClick={() => handleConfirmOrder(order._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Use Order Address
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center"
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Delete Order
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
