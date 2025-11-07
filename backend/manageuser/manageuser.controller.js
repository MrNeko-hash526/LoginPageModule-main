const { 
  getAllUsers, 
  toggleUserStatus, 
  softDeleteUser, 
  restoreUser, 
  hardDeleteUser,
  assignRole,
  removeRole,
  getUserRoles
} = require('./manageuser.service');

// Get all users (with optional includeDeleted query param, and pagination)
const getUsers = async (req, res) => {
  try {
    const { includeDeleted = false, page, limit } = req.query;
    const { users, total } = await getAllUsers(includeDeleted === 'true', page ? parseInt(page) : null, limit ? parseInt(limit) : null);
    res.json({ success: true, users, total });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle user active/inactive status
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean' });
    }
    await toggleUserStatus(id, isActive);
    res.json({ success: true, message: 'User status updated' });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Soft delete a user
const softDeleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    await softDeleteUser(id);
    res.json({ success: true, message: 'User soft deleted' });
  } catch (error) {
    console.error('Error soft deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Restore a soft-deleted user
const restoreUserController = async (req, res) => {
  try {
    const { id } = req.params;
    await restoreUser(id);
    res.json({ success: true, message: 'User restored' });
  } catch (error) {
    console.error('Error restoring user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Hard delete a user (permanent)
const hardDeleteUserController = async (req, res) => {
  try {
    const { id } = req.params;
    await hardDeleteUser(id);
    res.json({ success: true, message: 'User permanently deleted' });
  } catch (error) {
    console.error('Error hard deleting user:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all roles for a specific user
const getUserRolesController = async (req, res) => {
  try {
    const { id } = req.params;
    const roles = await getUserRoles(id);
    res.json({ success: true, roles });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Assign a role to a user
const assignUserRoleController = async (req, res) => {
  try {
    const { id } = req.params;
    const { companyId, roleId } = req.body;
    if (!companyId || !roleId) {
      return res.status(400).json({ success: false, message: 'companyId and roleId are required' });
    }
    const result = await assignRole(id, companyId, roleId);
    res.json(result);
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

// Remove a role from a user
const removeUserRoleController = async (req, res) => {
  try {
    const { id, roleId } = req.params;
    const { companyId } = req.body;
    if (!companyId) {
      return res.status(400).json({ success: false, message: 'companyId is required' });
    }
    const result = await removeRole(id, companyId, roleId);
    res.json(result);
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

module.exports = { 
  getUsers, 
  updateUserStatus, 
  softDeleteUser: softDeleteUserController, 
  restoreUser: restoreUserController, 
  hardDeleteUser: hardDeleteUserController,
  getUserRoles: getUserRolesController,
  assignUserRole: assignUserRoleController,
  removeUserRole: removeUserRoleController
};

