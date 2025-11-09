const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Get user groups from database (without description)
async function getUserGroups() {
  try {
    const rows = await query(`
      SELECT 
        group_id AS id, 
        group_name AS name
      FROM user_groups 
      WHERE bit_deleted_flag = 0 AND is_active = 1
      ORDER BY group_name
    `);
    return rows;
  } catch (error) {
    console.error('Error in getUserGroups service:', error);
    throw error;
  }
}

// Get roles from database
async function getRoles() {
  try {
    const rows = await query(`
      SELECT 
        role_id AS id, 
        role_name AS name
      FROM roles 
      ORDER BY role_name
    `);
    return rows;
  } catch (error) {
    console.error('Error in getRoles service:', error);
    throw error;
  }
}

// Get existing users - make sure this matches the adduser endpoint
async function getUsers() {
  try {
    const rows = await query(`
      SELECT 
        user_id AS _id,  -- Use _id to match manageuser format
        CONCAT(first_name, ' ', last_name) AS name, 
        email,
        first_name AS firstName,
        last_name AS lastName,
        phone_no
      FROM users 
      WHERE bit_deleted_flag = 0
    `);
    console.log('Users fetched from adduser service:', rows);
    return rows;
  } catch (error) {
    console.error('Error in getUsers service:', error);
    throw error;
  }
}

// Get companies
async function getCompanies() {
  const rows = await query('SELECT company_id AS id, company_name AS name, parent_company_id AS parentId FROM companies');
  return rows;
}

// Check if user already has the role in the company
async function checkUserRoleExists(userId, companyId, roleName) {
  try {
    const rows = await query(`
      SELECT ur.user_role_id 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.role_id
      WHERE ur.user_id = ? AND ur.company_id = ? AND r.role_name = ? AND ur.bit_deleted_flag = 0
    `, [userId, companyId, roleName]);
    
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking user role exists:', error);
    throw error;
  }
}

// Create user (new or from existing user) - Updated: Use existingUserId
async function createUser(payload) {
  const { companyId, existingUserId, firstName, lastName, email, confirmEmail, phoneNo, role, userGroup, isActive } = payload;

  let userData;
  let userId;
  
  if (existingUserId) {
    // Using existing user
    const user = await query('SELECT first_name, last_name, email, phone_no FROM users WHERE user_id = ? AND bit_deleted_flag = 0', [existingUserId]);
    if (!user[0]) throw new Error('User not found');
    
    userId = existingUserId;
    
    // Check if user already has this role in this company
    const roleExists = await checkUserRoleExists(userId, companyId, role);
    if (roleExists) {
      throw new Error(`User already has the role "${role}" in this company. Please select a different role or user.`);
    }
    
    userData = {
      first_name: user[0].first_name,
      last_name: user[0].last_name,
      email: user[0].email,
      phone_no: user[0].phone_no,
      user_group: JSON.stringify(userGroup || []),
      active_inactive_status: isActive ? 1 : 0
    };
    
    // Update existing user's group and status
    await query('UPDATE users SET user_group = ?, active_inactive_status = ? WHERE user_id = ?', 
      [userData.user_group, userData.active_inactive_status, userId]);
      
  } else {
    // Creating new user
    if (!email || !confirmEmail || email !== confirmEmail) {
      throw new Error('Email and confirm email must match');
    }
    
    // Check if email already exists
    const existingUser = await query('SELECT user_id FROM users WHERE email = ? AND bit_deleted_flag = 0', [email]);
    if (existingUser.length > 0) {
      throw new Error('User with this email already exists. Please use the existing user option or choose a different email.');
    }
    
    userData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_no: phoneNo,
      user_group: JSON.stringify(userGroup || []),
      active_inactive_status: isActive ? 1 : 0,
      bit_deleted_flag: 0,
      created_date: new Date()
    };

    // Insert new user
    const result = await query('INSERT INTO users SET ?', [userData]);
    userId = result.insertId;
  }

  // Get role_id from roles table
  const roleRow = await query('SELECT role_id FROM roles WHERE role_name = ?', [role]);
  if (!roleRow[0]) throw new Error(`Role "${role}" not found`);
  const roleId = roleRow[0].role_id;

  // Insert into user_roles
  await query('INSERT INTO user_roles (user_id, company_id, role_id, bit_deleted_flag, created_date) VALUES (?, ?, ?, 0, NOW())', 
    [userId, companyId, roleId]);

  // Generate secure token using crypto (random bytes)
  const resetToken = crypto.randomBytes(32).toString('hex');  // 64-char hex token (random)

  // Store plain token in login_activity.otp (no hashing)
  await query('INSERT INTO login_activity (user_id, otp, mail_time) VALUES (?, ?, NOW())', [userId, resetToken]);

  // Send reset email with plain token in link
  await sendResetEmail(userData.email, resetToken);

  return { 
    success: true, 
    message: existingUserId ? 
      'User role assigned successfully. Reset email sent.' : 
      'User created successfully. Reset email sent.' 
  };
}

// Send reset email
async function sendResetEmail(email, token) {
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'adam.schowalter@ethereal.email',
      pass: 'gAhPqGRgmhkUjCMSUw'
    }
  });

  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: 'adam.schowalter@ethereal.email',
    to: email,
    subject: 'Create Your Password',
    html: `<p>Click <a href="${resetLink}">here</a> to create your password. Link expires in 24 hours.</p>`
  };

  await transporter.sendMail(mailOptions);
}

// Set new password after token verification - Updated: No hashing, match plain token
async function setPassword(email, token, newPassword) {
  // Find user by email, matching plain token in login_activity, and otp not expired (within 24 hours)
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

module.exports = { 
  createUser,
  getUserGroups,
  getUsers,
  getCompanies,
  getRoles,  // Add this export
  setPassword
};