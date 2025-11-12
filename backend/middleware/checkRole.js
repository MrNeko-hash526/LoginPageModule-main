/**
 * Middleware to check if user has any of the allowed roles
 * @param {string[]} allowedRoles - Array of roles that can access the route
 */
function checkRole(allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.user?.userTypes || [];
    
    const hasAccess = allowedRoles.some(allowedRole => 
      userRoles.some(userRole => userRole.toLowerCase().includes(allowedRole.toLowerCase()))
    );

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    next();
  };
}

module.exports = { checkRole };