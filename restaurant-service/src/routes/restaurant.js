const express = require('express');
const router = express.Router();
const Restaurant = require('../models/restaurant');
const auth = require('../middleware/auth');

// Create restaurant (Restaurant Admin)
router.post('/', auth(['restaurant_admin']), async (req, res) => {
  try {
    console.log('Creating restaurant with payload:', { ...req.body, picture: req.body.picture ? 'Picture data included' : 'No picture' });
    
    const { name, location, description, picture } = req.body;
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }

    const restaurant = new Restaurant({
      name,
      location,
      description,
      picture,
      ownerId: req.user.userId,
    });
    
    await restaurant.save();
    console.log('Restaurant created successfully:', restaurant._id);
    res.status(201).json(restaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Add menu item (Restaurant Admin)
router.post('/:id/menu', auth(['restaurant_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, picture } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Use findByIdAndUpdate to avoid validating the entire restaurant document
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $push: { menuItems: { name, price, description, picture } } },
      { new: true, runValidators: false }
    );
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Update menu item (Restaurant Admin)
router.put('/:id/menu/:itemId', auth(['restaurant_admin']), async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { name, price, description, picture } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if menu item exists
    const itemIndex = restaurant.menuItems.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Build the update object with only the fields that are provided
    const updateFields = {};
    if (name) updateFields['menuItems.$.name'] = name;
    if (price) updateFields['menuItems.$.price'] = price;
    if (description !== undefined) updateFields['menuItems.$.description'] = description;
    if (picture) updateFields['menuItems.$.picture'] = picture;
    
    // Use findOneAndUpdate to avoid validation issues
    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { _id: id, 'menuItems._id': restaurant.menuItems[itemIndex]._id },
      { $set: updateFields },
      { new: true, runValidators: false }
    );
    
    console.log(`Updated menu item ${itemId} for restaurant ${id}`);
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error updating menu item:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Delete menu item (Restaurant Admin)
router.delete('/:id/menu/:itemId', auth(['restaurant_admin']), async (req, res) => {
  try {
    const { id, itemId } = req.params;
    console.log(`Attempting to delete menu item: Restaurant ID: ${id}, Item ID: ${itemId}`);

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Find the index of the menu item by comparing string representations of ObjectIds
    const itemIndex = restaurant.menuItems.findIndex(item => item._id.toString() === itemId);
    console.log(`Item index found: ${itemIndex}`);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Menu item not found' });
    }
    
    // Use findByIdAndUpdate with $pull to remove the item
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $pull: { menuItems: { _id: restaurant.menuItems[itemIndex]._id } } },
      { new: true, runValidators: false }
    );
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error creating restaurant:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Set restaurant availability (Restaurant Admin)
router.put('/:id/availability', auth(['restaurant_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Use findByIdAndUpdate to avoid validation issues
    const updatedRestaurant = await Restaurant.findByIdAndUpdate(
      id,
      { $set: { isAvailable: isAvailable } },
      { new: true, runValidators: false }
    );
    
    console.log(`Restaurant ${id} availability updated to ${isAvailable}`);
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error updating restaurant availability:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Toggle menu item availability (Restaurant Admin)
router.put('/:id/menu/:itemId/availability', auth(['restaurant_admin']), async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const { available } = req.body;

    // Check if restaurant exists and user is authorized
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    if (restaurant.ownerId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if menu item exists
    const itemIndex = restaurant.menuItems.findIndex(item => item._id.toString() === itemId);
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Use findOneAndUpdate to avoid validation issues
    // We're using a positional operator $ to update the specific array element
    const updatedRestaurant = await Restaurant.findOneAndUpdate(
      { _id: id, 'menuItems._id': restaurant.menuItems[itemIndex]._id },
      { $set: { 'menuItems.$.available': available } },
      { new: true, runValidators: false }
    );
    
    console.log(`Toggling menu item availability: ${itemId} to ${available}`);
    res.json(updatedRestaurant);
  } catch (error) {
    console.error('Error toggling menu item availability:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// List restaurants (Customer)
router.get('/', auth(['customer', 'restaurant_admin', 'admin']), async (req, res) => {
  try {
    // For customers, only show verified and available restaurants
    if (req.user.role === 'customer') {
      const restaurants = await Restaurant.find({ isVerified: true, isAvailable: true });
      return res.json(restaurants);
    }
    
    // For restaurant_admin, show their own restaurant regardless of status
    if (req.user.role === 'restaurant_admin') {
      const restaurants = await Restaurant.find({ ownerId: req.user.userId });
      return res.json(restaurants);
    }
    
    // For admin, show all restaurants
    if (req.user.role === 'admin') {
      const restaurants = await Restaurant.find({});
      return res.json(restaurants);
    }
    
    res.json([]);
  } catch (error) {
    console.error('Error fetching restaurants:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Get restaurant by owner ID (Restaurant Admin)
router.get('/my-restaurant', auth(['restaurant_admin']), async (req, res) => {
  try {
    const restaurant = await Restaurant.findOne({ ownerId: req.user.userId });
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching restaurant:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// List all restaurants (Admin only)
router.get('/all', auth(['admin']), async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.json(restaurants);
  } catch (error) {
    console.error('Error creating restaurant:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Delete restaurant verification request (Admin only)
router.delete('/:id/verification', auth(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    // Delete the restaurant from the database
    await Restaurant.findByIdAndDelete(id);
    
    res.json({ message: 'Restaurant verification request rejected and removed' });
  } catch (error) {
    console.error('Error creating restaurant:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

// Get restaurant details (Customer)
router.get('/:id', auth(['customer']), async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant || !restaurant.isVerified || !restaurant.isAvailable) {
      return res.status(404).json({ error: 'Restaurant not found or unavailable' });
    }
    
    // Filter out unavailable menu items
    const restaurantData = restaurant.toObject();
    if (restaurantData.menuItems && restaurantData.menuItems.length > 0) {
      restaurantData.menuItems = restaurantData.menuItems.filter(item => item.available !== false);
    }
    
    console.log(`Returning ${restaurantData.menuItems.length} available menu items for restaurant ${id}`);
    res.json(restaurantData);
  } catch (error) {
    console.error('Error fetching restaurant:', error.message, error.stack);
    res.status(500).json({ error: 'Server error', message: error.message, details: error.stack });
  }
});

module.exports = router;