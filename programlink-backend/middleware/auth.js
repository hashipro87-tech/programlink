// auth.js — JWT authentication middleware
// Attaches the decoded user to req.user so route handlers can use it
// Also exports role-checking helpers for route-level authorization

const jwt = require('jsonwebtoken');

// Verify the JWT token sent in the Authorization header
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role, organizationId, sponsorId }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
};

// Role-based access control — pass one or more allowed roles
// e.g. authorizeRoles('sponsor', 'coordinator')
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!roles.includes(req.user.role)) {
      console.log(`[authorizeRoles] DENIED: role="${req.user.role}", allowed=[${roles.join(',')}], path=${req.path}`);
      return res.status(403).json({
        error: 'You do not have permission to access this resource'
      });
    }
    next();
  };
};

module.exports = { authenticate, authorizeRoles };
