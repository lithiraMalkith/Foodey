const jwt = require('jsonwebtoken');

// Authentication middleware
module.exports = (roles = []) => {
  return (req, res, next) => {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token, authorization denied' });
      }
      
      const token = authHeader.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Add user info to request
      req.user = decoded;
      
      // Check if user has required role
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      }
      
      next();
    } catch (err) {
      console.error('Auth middleware error:', err.message);
      res.status(401).json({ error: 'Token is not valid' });
    }
  };
};
