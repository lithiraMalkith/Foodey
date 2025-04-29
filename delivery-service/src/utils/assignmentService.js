const Driver = require('../models/driver');
const Delivery = require('../models/delivery');
const axios = require('axios');

// Extract city from address
function extractCity(address) {
  if (!address) return null;
  
  // If address is an object with a city property, return it directly
  if (typeof address === 'object' && address.city) {
    return address.city;
  }
  
  // If it's not a string, we can't extract from it
  if (typeof address !== 'string') return null;
  
  // Split the address by commas
  const parts = address.split(',');
  
  // Address format should be: street, city, state, zipCode
  if (parts.length >= 3) {
    // If we have at least 3 parts, city is likely the second part
    return parts[1].trim();
  } else if (parts.length > 0) {
    // Fallback to the last part if we don't have enough parts
    return parts[parts.length - 1].trim();
  }
  
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
    return null;
  }
  
  try {
    // Find available drivers in the same city
    const drivers = await Driver.find({
      status: 'available',
      activeDeliveries: { $lt: 1 },
      'currentLocation.city': { $regex: new RegExp(orderCity, 'i') } // Case-insensitive match
    }).sort({ activeDeliveries: 1 });
    
    if (drivers.length === 0) {
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
async function autoAssignDriver(orderId, orderAddress, requestRestaurantName, requestRestaurantId, paymentMethod, paymentStatus) {
  try {
    // Check if delivery already exists
    try {
      const existingDelivery = await Delivery.findOne({ orderId });
      if (existingDelivery) {
        return { 
          success: true, 
          message: 'Delivery already assigned',
          alreadyAssigned: true,
          delivery: existingDelivery
        };
      }
    } catch (findError) {
      console.error(`Error checking for existing delivery for order ${orderId}:`, findError);
    }
    
    // Extract city from address
    let orderCity;
    if (typeof orderAddress === 'object' && orderAddress.city) {
      orderCity = orderAddress.city;
    } else {
      orderCity = extractCity(orderAddress);
    }
    
    // Find the best driver
    const driver = await findBestDriver(orderId, orderAddress, orderCity);
    if (!driver) {
      return { success: false, message: 'No available drivers found in this city' };
    }
    
    // Get restaurant name if not provided
    let restaurantName = requestRestaurantName;
    if (!restaurantName) {
      try {
        const orderResponse = await axios.get(
          `${process.env.ORDER_SERVICE_URL}/api/orders/${orderId}`,
          { headers: { Authorization: `Bearer ${process.env.JWT_SECRET}` } }
        );
        
        if (orderResponse.data && orderResponse.data.restaurantName) {
          restaurantName = orderResponse.data.restaurantName;
        }
      } catch (orderError) {
        console.error('Error fetching restaurant name:', orderError.message);
      }
    }
    
    // Create delivery assignment
    const deliveryData = {
      orderId,
      driverId: driver.userId,
      restaurantName: restaurantName && restaurantName.trim() !== '' ? restaurantName : 'Unknown Restaurant',
      paymentMethod: paymentMethod || 'card',
      paymentStatus: paymentStatus || 'pending'
    };
    
    // Handle different address formats
    if (typeof orderAddress === 'object' && orderAddress.city) {
      // Store both structured and string versions of the address
      deliveryData.structuredAddress = orderAddress;
      deliveryData.deliveryAddress = `${orderAddress.street || ''}, ${orderAddress.city || ''}, ${orderAddress.state || ''}, ${orderAddress.zipCode || ''}`;
    } else if (typeof orderAddress === 'string') {
      // Just store the string address
      deliveryData.deliveryAddress = orderAddress;
    }
    
    // Create and save the delivery
    let delivery;
    try {
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
      
      console.error('Error saving delivery:', saveError);
      return { success: false, message: `Error creating delivery: ${saveError.message}` };
    }
    
    // Send notification to driver
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
    }
    
    return { 
      success: true, 
      delivery,
      driverId: driver.userId,
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
