import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaMotorcycle, FaCheckCircle, FaBox, FaMapMarkerAlt, FaUser, FaPhone } from 'react-icons/fa';

const DeliveryTracking = () => {
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
        // Get delivery details
        const deliveryResponse = await axios.get(
          `${process.env.REACT_APP_DELIVERY_API_URL}/api/deliveries/order/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        if (deliveryResponse.data) {
          setDelivery(deliveryResponse.data);
          
          // Get driver details
          const driverResponse = await axios.get(
            `${process.env.REACT_APP_DELIVERY_API_URL}/api/drivers/${deliveryResponse.data.driverId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setDriver(driverResponse.data);
          
          // Get order details
          const orderResponse = await axios.get(
            `${process.env.REACT_APP_ORDER_API_URL}/api/orders/${orderId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          setOrder(orderResponse.data);
        }
        
        setLoading(false);
      } catch (error) {
        setError('Error loading delivery details');
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <p>{error}</p>
        </div>
      </div>
    );
  }
  
  if (!delivery) {
    return (
      <div className="container">
        <div className="alert alert-warning">
          <p>No delivery found for this order.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <h2 className="page-title">Delivery Tracking</h2>
      
      <div className="card">
        <div className="card-header tracking-header">
          <h3>Order #{orderId.substring(0, 8)}...</h3>
          <p className="estimated-time">Estimated Arrival: {getEstimatedArrival()}</p>
        </div>
        
        <div className="card-body">
          {order && (
            <div className="order-details">
              <h4>Order Details</h4>
              <div className="details-grid">
                <div>
                  <p><span className="detail-label">Items:</span> {order.items.length}</p>
                  <p><span className="detail-label">Total:</span> ${order.totalAmount.toFixed(2)}</p>
                </div>
                <div>
                  <p className="address-detail">
                    <FaMapMarkerAlt className="detail-icon" />
                    <span>
                      <span className="detail-label">Delivery Address:</span><br />
                      {order.deliveryAddress}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {driver && (
            <div className="driver-details">
              <h4>Driver Information</h4>
              <div className="driver-card">
                <div className="driver-avatar">
                  <FaUser className="avatar-icon" />
                </div>
                <div className="driver-info">
                  <p className="driver-name">{driver.name}</p>
                  <p className="driver-location">
                    <FaMapMarkerAlt className="location-icon" />
                    {driver.currentLocation.city}
                    {driver.currentLocation.area && `, ${driver.currentLocation.area}`}
                  </p>
                </div>
                <div className="contact-button">
                  <button className="btn btn-primary btn-sm">
                    <FaPhone className="btn-icon" />
                    Contact
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="delivery-status">
            <h4>Delivery Status</h4>
            <div className="status-timeline">
              {/* Status timeline line */}
              <div className="timeline-line"></div>
              
              {/* Status steps */}
              <div className="timeline-steps">
                <div className={`timeline-step ${delivery.status === 'assigned' || delivery.status === 'picked_up' || delivery.status === 'delivered' ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <FaMotorcycle />
                  </div>
                  <div className="step-content">
                    <h5>Order Assigned</h5>
                    <p>{delivery.status === 'assigned' || delivery.status === 'picked_up' || delivery.status === 'delivered' ? 'Your order has been assigned to a driver' : 'Waiting for driver assignment'}</p>
                    {(delivery.status === 'assigned' || delivery.status === 'picked_up' || delivery.status === 'delivered') && (
                      <p className="step-time">{new Date(delivery.createdAt).toLocaleString()}</p>
                    )}
                  </div>
                </div>
                
                <div className={`timeline-step ${delivery.status === 'picked_up' || delivery.status === 'delivered' ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <FaBox />
                  </div>
                  <div className="step-content">
                    <h5>Food Picked Up</h5>
                    <p>{delivery.status === 'picked_up' || delivery.status === 'delivered' ? 'Driver has picked up your order' : 'Waiting for pickup'}</p>
                    {(delivery.status === 'picked_up' || delivery.status === 'delivered') && (
                      <p className="step-time">Estimated arrival: {getEstimatedArrival()}</p>
                    )}
                  </div>
                </div>
                
                <div className={`timeline-step ${delivery.status === 'delivered' ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <FaCheckCircle />
                  </div>
                  <div className="step-content">
                    <h5>Order Delivered</h5>
                    <p>{delivery.status === 'delivered' ? 'Your order has been delivered' : 'Waiting for delivery'}</p>
                    {delivery.status === 'delivered' && (
                      <p className="step-time">{new Date(delivery.updatedAt).toLocaleString()}</p>
                    )}
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

export default DeliveryTracking;
