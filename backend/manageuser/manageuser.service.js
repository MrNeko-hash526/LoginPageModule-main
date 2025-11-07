const { query } = require('../config/db');

async function getAllUsers(includeDeleted = false) {
  try {
    const deletedFilter = includeDeleted ? '' : 'AND u.bit_deleted_flag = 0';
    const rows = await query(`
      SELECT u.user_id AS _id, u.first_name AS firstName, u.last_name AS lastName, u.email AS username, u.email, u.phone_no,
             COALESCE(GROUP_CONCAT(DISTINCT r.role_name), '') AS role, u.user_group, u.active_inactive_status AS isActive,
             MAX(la.mail_time) AS lastLogin, COALESCE(GROUP_CONCAT(DISTINCT c.company_name), '') AS companies,
             COALESCE(GROUP_CONCAT(DISTINCT r.role_name), '') AS roles, 'CONV' AS userType, 'ALL' AS code,
             COALESCE(MAX(CASE WHEN c.company_status = 1 THEN 'Active' ELSE 'Inactive' END), 'Inactive') AS companyStatus,
             u.bit_deleted_flag AS isDeleted
      FROM users u
      LEFT JOIN user_roles ur ON u.user_id = ur.user_id AND ur.bit_deleted_flag = 0
      LEFT JOIN roles r ON ur.role_id = r.role_id
      LEFT JOIN companies c ON ur.company_id = c.company_id
      LEFT JOIN login_activity la ON u.user_id = la.user_id
      WHERE 1=1 ${deletedFilter}
      GROUP BY u.user_id
    `);
    return rows;
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
}

async function toggleUserStatus(userId, isActive) {
  try {
    await query(`UPDATE users SET active_inactive_status = ? WHERE user_id = ?`, [isActive ? 1 : 0, userId]);
  } catch (error) {
    throw error;
  }
}

async function softDeleteUser(userId) {
  try {
    // Soft delete associated user_roles first
    await query(`UPDATE user_roles SET bit_deleted_flag = 1 WHERE user_id = ?`, [userId]);
    
    // Then soft delete the user
    await query(`UPDATE users SET bit_deleted_flag = 1 WHERE user_id = ?`, [userId]);
  } catch (error) {
    throw error;
  }
}

async function restoreUser(userId) {
  try {
    // Restore associated user_roles
    await query(`UPDATE user_roles SET bit_deleted_flag = 0 WHERE user_id = ?`, [userId]);
    
    // Then restore the user
    await query(`UPDATE users SET bit_deleted_flag = 0 WHERE user_id = ?`, [userId]);
  } catch (error) {
    throw error;
  }
}

async function hardDeleteUser(userId) {
  try {
    // Hard delete user_roles (cascade will handle, but explicit for clarity)
    await query(`DELETE FROM user_roles WHERE user_id = ?`, [userId]);
    
    // Hard delete the user
    await query(`DELETE FROM users WHERE user_id = ?`, [userId]);
  } catch (error) {
    throw error;
  }
}

async function assignRole(userId, companyId, roleId) {
  try {
    // Check if assignment already exists and is not deleted
    const existing = await query(`
      SELECT id FROM user_roles 
      WHERE user_id = ? AND company_id = ? AND role_id = ? AND bit_deleted_flag = 0
    `, [userId, companyId, roleId]);
    
    if (existing.length > 0) {
      return { success: true, message: 'Role already assigned' };
    }

    await query(`
      INSERT INTO user_roles (user_id, company_id, role_id, assigned_at, bit_deleted_flag)
      VALUES (?, ?, ?, NOW(), 0)
    `, [userId, companyId, roleId]);
    
    return { success: true, message: 'Role assigned successfully' };
  } catch (error) {
    throw error;
  }
}

async function removeRole(userId, companyId, roleId) {
  try {
    const result = await query(`
      UPDATE user_roles 
      SET bit_deleted_flag = 1 
      WHERE user_id = ? AND company_id = ? AND role_id = ? AND bit_deleted_flag = 0
    `, [userId, companyId, roleId]);
    
    if (result.affectedRows === 0) {
      throw new Error('Role not found or already deleted');
    }
    return { success: true, message: 'Role removed successfully' };
  } catch (error) {
    throw error;
  }
}

async function getUserRoles(userId) {
  try {
    const rows = await query(`
      SELECT r.role_name, c.company_name, ur.company_id, ur.role_id, ur.bit_deleted_flag
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      JOIN companies c ON ur.company_id = c.company_id
      WHERE ur.user_id = ? AND ur.bit_deleted_flag = 0
    `, [userId]);
    return rows;
  } catch (error) {
    throw error;
  }
}

module.exports = { 
  getAllUsers, 
  toggleUserStatus, 
  softDeleteUser, 
  restoreUser, 
  hardDeleteUser,
  assignRole, 
  removeRole, 
  getUserRoles 
};