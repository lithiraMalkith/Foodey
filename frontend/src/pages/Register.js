import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaEnvelope, FaUserTag, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users/register`, {
        email,
        password,
        name,
        role,
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      {/* Background with blur effect */}
      <div 
        className="fixed inset-0 bg-cover" 
        style={{
          backgroundImage: `url('/grocery-store.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%', /* Adjusted to move image down */
          filter: 'blur(4px)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/40 to-blue-900/40"></div>
      </div>
      
      {/* Glass-like card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-blue-200">Join Foodey and start ordering</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/30 border border-red-500/50 rounded-lg flex items-center">
            <FaExclamationTriangle className="text-red-300 mr-2 flex-shrink-0" />
            <p className="text-red-100 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-blue-100 text-sm font-medium">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-blue-300" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-300/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-blue-100 text-sm font-medium">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-blue-300" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-300/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-blue-100 text-sm font-medium">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-blue-300" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-300/30 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Create a password"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="block text-blue-100 text-sm font-medium">I am a...</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUserTag className="text-blue-300" />
              </div>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-blue-300/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 appearance-none"
              >
                <option value="customer" className="bg-blue-900 text-white">Customer</option>
                <option value="restaurant_admin" className="bg-blue-900 text-white">Restaurant Admin</option>
                <option value="delivery_personnel" className="bg-blue-900 text-white">Delivery Personnel</option>
                <option value="admin" className="bg-blue-900 text-white">Admin</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-blue-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full mt-6 py-3 px-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-medium rounded-lg flex items-center justify-center hover:from-purple-700 hover:to-blue-600 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
          >
            Create Account
            <FaArrowRight className="ml-2" />
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-blue-100">
              Already have an account? 
              <Link to="/login" className="text-blue-300 hover:text-blue-100 ml-1 font-medium transition-colors duration-300">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;