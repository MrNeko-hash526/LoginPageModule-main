const { query } = require('../config/db');

async function getAllUsers(includeDeleted = false, page = null, limit = null) {
  try {
    const deletedFilter = includeDeleted ? '' : 'AND u.bit_deleted_flag = 0';
    
    // Simple SQL - get users first
    let sql = `
      SELECT 
        u.user_id AS _id,
        u.first_name,
        u.last_name, 
        u.email,
        u.phone_no,
        u.user_group,
        u.active_inactive_status,
        u.bit_deleted_flag AS isDeleted,
        u.created_at
      FROM users u
      WHERE 1=1 ${deletedFilter}
      ORDER BY u.created_at DESC
    `;
    
    let countSql = `
      SELECT COUNT(u.user_id) AS total
      FROM users u  
      WHERE 1=1 ${deletedFilter}
    `;

    if (page && limit) {
      const offset = (page - 1) * limit;
      sql += ` LIMIT ${limit} OFFSET ${offset}`;
    }

    const [rows, countRows] = await Promise.all([
      query(sql),
      query(countSql)
    ]);

    console.log('🔧 Raw DB rows sample:', rows[0]);

    // For each user, get their roles and user groups
    const users = [];
    for (const r of rows) {
      // Get roles for this user
      const userRoles = await query(`
        SELECT r.role_name 
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.role_id  
        WHERE ur.user_id = ? AND ur.bit_deleted_flag = 0
      `, [r._id]);

      // Get user groups for this user (from user_group_assignments table)
      const userGroups = await query(`
        SELECT ug.group_name
        FROM user_group_assignments uga
        JOIN user_groups ug ON uga.group_id = ug.group_id
        WHERE uga.user_id = ? AND uga.bit_deleted_flag = 0 AND ug.is_active = 1
      `, [r._id]);

      // Get companies for this user
      const userCompanies = await query(`
        SELECT DISTINCT c.company_name
        FROM user_roles ur
        JOIN companies c ON ur.company_id = c.company_id
        WHERE ur.user_id = ? AND ur.bit_deleted_flag = 0
      `, [r._id]);

      // Parse user_group from users table (if it exists as JSON)
      let parsedUserGroup = '';
      try {
        if (r.user_group) {
          const parsed = JSON.parse(r.user_group);
          parsedUserGroup = Array.isArray(parsed) ? parsed.join(', ') : parsed.toString();
        }
      } catch (e) {
        parsedUserGroup = r.user_group || '';
      }

      // Combine user_groups table data with users.user_group column
      const allUserGroups = [
        ...userGroups.map(ug => ug.group_name),
        ...(parsedUserGroup ? [parsedUserGroup] : [])
      ].filter(g => g.trim()).join(', ');

      users.push({
        _id: r._id,
        firstName: r.first_name || '',
        lastName: r.last_name || '',
        username: r.email || '',
        email: r.email || '',
        phone_no: r.phone_no || '',
        user_group: allUserGroups || '',
        // Convert 1/0 to true/false
        isActive: Number(r.active_inactive_status) === 1,
        lastLogin: null, // You can add login_activity query if needed
        companies: userCompanies.map(c => c.company_name),
        role: userRoles.map(ur => ur.role_name).join(', '), 
        roles: userRoles.map(ur => ur.role_name),
        userType: 'CONV',
        code: 'ALL', 
        companyStatus: 'Active',
        isDeleted: Number(r.isDeleted) === 1,
        created_at: r.created_at
      });
    }

    console.log('🔧 Normalized users sample:', users[0]);

    return {
      users,
      total: (countRows && countRows[0] && countRows[0].total) || 0
    };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    throw error;
  }
}

async function toggleUserStatus(userId, isActive) {
  try {
    console.log('🔧 Toggling user status:', { userId, isActive });
    const result = await query(
      `UPDATE users SET active_inactive_status = ? WHERE user_id = ?`, 
      [isActive ? 1 : 0, userId]
    );
    console.log('🔧 Update result:', result);
    return result;
  } catch (error) {
    console.error('Error in toggleUserStatus:', error);
    throw error;
  }
}

async function softDeleteUser(userId) {
  try {
    await query(`UPDATE user_roles SET bit_deleted_flag = 1 WHERE user_id = ?`, [userId]);
    await query(`UPDATE user_group_assignments SET bit_deleted_flag = 1 WHERE user_id = ?`, [userId]);
    await query(`UPDATE users SET bit_deleted_flag = 1 WHERE user_id = ?`, [userId]);
  } catch (error) {
    throw error;
  }
}

async function restoreUser(userId) {
  try {
    await query(`UPDATE user_roles SET bit_deleted_flag = 0 WHERE user_id = ?`, [userId]);
    await query(`UPDATE user_group_assignments SET bit_deleted_flag = 0 WHERE user_id = ?`, [userId]);
    await query(`UPDATE users SET bit_deleted_flag = 0 WHERE user_id = ?`, [userId]);
  } catch (error) {
    throw error;
  }
}

async function hardDeleteUser(userId) {
  try {
    await query(`DELETE FROM user_roles WHERE user_id = ?`, [userId]);
    await query(`DELETE FROM user_group_assignments WHERE user_id = ?`, [userId]);
    await query(`DELETE FROM users WHERE user_id = ?`, [userId]);
  } catch (error) {
    throw error;
  }
}

async function assignRole(userId, companyId, roleId) {
  try {
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
      SELECT r.role_name, c.company_name, ur.company_id, ur.role_id
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