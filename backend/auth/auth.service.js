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
      WHERE ur.user_id = ? AND ur.bit_deleted_flag = 0
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
             c.company_status = 1 AS status, c.parent_company_id AS parentId
      FROM user_roles ur
      JOIN companies c ON ur.company_id = c.company_id
      WHERE ur.user_id = ? AND ur.bit_deleted_flag = 0
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
      WHERE ur.user_id = ? AND ur.company_id = ? AND ur.bit_deleted_flag = 0
    `, [selectedCompanyId, userId, selectedCompanyId]);
    return rows;
  } catch (error) {
    return [];
  }
}

// New: Log login activity
async function logLoginActivity(userId, email, ipAddress, macAddress, browserDetails, loggedInWith, loginStatus, otp = null, companyId = null, roleId = null) {
  try {
    await query(`
      INSERT INTO login_activity (user_id, email_id, company_id, role_id, ip_address, mac_address, browser_details, loggedin_with, login_status, otp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, email, companyId, roleId, ipAddress, macAddress, browserDetails, loggedInWith, loginStatus, otp]);
  } catch (error) {
    console.error('Failed to log login activity:', error);
    // Don't throw; logging failure shouldn't block login
  }
}

// Updated: Login function (removed company_password logic, keep companyId for selection)
async function login(email, password, companyId = null, req = null) {
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Always use global password (removed company_password check)
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Fetch available companies and roles
  const availableCompanies = await buildAvailableCompanies(user.user_id);
  const userTypes = await parseUserTypes(user.user_id);

  // Log successful login (fixed column name to 'full_name')
  if (req) {
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    await logLoginActivity(user.user_id, user.email, ip, null, userAgent, 'Web', 1);
  }

  // Create JWT payload
  const payload = {
    id: user.user_id,
    email: user.email,
    userTypes: userTypes
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

  // Prepare user data
  const safeUser = sanitizeUserRow(user);
  safeUser.availableCompanies = availableCompanies;
  safeUser.userTypes = userTypes;
  safeUser.firstName = user.first_name || '';
  safeUser.fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  safeUser.lastName = user.last_name || '';

  // If company selected, set selectedCompany (kept for post-login selection)
  if (companyId) {
    const selectedCompany = availableCompanies.find(c => c.id == companyId);
    if (selectedCompany) {
      safeUser.selectedCompany = selectedCompany;
      safeUser.selectedCompanyId = companyId;
    }
  }

  return {
    user: safeUser,
    token
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
      WHERE ur.user_id = ? AND ur.company_id = ? AND ur.role_id = ? AND ur.bit_deleted_flag = 0
      LIMIT 1
    `, [userId, companyId, roleId]);
    if (roleCheck.length === 0) {
      const err = new Error('Invalid role/company selection');
      err.status = 403;
      throw err;
    }

    // Get company and role details
    const company = await query(`
      SELECT company_id AS id, company_name AS name
      FROM companies
      WHERE company_id = ?
    `, [companyId]);
    const role = await query(`
      SELECT role_id AS id, role_name AS name
      FROM roles
      WHERE role_id = ?
    `, [roleId]);

    const updatedUser = {
      selectedRoleId: roleId,
      selectedRole: role[0],
      selectedCompanyId: companyId,
      selectedCompany: company[0],
      currentRole: role[0].name.toUpperCase(),
      currentCompany: companyId,
      userTypes: await parseUserTypes(userId),
      availableCompanies: await buildAvailableCompanies(userId),
      availableRoles: await getRolesFromUserType(userId, companyId)
    };

    // Insert new row in login_activity for this selection
    const ip = '127.0.0.1';  // Placeholder; adjust if you have req object
    const userAgent = 'Web';  // Placeholder
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
  // Hash the provided token
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user by email, matching hashed token in login_activity, and otp not expired (within 24 hours)
  const user = await query(`
    SELECT u.user_id 
    FROM users u 
    JOIN login_activity la ON u.user_id = la.user_id 
    WHERE u.email = ? AND la.otp = ? AND la.mail_time > DATE_SUB(NOW(), INTERVAL 24 HOUR)
  `, [email, hashedToken]);

  if (!user[0]) {
    throw new Error('Invalid or expired token');
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  // Update password, set pass_exp_date to 6 months from now, and remove the login_activity entry
  const passwordExpiry = new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000);  // Approx 6 months
  await query('UPDATE users SET password_hash = ?, pass_exp_date = ? WHERE user_id = ?', [hashedPassword, passwordExpiry, user[0].user_id]);
  await query('DELETE FROM login_activity WHERE user_id = ? AND otp = ?', [user[0].user_id, hashedToken]);

  return { success: true, message: 'Password updated successfully' };
}

module.exports = { 
  login, 
  findUserByEmail, 
  findUserById,
  sanitizeUserRow, 
  selectRole,
  getRolesForCompany,
  parseUserTypes,
  getRolesFromUserType,
  logLoginActivity,
  getUserRoles,
  assignRole,
  removeRole,
  getCompaniesForEmail,  // Added
  setPassword  // Added
};