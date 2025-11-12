const { checkRole } = require('../middleware/checkRole'); // Import checkRole

const requireAdminOrManager = checkRole(['Admin', 'Executive', 'Manager']); // Now uses checkRole

module.exports = { requireAdminOrManager };