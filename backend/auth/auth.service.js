const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

// Updated: Find user by email (global, no company filter)
async function findUserByEmail(email, companyId = null) {
  try {
    // Since users are global, ignore companyId and return the user
    const rows = await query(`
      SELECT u.*
      FROM users u
      WHERE u.email = ? AND u.active_inactive_status = 1
      LIMIT 1
    `, [email]);
    return rows[0] || null;  // Always return single user
  } catch (error) {
    throw error;
  }
}

// Updated: Find user by ID (global)
async function findUserById(id) {
  try {
    const rows = await query(`
      SELECT u.*
      FROM users u
      WHERE u.user_id = ? AND u.active_inactive_status = 1
      LIMIT 1
    `, [id]);
    return rows[0] || null;
  } catch (error) {
    throw error;
  }
}

async function verifyPassword(plain, hashed) {
  if (!plain || !hashed) return false;

  try {
    if (hashed.startsWith('$2')) {
      return await bcrypt.compare(plain, hashed);
    }
    return plain.trim() === hashed.trim();
  } catch (error) {
    return false;
  }
}

// Updated: Sanitize user row, now from users table
function sanitizeUserRow(row) {
  if (!row) return null;
  const {
    password_hash, otp, pass_exp_date, ...safe
  } = row;
  return safe;
}

// Updated: parseUserTypes fetches all roles from user_roles for the user
async function parseUserTypes(userId) {
  try {
    const rows = await query(`
      SELECT DISTINCT r.role_name
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ?
    `, [userId]);
    return rows.map(row => row.role_name);
  } catch (error) {
    return ['User'];  // Fallback
  }
}

// Updated: Build available companies from user_roles
async function buildAvailableCompanies(userId) {
  try {
    const rows = await query(`
      SELECT DISTINCT c.company_id AS id, c.company_name AS name, c.company_name AS code,
             c.company_status = 1 AS status
      FROM user_roles ur
      JOIN companies c ON ur.company_id = c.company_id
      WHERE ur.user_id = ?
    `, [userId]);
    return rows;
  } catch (error) {
    return [];
  }
}

// Updated: Get roles from user_roles for a specific company
async function getRolesFromUserType(userId, selectedCompanyId) {
  try {
    const rows = await query(`
      SELECT r.role_id AS id, r.role_name AS name, r.role_name AS code,
             CONCAT(r.role_name, ' role access') AS description,
             ? AS companyId, false AS isGlobal
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ? AND ur.company_id = ?
    `, [selectedCompanyId, userId, selectedCompanyId]);
    return rows;
  } catch (error) {
    return [];
  }
}

