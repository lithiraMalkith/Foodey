import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaMotorcycle, FaCheckCircle, FaBox, FaMapMarkerAlt, FaUser, FaPhone, FaSpinner, FaStore, FaUtensils, FaStar } from 'react-icons/fa';

const TrackDelivery = () => {
  const { orderId } = useParams();
  const [delivery, setDelivery] = useState(null);
  const [driver, setDriver] = useState(null);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const token = localStorage.getItem('token');
  
  useEffect(() => {
    const fetchDeliveryDetails = async () => {
      try {
        // First try to get the full order details to get all information including restaurant details
        try {
          const orderResponse = await axios.get(
            `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log('Order data:', orderResponse.data);
          
          // Set the full order object
          setOrder(orderResponse.data);
          
          // If the order is still pending or confirmed, we won't have a delivery record yet
          if (orderResponse.data.status === 'pending' || orderResponse.data.status === 'confirmed') {
            // Create a placeholder delivery object for display purposes
            setDelivery({
              orderId,
              status: orderResponse.data.status,
              createdAt: new Date().toISOString()
            });
            
            // Set a placeholder driver object
            setDriver({
              name: 'Driver will be assigned after order confirmation',
              phone: 'Pending assignment'
            });
            
            setLoading(false);
            return; // Exit early since we have all the info we need
          }
        } catch (orderError) {
          console.log('Full order details not available, trying status endpoint:', orderError.message);
          
          // Try to get just the order status
          try {
            const orderStatusResponse = await axios.get(
              `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}/status`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            console.log('Order status data:', orderStatusResponse.data);
            
            // Create a basic order object with the status information
            setOrder({
              _id: orderId,
              status: orderStatusResponse.data.status || 'pending',
              deliveryAddress: orderStatusResponse.data.deliveryAddress || 'Address will be available when delivery is assigned',
              restaurantName: orderStatusResponse.data.restaurantName || 'Restaurant information unavailable',
              total: orderStatusResponse.data.total || 0,
              items: orderStatusResponse.data.items || []
            });
            
            // If the order is still pending or confirmed, we won't have a delivery record yet
            if (orderStatusResponse.data.status === 'pending' || orderStatusResponse.data.status === 'confirmed') {
              // Create a placeholder delivery object for display purposes
              setDelivery({
                orderId,
                status: orderStatusResponse.data.status,
                createdAt: new Date().toISOString()
              });
              
              // Set a placeholder driver object
              setDriver({
                name: 'Driver will be assigned after order confirmation',
                phone: 'Pending assignment'
              });
              
              setLoading(false);
              return; // Exit early since we have all the info we need
            }
          } catch (orderStatusError) {
            console.log('Order status not available:', orderStatusError.message);
            // Continue to try the delivery tracking endpoint
          }
        }
        
        // If we get here, either the order status check failed or the order is in a state where
        // it should have a delivery record, so we try the delivery tracking endpoint
        try {
          const deliveryResponse = await axios.get(
            `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/${orderId}/track`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (deliveryResponse.data) {
            console.log('Delivery tracking data:', deliveryResponse.data);
            
            // Set basic delivery info from tracking endpoint
            setDelivery({
              ...deliveryResponse.data,
              status: deliveryResponse.data.status || 'pending',
              createdAt: new Date().toISOString()
            });
            
            // Only try to get driver details if we have a driverId
            if (deliveryResponse.data.driverId) {
              try {
                const driverResponse = await axios.get(
                  `${process.env.REACT_APP_DELIVERY_API_URL}/api/drivers/${deliveryResponse.data.driverId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                setDriver(driverResponse.data);
              } catch (driverError) {
                console.log('Driver details not available yet:', driverError.message);
                // Set a placeholder driver object
                setDriver({
                  name: 'Driver information will be available once assigned',
                  phone: 'Pending assignment'
                });
              }
            } else {
              console.log('No driver assigned yet');
              // Set a placeholder driver object
              setDriver({
                name: 'Driver information will be available once assigned',
                phone: 'Pending assignment'
              });
            }
            
            // Update the order object with delivery status if we didn't get it from the order status endpoint
            if (!order) {
              // Try to get the full order details to get restaurant information
              try {
                const orderDetailsResponse = await axios.get(
                  `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                
                console.log('Order details data:', orderDetailsResponse.data);
                
                setOrder(orderDetailsResponse.data);
              } catch (orderDetailsError) {
                console.log('Order details not available:', orderDetailsError.message);
                // Set a basic order object if we can't get the full details
                setOrder({
                  _id: orderId,
                  status: deliveryResponse.data.status || 'pending',
                  deliveryAddress: deliveryResponse.data.deliveryAddress || 'Address will be available when delivery is assigned',
                  restaurantName: deliveryResponse.data.restaurantName || 'Restaurant information unavailable',
                  total: 0,
                  items: []
                });
              }
            }
          }
        } catch (deliveryError) {
          console.log('Delivery tracking not available:', deliveryError.message);
          // If we couldn't get delivery info but have order info, that's okay
          if (!order) {
            setError('Could not retrieve order or delivery information. Please try again later.');
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading delivery details:', error);
        setError('Error loading delivery details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchDeliveryDetails();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchDeliveryDetails, 30000);
    return () => clearInterval(interval);
  }, [orderId, token]);
  
  // Calculate estimated arrival time
  const getEstimatedArrival = () => {
    if (!delivery) return 'Unknown';
    
    const now = new Date();
    let estimatedMinutes = 30; // Default 30 minutes
    
    if (delivery.status === 'picked_up') {
      estimatedMinutes = 15; // 15 minutes if already picked up
    } else if (delivery.status === 'delivered') {
      return 'Delivered';
    }
    
    const arrivalTime = new Date(now.getTime() + estimatedMinutes * 60000);
    return arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex justify-center items-center h-64">
        <FaSpinner className="text-blue-600 text-4xl animate-spin" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!delivery) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md">
          <p>No delivery found for this order. It may still be in processing.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaMotorcycle className="text-blue-600 mr-3" />
        Delivery Tracking
      </h2>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-6">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-xl">Order #{orderId.substring(0, 6)}...</h3>
            <p className="text-sm bg-white/20 px-3 py-1 rounded-full">
              Estimated Arrival: {getEstimatedArrival()}
            </p>
          </div>
        </div>
        
        {/* Restaurant Information - Highlighted Section */}
        {order && order.restaurantName && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 border-b border-indigo-100">
            <div className="flex items-start">
              <div className="bg-white p-3 rounded-full shadow-md mr-4 flex-shrink-0">
                <FaStore className="text-purple-600 text-xl" />
              </div>
              <div className="flex-grow">
                <h4 className="font-bold text-lg text-gray-800 flex items-center">
                  {order.restaurantName}
                  <span className="ml-2 bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full flex items-center">
                    <FaStar className="mr-1" /> 4.8
                  </span>
                </h4>
                {order.restaurantAddress && (
                  <p className="text-gray-600 flex items-center text-sm mt-1">
                    <FaMapMarkerAlt className="mr-1 text-purple-500 flex-shrink-0" />
                    {order.restaurantAddress}
                  </p>
                )}
                <div className="mt-2 flex items-center">
                  <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full mr-2 flex items-center">
                    <FaUtensils className="mr-1" /> {order.items?.length || 0} items
                  </span>
                  {order.restaurantPhone && (
                    <a href={`tel:${order.restaurantPhone}`} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full flex items-center">
                      <FaPhone className="mr-1" /> Call Restaurant
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-6">
          {order && (
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                <FaBox className="text-blue-600 mr-2" /> Order Details
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-700"><span className="font-medium">Status:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'out_for_delivery' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Unknown'}
                    </span>
                  </p>
                  
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-gray-700 mb-2">Order Items:</p>
                      <ul className="bg-gray-50 rounded-md p-2 text-sm">
                        {order.items.map((item, index) => (
                          <li key={index} className="py-1 border-b border-gray-100 last:border-0 flex justify-between">
                            <span>{item.name} x {item.quantity}</span>
                            <span className="font-medium">${item.price?.toFixed(2) || '0.00'}</span>
                          </li>
                        ))}
                      </ul>
                      {order.total && (
                        <p className="text-right mt-2 font-bold text-gray-800">Total: ${order.total.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-gray-700 flex items-start">
                    <FaMapMarkerAlt className="text-blue-600 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-medium">Delivery Address:</span><br />
                      <span className="bg-blue-50 p-2 rounded-md block mt-1 border-l-4 border-blue-400">
                        {order.deliveryAddress || 'Address not available'}
                      </span>
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {driver && (
            <div className="mb-6 border-b border-gray-200 pb-6">
              <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
                <FaUser className="text-blue-600 mr-2" /> Driver Information
              </h4>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                  <FaUser className="text-2xl" />
                </div>
                <div className="flex-grow">
                  <p className="font-bold text-gray-800">{driver.name || 'Driver Name'}</p>
                  <p className="text-gray-600 flex items-center">
                    <FaMapMarkerAlt className="mr-1 text-sm" />
                    {driver.currentLocation?.city || 'Location not available'}
                    {driver.currentLocation?.area && `, ${driver.currentLocation.area}`}
                  </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center transition-colors">
                  <FaPhone className="mr-2" />
                  Contact
                </button>
              </div>
            </div>
          )}
          
          <div>
            <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <FaMotorcycle className="text-blue-600 mr-2" /> Delivery Status
            </h4>
            
            <div className="relative pb-12">
              {/* Status timeline line */}
              <div className="absolute left-8 top-0 h-full w-1 bg-gray-200"></div>
              
              {/* Status steps */}
              <div className="space-y-8">
                {/* Order Placed Step - Always show this */}
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${order?.status ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    <FaBox className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h5 className="font-bold text-gray-800">Order Placed</h5>
                    <p className="text-gray-600">Your order has been received by the restaurant</p>
                  </div>
                </div>

                {/* Order Confirmed Step */}
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${(order?.status === 'confirmed' || order?.status === 'preparing' || order?.status === 'ready' || order?.status === 'picked_up' || order?.status === 'in_transit' || order?.status === 'delivered') ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    <FaCheckCircle className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h5 className="font-bold text-gray-800">Order Confirmed</h5>
                    <p className="text-gray-600">Restaurant has confirmed your order</p>
                  </div>
                </div>

                {/* Preparing Step - Hidden as requested */}
                {/* Temporarily hidden
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${(order?.status === 'preparing' || order?.status === 'ready' || order?.status === 'picked_up' || order?.status === 'in_transit' || order?.status === 'delivered') ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    <FaBox className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h5 className="font-bold text-gray-800">Preparing</h5>
                    <p className="text-gray-600">Your food is being prepared</p>
                  </div>
                </div>
                */}
                
                {/* Driver Assigned Step */}
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${(order?.status === 'ready' || delivery?.status === 'assigned' || delivery?.status === 'picked_up' || delivery?.status === 'in_transit' || delivery?.status === 'delivered') ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    <FaMotorcycle className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h5 className="font-bold text-gray-800">Driver Assigned</h5>
                    <p className="text-gray-600">
                      {(order?.status === 'ready' || delivery?.status === 'assigned' || delivery?.status === 'picked_up' || delivery?.status === 'in_transit' || delivery?.status === 'delivered') 
                        ? 'A driver has been assigned to your order' 
                        : 'Waiting for a driver to be assigned'}
                    </p>
                  </div>
                </div>
                
                {/* Order Picked Up Step */}
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${(delivery?.status === 'picked_up' || delivery?.status === 'in_transit' || delivery?.status === 'delivered') ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    <FaBox className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h5 className="font-bold text-gray-800">Order Picked Up</h5>
                    <p className="text-gray-600">
                      {(delivery?.status === 'picked_up' || delivery?.status === 'in_transit' || delivery?.status === 'delivered') 
                        ? 'Your order has been picked up by the driver' 
                        : 'Waiting for driver to pick up your order'}
                    </p>
                  </div>
                </div>
                
                {/* In Transit Step - Hidden as requested */}
                {/* Temporarily hidden
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${(delivery?.status === 'in_transit') ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    <FaMotorcycle className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h5 className="font-bold text-gray-800">In Transit</h5>
                    <p className="text-gray-600">
                      {(delivery?.status === 'in_transit') 
                        ? 'Your order is on the way to your location' 
                        : 'Waiting for driver to start delivery'}
                    </p>
                  </div>
                </div>
                */}
                
                {/* Delivered Step */}
                <div className="flex items-start">
                  <div className={`relative z-10 flex items-center justify-center w-16 h-16 rounded-full ${(delivery?.status === 'delivered') ? 'bg-green-500 text-white' : 'bg-gray-300'}`}>
                    <FaCheckCircle className="text-xl" />
                  </div>
                  <div className="ml-4">
                    <h5 className="font-bold text-gray-800">Delivered</h5>
                    <p className="text-gray-600">
                      {(delivery?.status === 'delivered') 
                        ? 'Your order has been delivered' 
                        : 'Waiting for delivery confirmation'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackDelivery;