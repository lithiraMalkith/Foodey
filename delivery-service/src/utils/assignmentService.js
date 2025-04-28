const Driver = require('../models/driver');
const Delivery = require('../models/delivery');
const axios = require('axios');

// Extract city from address
function extractCity(address) {
  console.log('Extracting city from address:', address);
  if (!address) {
    console.log('Address is null or empty');
    return null;
  }
  
  // Split the address by commas
  const parts = address.split(',');
  console.log('Address parts:', parts);
  
  // Address format should be: street, city, state, zipCode
  if (parts.length >= 3) {
    // If we have at least 3 parts, city is likely the second part
    const city = parts[1].trim();
    console.log('Extracted city from second part:', city);
    return city;
  } else if (parts.length > 0) {
    // Fallback to the last part if we don't have enough parts
    const city = parts[parts.length - 1].trim();
    console.log('Extracted city from last part (fallback):', city);
    return city;
  }
  
  console.log('Could not extract city from address');
  return null;
}

// Find the best driver for an order based on city matching
async function findBestDriver(orderId, orderAddress, orderCity) {
  // If orderCity is not provided, extract it from the address
  if (!orderCity) {
    if (typeof orderAddress === 'object' && orderAddress.city) {
      orderCity = orderAddress.city;
    } else {
      orderCity = extractCity(orderAddress);
    }
  }
  
  if (!orderCity) {
    console.log('Could not determine city from order address');
    return null;
  }
  
  try {
    // Find available drivers in the same city
    const drivers = await Driver.find({
      status: 'available',
      activeDeliveries: { $lt: 1 }, // Fixed query to use a literal value
      'currentLocation.city': { $regex: new RegExp(orderCity, 'i') } // Case-insensitive match
    }).sort({ activeDeliveries: 1 });
    
    if (drivers.length === 0) {
      console.log('No available drivers found in city:', orderCity);
      return null;
    }
    
    // Select the driver with fewest active deliveries
    return drivers[0];
  } catch (error) {
    console.error('Error finding best driver:', error);
    return null;
  }
}

