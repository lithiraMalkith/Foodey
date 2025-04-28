import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaHome, FaUtensils, FaShoppingBag, FaUser, FaSignOutAlt, FaSignInAlt, FaUserPlus, FaClipboardList, FaTruck, FaCog } from 'react-icons/fa';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('name');
    const role = localStorage.getItem('role');
    if (token && name && role) {
      setUser({ name, role });
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('role');
    setUser(null);
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center">
          <span className="text-white text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Foodey</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-1">
          {user ? (
            <>
              <div className="px-3 py-1 rounded-full bg-white/10 text-blue-100 text-sm mr-4 flex items-center">
                <FaUser className="mr-2 text-blue-300" />
                <span>{user.name}</span>
              </div>
              
              {user.role === 'customer' && (
                <>
                  <Link to="/restaurants" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaUtensils className="mr-2" />
                    Restaurants
                  </Link>
                  <Link to="/orders" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaShoppingBag className="mr-2" />
                    My Orders
                  </Link>
                  <Link to="/profile" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaUser className="mr-2" />
                    Profile
                  </Link>
                </>
              )}
              
              {user.role === 'restaurant_admin' && (
                <>
                  <Link to="/restaurant-admin" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaCog className="mr-2" />
                    Manage Restaurant
                  </Link>
                  <Link to="/restaurant-orders" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaClipboardList className="mr-2" />
                    Restaurant Orders
                  </Link>
                </>
              )}
              
              {user.role === 'delivery_personnel' && (
                <>
                  <Link to="/delivery-personnel" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaTruck className="mr-2" />
                    My Deliveries
                  </Link>
                  <Link to="/driver-profile" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaUser className="mr-2" />
                    Driver Profile
                  </Link>
                </>
              )}
              
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaCog className="mr-2" />
                    Admin Dashboard
                  </Link>
                  <Link to="/order-assignment" className="px-3 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                    <FaTruck className="mr-2" />
                    Assign Deliveries
                  </Link>
                </>
              )}
              
              <button 
                onClick={handleLogout} 
                className="ml-2 px-4 py-2 rounded-md bg-gradient-to-r from-red-500/80 to-red-600/80 text-white hover:from-red-600/80 hover:to-red-700/80 transition-colors duration-200 flex items-center"
              >
                <FaSignOutAlt className="mr-2" />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="px-4 py-2 rounded-md text-blue-100 hover:bg-white/10 transition-colors duration-200 flex items-center">
                <FaSignInAlt className="mr-2" />
                Login
              </Link>
              <Link to="/register" className="ml-2 px-4 py-2 rounded-md bg-gradient-to-r from-purple-500/80 to-blue-500/80 text-white hover:from-purple-600/80 hover:to-blue-600/80 transition-colors duration-200 flex items-center">
                <FaUserPlus className="mr-2" />
                Register
              </Link>
            </>
          )}
        </div>
        
        {/* Mobile menu button - would need additional state and handlers for a complete implementation */}
        <div className="md:hidden flex items-center">
          <button className="text-white focus:outline-none">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;