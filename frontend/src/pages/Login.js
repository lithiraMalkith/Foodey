import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaUser, FaLock, FaArrowRight, FaExclamationTriangle } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL}/api/users/login`, {
        email,
        password,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('name', res.data.name);
      localStorage.setItem('role', res.data.role);
      localStorage.setItem('userId', res.data.userId);
      navigate('/');
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
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
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-purple-900/40"></div>
      </div>
      
      {/* Glass-like card */}
      <div className="relative z-10 w-full max-w-md p-8 mx-4 backdrop-blur-lg bg-white/10 rounded-2xl shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-blue-200">Login to your Foodey account</p>
        </div>
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/30 border border-red-500/50 rounded-lg flex items-center">
            <FaExclamationTriangle className="text-red-300 mr-2 flex-shrink-0" />
            <p className="text-red-100 text-sm">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-blue-100 text-sm font-medium">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-blue-300" />
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
                placeholder="Enter your password"
                required
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
          >
            Login
            <FaArrowRight className="ml-2" />
          </button>
          
          <div className="mt-6 text-center">
            <p className="text-blue-100">
              Don't have an account? 
              <Link to="/register" className="text-blue-300 hover:text-blue-100 ml-1 font-medium transition-colors duration-300">
                Sign up
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;