// New: Log login activity
async function logLoginActivity(userId, email, ipAddress, macAddress, browserDetails, loggedInWith, loginStatus, otp = null, companyId = null, roleId = null) {
  try {
    // If OTP is provided, this is for password reset, so include mail_time
    if (otp) {
      await query(`
        INSERT INTO login_activity (user_id, email_id, company_id, role_id, ip_address, mac_address, browser_details, loggedin_with, login_status, otp, mail_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [userId, email, companyId, roleId, ipAddress, macAddress, browserDetails, loggedInWith, loginStatus, otp]);
    } else {
      // Regular login activity without OTP
      await query(`
        INSERT INTO login_activity (user_id, email_id, company_id, role_id, ip_address, mac_address, browser_details, loggedin_with, login_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [userId, email, companyId, roleId, ipAddress, macAddress, browserDetails, loggedInWith, loginStatus]);
    }
  } catch (error) {
    console.error('Failed to log login activity:', error);
    // Don't throw; logging failure shouldn't block login
  }
}

// Updated: Login function with debugging
async function login(email, password, companyId = null, req = null) {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  console.log('🔍 User found:', user.user_id, user.email);

  // Always use global password (removed company_password check)
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Fetch all access combinations
  console.log('🔍 Fetching access combinations for user:', user.user_id);
  const combinations = await getAllAccessCombinations(user.user_id);
  console.log('🔍 Access combinations found:', combinations.length, combinations);
  
  if (combinations.length === 0) {
    const err = new Error('No access roles found for this user');
    err.status = 403;
    throw err;
  }

  // If multiple combinations, return for selection
  const safeUser = sanitizeUserRow(user);
  safeUser.availableCombinations = combinations;  // Return the list
  safeUser.userTypes = await parseUserTypes(user.user_id);

  return {
    user: safeUser,
    token: null,  // No token yet
    autoLoggedIn: false
  };
}

// New: Get companies for an email (for frontend company selection)
async function getCompaniesForEmail(email) {
  try {
    const user = await findUserByEmail(email);
    if (!user) return [];
    return await buildAvailableCompanies(user.user_id);
  } catch (error) {
    return [];
  }
}

// Updated: selectRole validates against user_roles and inserts new login_activity row
async function selectRole(userId, selection) {
  try {
    const { roleId, companyId } = selection;

    // Fetch user details for logging
    const user = await findUserById(userId);
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    // Check if user has this role in this company
    const roleCheck = await query(`
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = ? AND ur.company_id = ? AND ur.role_id = ?
      LIMIT 1
    `, [userId, companyId, roleId]);
    if (roleCheck.length === 0) {
      const err = new Error('Invalid role/company selection');
      err.status = 403;
      throw err;
    }

    // Get company and role details
    const company = await query(`
      SELECT company_id AS id, company_name AS name, entity_type, entity_code
      FROM companies
      WHERE company_id = ?
    `, [companyId]);
    if (company.length === 0) {
      const err = new Error('Company not found');
      err.status = 404;
      throw err;
    }

    const role = await query(`
      SELECT role_id AS id, role_name AS name
      FROM roles
      WHERE role_id = ?
    `, [roleId]);
    if (role.length === 0) {
      const err = new Error('Role not found');
      err.status = 404;
      throw err;
    }

    const updatedUser = {
      selectedRoleId: roleId,
      selectedRole: role[0],
      selectedCompanyId: companyId,
      selectedCompany: company[0],
      currentRole: role[0].name.toUpperCase(),
      currentCompany: companyId,
      userTypes: await parseUserTypes(userId),
      availableCompanies: await buildAvailableCompanies(userId),
      availableRoles: await getRolesFromUserType(userId, companyId),
      email: user.email,
      entity_type: company[0].entity_type,
      entity_code: company[0].entity_code
    };

    // Insert new row in login_activity for this selection
    const ip = '127.0.0.1';
    const userAgent = 'Web';
    await logLoginActivity(userId, user.email, ip, null, userAgent, 'Web', 1, null, companyId, roleId);

    return {
      success: true,
      user: updatedUser,
      message: `Access granted: ${role[0].name} at ${company[0].name}`
    };
  } catch (error) {
    throw error;
  }
}

// Updated: getRolesForCompany from user_roles
async function getRolesForCompany(userId, companyId) {
  try {
    const roles = await getRolesFromUserType(userId, companyId);
    const company = await query(`
      SELECT company_id AS id, company_name AS name
      FROM companies
      WHERE company_id = ?
    `, [companyId]);

    return {
      success: true,
      roles: roles,
      company: company[0],
      userTypes: await parseUserTypes(userId)
    };
  } catch (error) {
    throw error;
  }
}

// New: Get all roles for a user
async function getUserRoles(userId) {
  try {
    const rows = await query(`
      SELECT r.role_name, c.company_name, ur.company_id, ur.role_id
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      JOIN companies c ON ur.company_id = c.company_id
      WHERE ur.user_id = ?;
    `, [userId]);
    return rows;
  } catch (error) {
    throw error;
  }
}

// New: Assign a role to a user
async function assignRole(userId, companyId, roleId) {
  try {
    await query(`
      INSERT INTO user_roles (user_id, company_id, role_id)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE assigned_at = NOW();
    `, [userId, companyId, roleId]);
    return { success: true, message: 'Role assigned successfully' };
  } catch (error) {
    throw error;
  }
}

// New: Remove a role from a user
async function removeRole(userId, companyId, roleId) {
  try {
    const result = await query(`
      DELETE FROM user_roles
      WHERE user_id = ? AND company_id = ? AND role_id = ?;
    `, [userId, companyId, roleId]);
    if (result.affectedRows === 0) {
      throw new Error('Role not found');
    }
    return { success: true, message: 'Role removed successfully' };
  } catch (error) {
    throw error;
  }
}

// Set new password after token verification - Updated: Use mail_time for 24h expiry, set pass_exp_date to 6 months
async function setPassword(email, token, newPassword) {
  // Find user by email, matching PLAIN token in login_activity, and otp not expired (within 24 hours)
  const user = await query(`
    SELECT u.user_id 
    FROM users u 
    JOIN login_activity la ON u.user_id = la.user_id 
    WHERE u.email = ? AND la.otp = ? AND la.mail_time > DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `, [email, token]);  // Use plain token directly

  if (!user[0]) {
    throw new Error('Invalid or expired token');
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password, set pass_exp_date to 6 months from now, and remove the login_activity entry
  const passwordExpiry = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);  // Approx 6 months
  await query('UPDATE users SET password_hash = ?, pass_exp_date = ? WHERE user_id = ?', [hashedPassword, passwordExpiry, user[0].user_id]);
  await query('DELETE FROM login_activity WHERE user_id = ? AND otp = ?', [user[0].user_id, token]);  // Use plain token

  return { success: true, message: 'Password updated successfully' };
}

// Add forgot password function - Updated: Store plain token in otp
async function forgotPassword(email) {
  // Check if user exists in users table
  const user = await query('SELECT user_id FROM users WHERE email = ? AND bit_deleted_flag = 0', [email]);
  if (!user[0]) {
    throw new Error('User not found');
  }

  const userId = user[0].user_id;

  // Generate shorter token that fits in varchar(50) - Use 20 bytes = 40 hex chars (same as add.service.js)
  const resetToken = crypto.randomBytes(20).toString('hex');  // 40-char hex token

  // Store plain token in login_activity with mail_time
  await query('INSERT INTO login_activity (user_id, otp, mail_time) VALUES (?, ?, NOW())', [userId, resetToken]);

  // Send reset email (you need to implement sendResetEmail here or import it)
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  console.log('🔗 Reset link generated:', resetLink);

  return { success: true, message: 'Reset email sent.' };
}

// Updated: Get companies (removed parent_company_id)
async function getCompanies() {
  const rows = await query('SELECT company_id AS id, company_name AS name FROM companies');
  return rows;
}

// Updated: Get all access combinations for a user with proper role_id
async function getAllAccessCombinations(userId) {
  try {
    console.log('🔍 Fetching combinations for userId:', userId);
    
    const rows = await query(`
      SELECT 
          ur.user_id,
          c.company_id,
          c.company_name,
          c.entity_type,
          c.entity_code,
          r.role_id,
          r.role_name
      FROM user_roles ur
      JOIN companies c ON ur.company_id = c.company_id
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ?
      ORDER BY c.company_id, r.role_name;
    `, [userId]);

    console.log('🔍 Raw query results:', rows);

    // Return flattened structure with proper role_id
    const combinations = rows.map(row => ({
      company_id: row.company_id,
      company_name: row.company_name,
      entity_type: row.entity_type,
      entity_code: row.entity_code,
      role_id: row.role_id,
      role_name: row.role_name,
    }));

    console.log('🔍 Final combinations:', combinations);
    return combinations;

  } catch (error) {
    console.error('Error in getAllAccessCombinations:', error);
    throw error;
  }
}

// Export all functions
module.exports = {
  findUserByEmail,
  findUserById,
  verifyPassword,
  sanitizeUserRow,
  parseUserTypes,
  buildAvailableCompanies,
  getRolesFromUserType,
  logLoginActivity,
  login,
  getCompaniesForEmail,
  selectRole,
  getRolesForCompany,
  getUserRoles,
  assignRole,
  removeRole,
  setPassword,
  forgotPassword,
  getCompanies,
  getAllAccessCombinations
};