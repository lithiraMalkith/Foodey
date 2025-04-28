import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUser, FaMapMarkerAlt, FaEnvelope, FaPhone, FaIdCard, FaPlus, FaEdit, FaTrash, FaCheck, FaExclamationTriangle, FaHome, FaCity, FaMapPin, FaRegStar, FaStar } from 'react-icons/fa';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form states
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    isDefault: false
  });

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUser(res.data);
      setAddresses(res.data.addresses || []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch profile');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm({
      ...addressForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const resetForm = () => {
    setAddressForm({
      street: '',
      city: '',
      state: '',
      zipCode: '',
      isDefault: false
    });
    setEditingAddressId(null);
    setShowAddressForm(false);
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/address`,
        addressForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses(res.data.addresses);
      setSuccessMessage('Address added successfully!');
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add address');
    }
  };

  const handleUpdateAddress = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/address/${editingAddressId}`,
        addressForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses(res.data.addresses);
      setSuccessMessage('Address updated successfully!');
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update address');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.delete(
        `${process.env.REACT_APP_API_BASE_URL}/api/users/address/${addressId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAddresses(res.data.addresses);
      setSuccessMessage('Address deleted successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete address');
    }
  };

  const handleEditAddress = (address) => {
    setAddressForm({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      isDefault: address.isDefault
    });
    setEditingAddressId(address._id);
    setShowAddressForm(true);
  };

  if (loading) return (
    <div className="container mx-auto flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2 flex items-center">
        <FaUser className="text-blue-600 mr-3" />
        My Profile
      </h2>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaExclamationTriangle className="text-red-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-md shadow-sm flex items-center">
          <FaCheck className="text-green-500 mr-3 flex-shrink-0" />
          <p className="font-medium">{successMessage}</p>
        </div>
      )}
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Information Card */}
        <div className="md:col-span-1">
          {user && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white">
                <h3 className="font-bold text-xl flex items-center">
                  <FaIdCard className="mr-2" /> Personal Info
                </h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <FaUser className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium text-gray-800">{user.name}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-purple-100 p-2 rounded-full mr-3">
                    <FaEnvelope className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-800">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-green-100 p-2 rounded-full mr-3">
                    <FaIdCard className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Role</p>
                    <p className="font-medium text-gray-800 capitalize">{user.role}</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="bg-yellow-100 p-2 rounded-full mr-3">
                    <FaPhone className="text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium text-gray-800">{user.phone || 'Not provided'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Addresses Section */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 px-6 py-4 text-white flex justify-between items-center">
              <h3 className="font-bold text-xl flex items-center">
                <FaMapMarkerAlt className="mr-2" /> My Addresses
              </h3>
              {!showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="bg-white text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center hover:bg-green-50 transition-colors"
                >
                  <FaPlus className="mr-1" /> Add Address
                </button>
              )}
            </div>
            
            <div className="p-6">
              {showAddressForm && (
                <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                  <h4 className="text-lg font-semibold mb-4 flex items-center text-gray-800">
                    {editingAddressId ? (
                      <><FaEdit className="text-blue-600 mr-2" /> Edit Address</>
                    ) : (
                      <><FaPlus className="text-green-600 mr-2" /> Add New Address</>
                    )}
                  </h4>
                  
                  <form onSubmit={editingAddressId ? handleUpdateAddress : handleAddAddress} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-700 font-medium mb-2 flex items-center">
                          <FaHome className="text-gray-500 mr-2" /> Street Address
                        </label>
                        <input
                          type="text"
                          name="street"
                          value={addressForm.street}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="123 Main St"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2 flex items-center">
                          <FaCity className="text-gray-500 mr-2" /> City
                        </label>
                        <input
                          type="text"
                          name="city"
                          value={addressForm.city}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="Cityville"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2 flex items-center">
                          <FaMapPin className="text-gray-500 mr-2" /> State
                        </label>
                        <input
                          type="text"
                          name="state"
                          value={addressForm.state}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="State"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-2 flex items-center">
                          <FaMapPin className="text-gray-500 mr-2" /> ZIP Code
                        </label>
                        <input
                          type="text"
                          name="zipCode"
                          value={addressForm.zipCode}
                          onChange={handleInputChange}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                          placeholder="12345"
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="flex items-center text-gray-700">
                        <input
                          type="checkbox"
                          name="isDefault"
                          checked={addressForm.isDefault}
                          onChange={handleInputChange}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="flex items-center">
                          {addressForm.isDefault ? <FaStar className="text-yellow-500 mr-1" /> : <FaRegStar className="text-gray-400 mr-1" />}
                          Set as default address
                        </span>
                      </label>
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-2 px-4 rounded-md flex items-center justify-center transition-all duration-200 shadow-sm"
                      >
                        {editingAddressId ? (
                          <><FaEdit className="mr-2" /> Update Address</>
                        ) : (
                          <><FaPlus className="mr-2" /> Add Address</>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md flex items-center justify-center transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {addresses.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FaMapMarkerAlt className="mx-auto text-4xl mb-3 opacity-30" />
                  <p>No addresses added yet. Add your first address to make ordering easier!</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {addresses.map((address) => (
                    <div key={address._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <div className={`p-2 rounded-full mr-3 ${address.isDefault ? 'bg-yellow-100' : 'bg-gray-100'}`}>
                            <FaMapMarkerAlt className={address.isDefault ? 'text-yellow-600' : 'text-gray-500'} />
                          </div>
                          <div>
                            {address.isDefault && (
                              <div className="flex items-center mb-1">
                                <FaStar className="text-yellow-500 mr-1" />
                                <span className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                                  Default Address
                                </span>
                              </div>
                            )}
                            <p className="font-medium text-gray-800">{address.street}</p>
                            <p className="text-gray-600">{address.city}, {address.state} {address.zipCode}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAddress(address)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors"
                            title="Edit Address"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(address._id)}
                            className="text-red-600 hover:text-red-800 p-1 rounded-full hover:bg-red-50 transition-colors"
                            title="Delete Address"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
