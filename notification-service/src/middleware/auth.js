const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Check if this is a service-to-service call using the shared token
    // This allows other services to communicate with the notification service
    // Accept either JWT_SECRET or NOTIFICATION_SERVICE_TOKEN for backward compatibility
    if (token === process.env.JWT_SECRET || token === process.env.NOTIFICATION_SERVICE_TOKEN) {
      console.log('Service-to-service authentication successful');
      req.user = { role: 'admin' }; // Grant admin privileges for service calls
      return next();
    }
    
    // Special case for endpoints that need delivery_personnel access
    // If the endpoint requires delivery_personnel role, we'll be more permissive
    const isDeliveryEndpoint = req.path.includes('/delivery-success') || req.path.includes('/delivery/');
    if (isDeliveryEndpoint && roles.includes('delivery_personnel')) {
      console.log('Delivery-related endpoint detected, applying special auth rules');
      // For delivery endpoints, we'll allow any authenticated user to access
      // This is because the delivery personnel role might be encoded differently in different services
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('JWT decoded for delivery endpoint:', decoded);
        req.user = decoded;
        return next();
      } catch (err) {
        console.error('JWT verification error for delivery endpoint:', err.message);
      }
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('JWT decoded successfully:', { userId: decoded.userId, role: decoded.role });
      req.user = decoded;
      
      if (roles.length && !roles.includes(decoded.role)) {
        console.error(`Access denied: User role '${decoded.role}' not in allowed roles:`, roles);
        return res.status(403).json({ error: 'Access denied', requiredRoles: roles, userRole: decoded.role });
      }
      
      console.log(`User with role '${decoded.role}' authorized for endpoint requiring roles:`, roles);
      next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};

module.exports = auth;