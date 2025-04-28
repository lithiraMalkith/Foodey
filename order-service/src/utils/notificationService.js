const axios = require('axios');

// Get notification service URL from environment variable or use default
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005';

// Debug notification service URL
console.log(`Using notification service URL: ${NOTIFICATION_SERVICE_URL}`);

/**
 * Send order confirmation notification to customer
 * @param {string} orderId - Order ID
 * @param {string} customerEmail - Customer email
 * @param {object} orderDetails - Order details including items and total
 * @returns {Promise<object>} - Response from notification service
 */
exports.sendOrderConfirmation = async (orderId, customerEmail, orderDetails = {}) => {
  try {
    console.log(`Sending order confirmation notification for order ${orderId} to ${customerEmail}`);
    console.log('Order details:', JSON.stringify(orderDetails));
    console.log('Auth token:', process.env.NOTIFICATION_SERVICE_TOKEN ? 'Token exists' : 'Token missing');
    
    // Log the full request details
    const requestUrl = `${NOTIFICATION_SERVICE_URL}/api/notifications/customer/confirmation`;
    console.log(`Making request to: ${requestUrl}`);
    
    const response = await axios.post(
      requestUrl,
      {
        orderId,
        customerEmail,
        orderDetails
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}`
        }
      }
    );
    
    console.log(`Order confirmation notification sent successfully: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error('Error sending order confirmation notification:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
    throw new Error(`Failed to send order confirmation notification: ${error.message}`);
  }
};

/**
 * Send order delivery notification to customer
 * @param {string} orderId - Order ID
 * @param {string} customerEmail - Customer email
 * @param {object} deliveryDetails - Delivery details (delivery person, ETA, etc.)
 * @returns {Promise<object>} - Response from notification service
 */
exports.sendDeliveryNotification = async (orderId, customerEmail, deliveryDetails = {}) => {
  try {
    console.log(`Sending delivery notification for order ${orderId} to ${customerEmail}`);
    console.log('Delivery details:', JSON.stringify(deliveryDetails));
    console.log('Auth token:', process.env.NOTIFICATION_SERVICE_TOKEN ? 'Token exists' : 'Token missing');
    
    // Log the full request details
    const requestUrl = `${NOTIFICATION_SERVICE_URL}/api/notifications/customer/delivery`;
    console.log(`Making request to: ${requestUrl}`);
    
    const response = await axios.post(
      requestUrl,
      {
        orderId,
        customerEmail,
        deliveryDetails
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}`
        }
      }
    );
    
    console.log(`Order delivery notification sent successfully: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error('Error sending delivery notification:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received, request was:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    console.error('Error config:', error.config);
    throw new Error(`Failed to send delivery notification: ${error.message}`);
  }
};

/**
 * Send delivery assignment notification to driver
 * @param {string} orderId - Order ID
 * @param {string} driverId - Driver ID
 * @returns {Promise<object>} - Response from notification service
 */
exports.sendDriverAssignmentNotification = async (orderId, driverId) => {
  try {
    console.log(`Sending driver assignment notification for order ${orderId} to driver ${driverId}`);
    
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/notifications/driver/assignment`,
      {
        orderId,
        driverId
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}`
        }
      }
    );
    
    console.log(`Driver assignment notification sent successfully: ${response.data.message}`);
    return response.data;
  } catch (error) {
    console.error('Error sending driver assignment notification:', error.response?.data || error.message);
    throw new Error(`Failed to send driver assignment notification: ${error.message}`);
  }
};
