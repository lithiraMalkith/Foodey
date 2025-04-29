import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSpinner, FaExclamationCircle, FaUtensils } from 'react-icons/fa';
import PaymentForm from '../components/PaymentForm';

const PaymentPage = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      setLoading(true);
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setOrder(response.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError('Error loading order: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, token]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mb-4" />
          <p className="text-gray-600 text-xl">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded shadow-md">
          <div className="flex items-start">
            <FaExclamationCircle className="text-red-500 mt-1 mr-3 text-xl" />
            <div>
              <h3 className="text-red-800 font-bold">Error</h3>
              <p className="text-red-700">{error}</p>
              <Link to="/orders" className="mt-3 inline-block text-blue-600 hover:underline">
                Return to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded shadow-md">
          <div className="flex items-start">
            <FaExclamationCircle className="text-yellow-500 mt-1 mr-3 text-xl" />
            <div>
              <h3 className="text-yellow-800 font-bold">Order Not Found</h3>
              <p className="text-yellow-700">The requested order could not be found.</p>
              <Link to="/orders" className="mt-3 inline-block text-blue-600 hover:underline">
                Return to Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/orders" className="flex items-center text-blue-600 hover:text-blue-800">
          <FaArrowLeft className="mr-2" />
          Back to Orders
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Complete Your Order</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <FaUtensils className="mr-2 text-blue-500" />
              Order Summary
            </h2>
            
            <div className="border-b pb-4 mb-4">
              <p className="text-gray-600">
                <span className="font-semibold">Order ID:</span> {order._id}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Restaurant:</span> {order.restaurantName || 'Not specified'}
              </p>
              {order.deliveryAddress && (
                <p className="text-gray-600">
                  <span className="font-semibold">Delivery Address:</span> {order.deliveryAddress}
                </p>
              )}
            </div>
            
            <h3 className="font-bold text-gray-700 mb-3">Order Items</h3>
            <ul className="mb-4">
              {order.items.map((item, index) => (
                <li key={index} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                </li>
              ))}
            </ul>
            
            <div className="flex justify-between items-center text-lg font-bold mt-4 pt-4 border-t">
              <span>Total:</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div>
          <PaymentForm orderId={order._id} amount={order.total} />
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
