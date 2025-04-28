import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStore, FaUsers, FaClipboardList, FaTruck, FaCheckCircle, FaExclamationTriangle, FaTimes,FaEdit, FaTrash, FaUserEdit } from 'react-icons/fa';
import DeliveryAssignment from './DeliveryAssignment';
import OrderManagement from './OrderManagement';

const Admin = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants', 'users', 'orders', 'deliveries'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch all restaurants using the admin-specific endpoint
      const restaurantsRes = await axios.get(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Filter unverified restaurants
      const unverifiedRestaurants = restaurantsRes.data.filter(r => !r.isVerified);
      setRestaurants(unverifiedRestaurants);
      
      // Fetch all users
      const usersRes = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(usersRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch data');
    }
  };

  const handleVerifyRestaurant = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_ADMIN_API_URL}/api/admin/restaurants/${id}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('Restaurant verified successfully!');
      // Refresh data
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify restaurant');
    }
  };

  const handleRejectRestaurant = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_RESTAURANT_API_URL}/api/restaurants/${id}/verification`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('Restaurant verification rejected successfully!');
      // Refresh data
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reject restaurant verification');
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('User deleted successfully!');
      // Refresh data
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleApproveUser = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('User approved successfully!');
      // Refresh data
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to approve user');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role
    });
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/${editingUser._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSuccessMessage('User updated successfully!');
      setEditingUser(null);
      // Refresh data
      fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Admin Dashboard</h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-500 mr-3 flex-shrink-0" />
            <p className="font-medium">{successMessage}</p>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-lg shadow-sm mb-6 overflow-hidden border border-gray-200">
        <div className="flex flex-wrap">
          <button
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${activeTab === 'restaurants' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('restaurants')}
          >
            <FaStore className={`mr-2 ${activeTab === 'restaurants' ? 'text-white' : 'text-blue-500'}`} />
            Restaurants
          </button>
          <button
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('users')}
          >
            <FaUsers className={`mr-2 ${activeTab === 'users' ? 'text-white' : 'text-blue-500'}`} />
            Users
          </button>
          <button
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${activeTab === 'orders' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('orders')}
          >
            <FaClipboardList className={`mr-2 ${activeTab === 'orders' ? 'text-white' : 'text-blue-500'}`} />
            Orders
          </button>
          <button
            className={`flex items-center px-6 py-3 font-medium transition-colors duration-200 ${activeTab === 'deliveries' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
            onClick={() => setActiveTab('deliveries')}
          >
            <FaTruck className={`mr-2 ${activeTab === 'deliveries' ? 'text-white' : 'text-blue-500'}`} />
            Deliveries
          </button>
        </div>
      </div>
      
      {activeTab === 'restaurants' && (
        <div className="mb-8">
          <div className="flex items-center mb-4 border-b pb-3">
            <FaStore className="text-blue-600 text-xl mr-2" />
            <h3 className="text-xl font-bold text-gray-800">Restaurants Pending Verification</h3>
          </div>
          
          {restaurants.length === 0 ? (
            <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
              <FaExclamationTriangle className="text-yellow-400 text-4xl mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No restaurants pending verification</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {restaurants.map((restaurant) => (
                <div key={restaurant._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3 text-white">
                    <h4 className="font-medium">{restaurant.name}</h4>
                  </div>
                  <div className="p-4">
                    <div className="mb-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-blue-50 p-2 rounded">
                          <p className="text-gray-500">Owner ID</p>
                          <p className="font-medium text-gray-800">{restaurant.ownerId}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded">
                          <p className="text-gray-500">Menu Items</p>
                          <p className="font-medium text-gray-800">{restaurant.menuItems?.length || 0}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleVerifyRestaurant(restaurant._id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                      >
                        <FaCheckCircle className="mr-2" />
                        Verify
                      </button>
                      <button
                        onClick={() => handleRejectRestaurant(restaurant._id)}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                      >
                        <FaTimes className="mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'users' && (
      <div className="mb-8">
        <div className="flex items-center mb-4 border-b pb-3">
          <FaUsers className="text-blue-600 text-xl mr-2" />
          <h3 className="text-xl font-bold text-gray-800">Manage Users</h3>
        </div>
        
        {editingUser && (
          <div className="mb-6 p-6 border rounded-lg bg-white shadow-sm">
            <h4 className="text-lg font-semibold mb-4 flex items-center">
              <FaUserEdit className="text-blue-500 mr-2" />
              Edit User
            </h4>
            <form onSubmit={handleUpdateUser}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none"
                    required
                  >
                    <option value="">Select Role</option>
                    <option value="customer">Customer</option>
                    <option value="restaurant_admin">Restaurant Admin</option>
                    <option value="delivery_personnel">Delivery Personnel</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center transition-colors duration-200"
                >
                  <FaCheckCircle className="mr-2" />
                  Update User
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center transition-colors duration-200"
                >
                  <FaTimes className="mr-2" />
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
        
        {users.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-lg text-center border border-gray-200">
            <FaExclamationTriangle className="text-yellow-400 text-4xl mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {users.map((user) => (
              <div key={user._id} className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300">
                <div className={`px-4 py-3 text-white ${user.role === 'admin' ? 'bg-purple-600' : user.role === 'restaurant_admin' ? 'bg-green-600' : user.role === 'delivery_personnel' ? 'bg-yellow-600' : 'bg-blue-600'}`}>
                  <h4 className="font-medium flex items-center justify-between">
                    <span>{user.name}</span>
                    {user.role !== 'customer' && (
                      <span className={`text-xs px-2 py-1 rounded-full ${user.approved ? 'bg-green-500' : 'bg-yellow-500'}`}>
                        {user.approved ? 'Approved' : 'Pending Approval'}
                      </span>
                    )}
                  </h4>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <div className="space-y-2">
                      <p className="text-gray-700"><span className="font-medium">Email:</span> {user.email}</p>
                      <p className="text-gray-700"><span className="font-medium">Role:</span> {user.role.replace('_', ' ').charAt(0).toUpperCase() + user.role.replace('_', ' ').slice(1)}</p>
                      <p className="text-gray-700"><span className="font-medium">Created:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleEditUser(user)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                    >
                      <FaEdit className="mr-2" />
                      Edit
                    </button>
                    {user.role !== 'customer' && !user.approved && (
                      <button
                        onClick={() => handleApproveUser(user._id)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                      >
                        <FaCheckCircle className="mr-2" />
                        Approve
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                    >
                      <FaTrash className="mr-2" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
      
      {activeTab === 'orders' && <OrderManagement />}
      
      {activeTab === 'deliveries' && <DeliveryAssignment />}
    </div>
  );
};

export default Admin;