// Automatically assign a driver to an order
async function autoAssignDriver(orderId, orderAddress, requestRestaurantName, requestRestaurantId) {
  try {
    console.log('autoAssignDriver called with:', { 
      orderId, 
      orderAddress,
      requestRestaurantName: requestRestaurantName || 'Not provided',
      requestRestaurantId: requestRestaurantId || 'Not provided'
    });
    
    // Check if delivery already exists with robust error handling
    try {
      const existingDelivery = await Delivery.findOne({ orderId });
      if (existingDelivery) {
        console.log('Delivery already exists for order:', orderId);
        return { 
          success: true, 
          message: 'Delivery already assigned',
          alreadyAssigned: true,
          delivery: existingDelivery
        };
      }
    } catch (findError) {
      console.error(`Error checking for existing delivery for order ${orderId}:`, findError);
      // Continue with the assignment attempt even if the check fails
    }
    
    // Check if orderAddress is an object with a city property
    let orderCity;
    if (typeof orderAddress === 'object' && orderAddress.city) {
      orderCity = orderAddress.city;
      console.log('Using city directly from address object:', orderCity);
    } else {
      // Fall back to extracting city from string address
      orderCity = extractCity(orderAddress);
      console.log('Extracted city from address string:', orderCity);
    }
    
    // Find the best driver
    console.log('Finding best driver for address:', orderAddress, 'with city:', orderCity);
    const driver = await findBestDriver(orderId, orderAddress, orderCity);
    if (!driver) {
      console.log('No available drivers found for this address');
      return { success: false, message: 'No available drivers found in this city' };
    }
    console.log('Found driver:', { name: driver.name, city: driver.currentLocation.city });
    
    // First check if restaurant name was provided in the request
    let restaurantName = '';
    
    // If restaurant name was provided in the request, use it
    if (requestRestaurantName && requestRestaurantName.trim() !== '') {
      restaurantName = requestRestaurantName;
      console.log(`Using restaurant name from request: ${restaurantName}`);
    } else {
      // Otherwise fetch from order service
      try {
        console.log(`Fetching order details for order ID: ${orderId}`);
        
        // Create proper authorization header for service-to-service communication
        // For service-to-service communication, we should use JWT_SECRET directly
        const authToken = process.env.JWT_SECRET;
        
        // Create a proper Bearer token for service-to-service communication
        const headers = { 
          Authorization: `Bearer ${authToken}` 
        };
        
        console.log('Using authorization header:', headers.Authorization.substring(0, 15) + '...');
        console.log('Calling order service URL:', process.env.ORDER_SERVICE_URL || 'http://order-service:3002');
        
        // The enhanced order endpoint now handles restaurant name retrieval internally
        const orderResponse = await axios.get(
          `${process.env.ORDER_SERVICE_URL || 'http://order-service:3002'}/api/orders/${orderId}`,
          { headers }
        );
        
        console.log('Order response status:', orderResponse.status);
        
        // Extract restaurant name from the response
        if (orderResponse.data && orderResponse.data.restaurantName) {
          restaurantName = orderResponse.data.restaurantName;
          console.log(`Retrieved restaurant name from order service: ${restaurantName}`);
        } else {
          console.warn('Order data received but missing restaurant name');
        }
      } catch (orderError) {
        console.error('Error fetching order details:', orderError.message);
        if (orderError.response) {
          console.error('Order service response:', orderError.response.status, orderError.response.data);
        }
      }
    }
    
    // Create delivery assignment
    const deliveryData = {
      orderId,
      driverId: driver.userId,
      restaurantName: restaurantName && restaurantName.trim() !== '' ? restaurantName : 'Unknown Restaurant' // Only use fallback if name is empty or whitespace
    };
    
    console.log('Creating delivery with restaurant name:', deliveryData.restaurantName);
    
    // Use a try-catch block to handle potential duplicate key errors
    let delivery;
    try {
    
    // Handle different address formats
    if (typeof orderAddress === 'object' && orderAddress.city) {
      // Store both structured and string versions of the address
      deliveryData.structuredAddress = orderAddress;
      deliveryData.deliveryAddress = `${orderAddress.street}, ${orderAddress.city}, ${orderAddress.state}, ${orderAddress.zipCode}`;
    } else if (typeof orderAddress === 'string') {
      // Just store the string address
      deliveryData.deliveryAddress = orderAddress;
    }
    
      delivery = new Delivery(deliveryData);
      
      await delivery.save();
      
      // Update driver status
      driver.activeDeliveries += 1;
      if (driver.activeDeliveries >= driver.maxConcurrentDeliveries) {
        driver.status = 'busy';
      }
      await driver.save();
    } catch (saveError) {
      // Check if this is a duplicate key error
      if (saveError.code === 11000 && saveError.keyPattern && saveError.keyPattern.orderId) {
        console.log(`Duplicate delivery detected for order ${orderId} during save operation`);
        
        // Try to find the existing delivery
        const existingDelivery = await Delivery.findOne({ orderId });
        if (existingDelivery) {
          return { 
            success: true, 
            message: 'Delivery already assigned (detected during save)',
            alreadyAssigned: true,
            delivery: existingDelivery
          };
        }
        
        return { success: false, message: 'Duplicate delivery detected but could not retrieve details' };
      }
      
      // For other errors, log and return the error
      console.error('Error saving delivery:', saveError);
      return { success: false, message: `Error creating delivery: ${saveError.message}` };
    }
    
    // Send notification to driver (implementation depends on your notification system)
    try {
      // Get order details
      const orderResponse = await axios.get(
        `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${process.env.JWT_SECRET}` } }
      );
      
      // Get user email
      const userResponse = await axios.get(
        `${process.env.USER_SERVICE_URL}/api/users/${driver.userId}/email`,
        { headers: { Authorization: `Bearer ${process.env.JWT_SECRET}` } }
      );
      
      if (userResponse.data && userResponse.data.email) {
        // Send assignment notification
        await axios.post(
          `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications/delivery-assignment`,
          {
            driverEmail: userResponse.data.email,
            orderId: orderId,
            deliveryAddress: orderAddress,
            orderDetails: orderResponse.data
          },
          { headers: { Authorization: `Bearer ${process.env.NOTIFICATION_SERVICE_TOKEN}` } }
        );
      }
    } catch (notificationError) {
      console.error('Error sending driver notification:', notificationError);
      // Continue with the assignment even if notification fails
    }
    
    return { 
      success: true, 
      delivery,
      driverName: driver.name,
      driverCity: driver.currentLocation.city
    };
  } catch (error) {
    console.error('Error auto-assigning driver:', error);
    return { success: false, message: 'Assignment failed' };
  }
}

module.exports = {
  findBestDriver,
  autoAssignDriver,
  extractCity
};
