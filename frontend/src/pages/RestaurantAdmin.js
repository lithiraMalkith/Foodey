import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStore, FaUtensils, FaMapMarkerAlt, FaInfoCircle, FaImage, FaPlus, FaTrash, FaExclamationTriangle, FaCheckCircle, FaDollarSign, FaClipboardList, FaEdit, FaSave, FaTimes, FaToggleOn, FaToggleOff, FaEye, FaEyeSlash } from 'react-icons/fa';

const RestaurantAdmin = () => {
  const [restaurant, setRestaurant] = useState(null);
  const [newItem, setNewItem] = useState({ name: '', price: '', description: '', picture: '', picturePreview: '' });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState({
    name: '',
    location: '',
    description: '',
    picture: '',
    picturePreview: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Try to get userId from localStorage first
        let userId = localStorage.getItem('userId');
        
        // If userId is not in localStorage, try to extract it from the JWT token
        if (!userId && token) {
          try {
            // Extract the payload from JWT token (middle part between dots)
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(window.atob(base64));
            
            // Get userId from token payload and store it in localStorage for future use
            if (payload.userId) {
              userId = payload.userId;
              localStorage.setItem('userId', userId);
              console.log('Extracted userId from token:', userId);
            }
          } catch (tokenErr) {
            console.error('Error extracting userId from token:', tokenErr);
          }
        }
        
        console.log('Current userId:', userId);
        
        // Use the new dedicated endpoint for restaurant admins
        try {
          const myRestaurantRes = await axios.get(`${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/my-restaurant`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log('Restaurant admin restaurant:', myRestaurantRes.data);
          setRestaurant(myRestaurantRes.data);
          return; // Exit early if we found the restaurant
        } catch (myRestaurantErr) {
          // If the endpoint fails or returns 404, fall back to the old method
          console.log('Could not find restaurant with my-restaurant endpoint, falling back to list');
        }
        
        // Fallback to the old method
        const res = await axios.get(`${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Restaurants received:', res.data);
        if (res.data.length > 0) {
          console.log('First restaurant ownerId:', res.data[0].ownerId);
        }
        
        // If we have a userId, try to find the restaurant
        if (userId) {
          // Try with strict equality first
          let userRestaurant = res.data.find(r => r.ownerId === userId);
          
          // If not found, try with string comparison
          if (!userRestaurant) {
            console.log('Restaurant not found with strict equality, trying string comparison');
            userRestaurant = res.data.find(r => String(r.ownerId) === String(userId));
          }
          
          console.log('Found restaurant:', userRestaurant);
          setRestaurant(userRestaurant);
        } else {
          console.log('No userId available, cannot find restaurant');
        }
      } catch (err) {
        console.error('Error fetching restaurant:', err);
        setError(err.response?.data?.error || 'Failed to fetch restaurant');
      }
    };
    fetchRestaurant();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, picture: reader.result, picturePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: form.name,
        location: form.location,
        description: form.description,
        picture: form.picture
      };
      const res = await axios.post(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurant(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMenuItemPictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewItem(prev => ({ ...prev, picture: reader.result, picturePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/${restaurant._id}/menu`,
        newItem,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurant(res.data);
      setNewItem({ name: '', price: '', description: '', picture: '', picturePreview: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/${restaurant._id}/menu/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurant(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };
  
  // Toggle menu item availability
  const handleToggleItemAvailability = async (itemId, currentAvailability) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/${restaurant._id}/menu/${itemId}/availability`,
        { available: !currentAvailability },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurant(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update item availability');
    }
  };
  
  // Toggle restaurant availability
  const handleToggleRestaurantAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/${restaurant._id}/availability`,
        { isAvailable: !restaurant.isAvailable },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRestaurant(res.data);
      
      // Show success message
      const status = res.data.isAvailable ? 'available' : 'unavailable';
      setSuccessMessage(`Restaurant is now ${status}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update restaurant availability');
    }
  };
  
  // State for editing menu items
  const [editingItem, setEditingItem] = useState(null);
  const [editItemForm, setEditItemForm] = useState({
    name: '',
    price: '',
    description: '',
    picture: '',
    picturePreview: ''
  });
  
  // Start editing a menu item
  const handleStartEditItem = (item) => {
    setEditingItem(item._id);
    setEditItemForm({
      name: item.name,
      price: item.price,
      description: item.description || '',
      picture: '',
      picturePreview: item.picture || ''
    });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditItemForm({
      name: '',
      price: '',
      description: '',
      picture: '',
      picturePreview: ''
    });
  };
  
  // Handle edit form input changes
  const handleEditItemChange = (e) => {
    const { name, value } = e.target;
    setEditItemForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle edit item picture change
  const handleEditItemPictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditItemForm(prev => ({ ...prev, picture: reader.result, picturePreview: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Save edited menu item
  const handleSaveEditItem = async () => {
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: editItemForm.name,
        price: parseFloat(editItemForm.price),
        description: editItemForm.description
      };
      
      // Only include picture if it was changed
      if (editItemForm.picture) {
        payload.picture = editItemForm.picture;
      }
      
      const res = await axios.put(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/${restaurant._id}/menu/${editingItem}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setRestaurant(res.data);
      handleCancelEdit(); // Reset the form
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update menu item');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaStore className="text-blue-600 mr-3" />
        Restaurant Admin
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      
      {!restaurant ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 max-w-2xl mx-auto mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
            <h3 className="font-bold text-xl flex items-center">
              <FaStore className="mr-2" /> Create Your Restaurant
            </h3>
          </div>
          
          <div className="p-6">
            <form onSubmit={handleCreateRestaurant} className="space-y-4">
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Restaurant Name<span className="text-red-500 ml-1">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUtensils className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleInputChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="e.g. Delicious Bites"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Location<span className="text-red-500 ml-1">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaMapMarkerAlt className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    placeholder="e.g. 123 Main Street, City"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Description</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <FaInfoCircle className="text-gray-400" />
                  </div>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Tell customers about your restaurant"
                  ></textarea>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2 flex items-center">
                  <FaImage className="text-gray-500 mr-2" /> Restaurant Picture
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    className="w-full"
                  />
                  {!form.picturePreview && (
                    <p className="text-sm text-gray-500 mt-1">Upload an image of your restaurant</p>
                  )}
                  {form.picturePreview && (
                    <div className="mt-3">
                      <img src={form.picturePreview} alt="Preview" className="h-40 mx-auto rounded-md object-cover" />
                    </div>
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-md"
                disabled={isSubmitting}
              >
                <FaStore className="mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Restaurant'}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className={`${restaurant.isAvailable !== false ? 'bg-gradient-to-r from-blue-600 to-purple-600' : 'bg-gradient-to-r from-gray-600 to-gray-700'} px-6 py-4 text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <h2 className="text-xl font-bold">{restaurant.name}</h2>
                  <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${restaurant.isAvailable !== false ? 'bg-green-400 text-green-900' : 'bg-red-400 text-red-900'}`}>
                    {restaurant.isAvailable !== false ? 'Open' : 'Closed'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!restaurant.isVerified && (
                    <span className="bg-yellow-400 text-yellow-900 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                      <FaExclamationTriangle className="mr-1" /> Pending Verification
                    </span>
                  )}
                  {restaurant.isVerified && (
                    <span className="bg-green-400 text-green-900 text-xs px-2 py-1 rounded-full font-medium flex items-center">
                      <FaCheckCircle className="mr-1" /> Verified
                    </span>
                  )}
                  <button
                    onClick={handleToggleRestaurantAvailability}
                    className={`${restaurant.isAvailable !== false ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white px-3 py-1 rounded-full text-xs font-medium flex items-center transition-colors`}
                    title={restaurant.isAvailable !== false ? 'Mark restaurant as closed' : 'Mark restaurant as open'}
                  >
                    {restaurant.isAvailable !== false ? (
                      <>
                        <FaEye className="mr-1" /> Set as Closed
                      </>
                    ) : (
                      <>
                        <FaEyeSlash className="mr-1" /> Set as Open
                      </>
                    )}
                  </button>
                </div>
              </div>
              <p className="text-blue-100 flex items-center mt-1">
                <FaMapMarkerAlt className="mr-1" /> {restaurant.location}
              </p>
            </div>
            
            <div className="p-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 mb-6">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <FaInfoCircle className="text-blue-500 mr-2" /> Restaurant Description
                </h3>
                <p className="text-gray-700">{restaurant.description || 'No description provided.'}</p>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <h3 className="font-medium text-gray-800 mb-3 flex items-center">
                  <FaPlus className="text-purple-500 mr-2" /> Add New Menu Item
                </h3>
                
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Item Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaUtensils className="text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Margherita Pizza"
                        value={newItem.name}
                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 font-medium mb-2">Price</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaDollarSign className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        placeholder="e.g. 12.99"
                        value={newItem.price}
                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2">Description</label>
                  <input
                    type="text"
                    placeholder="Brief description of the item"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 font-medium mb-2 flex items-center">
                    <FaImage className="text-gray-500 mr-2" /> Item Picture
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center hover:bg-gray-50 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMenuItemPictureChange}
                      className="w-full"
                    />
                    {!newItem.picturePreview && (
                      <p className="text-sm text-gray-500 mt-1">Upload an image of this menu item</p>
                    )}
                    {newItem.picturePreview && (
                      <div className="mt-3">
                        <img src={newItem.picturePreview} alt="Menu Item Preview" className="h-32 mx-auto rounded-md object-cover" />
                      </div>
                    )}
                  </div>
                </div>
                
                <button 
                  onClick={handleAddItem} 
                  className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                >
                  <FaPlus className="mr-2" />
                  Add Menu Item
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 text-white">
              <h3 className="font-bold text-xl flex items-center">
                <FaClipboardList className="mr-2" /> Menu Items
              </h3>
            </div>
            
            <div className="p-6">
              {restaurant.menuItems && restaurant.menuItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaUtensils className="mx-auto text-4xl mb-3 opacity-30" />
                  <p>No menu items yet. Add your first item above!</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {restaurant.menuItems && restaurant.menuItems.map((item) => (
                    <div key={item._id} className={`bg-white rounded-lg border ${item.available === false ? 'border-red-200 bg-red-50' : 'border-gray-200'} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
                      {editingItem === item._id ? (
                        // Edit mode
                        <div className="p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-blue-600">Edit Menu Item</h4>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleSaveEditItem}
                                className="text-green-500 hover:text-green-700 p-1 rounded-full hover:bg-green-50 transition-colors"
                                title="Save changes"
                              >
                                <FaSave />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-50 transition-colors"
                                title="Cancel editing"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                              <input
                                type="text"
                                name="name"
                                value={editItemForm.name}
                                onChange={handleEditItemChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                              <input
                                type="number"
                                name="price"
                                value={editItemForm.price}
                                onChange={handleEditItemChange}
                                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          </div>
                          
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <input
                              type="text"
                              name="description"
                              value={editItemForm.description}
                              onChange={handleEditItemChange}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          
                          <div className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Picture</label>
                            <div className="flex items-center space-x-3">
                              {editItemForm.picturePreview && (
                                <img src={editItemForm.picturePreview} alt="Preview" className="h-16 w-16 object-cover rounded" />
                              )}
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleEditItemPictureChange}
                                className="text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <div className="flex">
                          {item.picture ? (
                            <div className="w-1/3 relative">
                              <img src={item.picture} alt={item.name} className="w-full h-full object-cover" />
                              {item.available === false && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">Unavailable</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="w-1/3 bg-gray-200 flex items-center justify-center relative">
                              <FaUtensils className="text-gray-400 text-3xl" />
                              {item.available === false && (
                                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">Unavailable</span>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="w-2/3 p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-bold text-gray-800">{item.name}</h4>
                                <p className="text-green-600 font-medium">${item.price}</p>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleToggleItemAvailability(item._id, item.available)}
                                  className={`${item.available !== false ? 'text-green-500 hover:text-green-700' : 'text-red-500 hover:text-red-700'} p-1 rounded-full hover:bg-gray-50 transition-colors`}
                                  title={item.available !== false ? 'Mark as unavailable' : 'Mark as available'}
                                >
                                  {item.available !== false ? <FaEye /> : <FaEyeSlash />}
                                </button>
                                <button
                                  onClick={() => handleStartEditItem(item)}
                                  className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors"
                                  title="Edit item"
                                >
                                  <FaEdit />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item._id)}
                                  className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                  title="Delete item"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                            <p className="text-gray-600 text-sm mt-2">{item.description}</p>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.available !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {item.available !== false ? 'Available' : 'Unavailable'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantAdmin;
