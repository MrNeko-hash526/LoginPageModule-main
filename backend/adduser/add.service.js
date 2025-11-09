const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Get user groups
async function getUserGroups() {
  const rows = await query('SELECT id, name FROM user_groups'); // Assuming user_groups table exists
  return rows;
}

// Get existing users
async function getUsers() {
  const rows = await query(`
    SELECT user_id AS id, CONCAT(first_name, ' ', last_name) AS name, email, first_name, last_name, phone_no
    FROM users 
    WHERE bit_deleted_flag = 0
  `);
  return rows;
}

// Get companies
async function getCompanies() {
  const rows = await query('SELECT company_id AS id, company_name AS name, parent_company_id AS parentId FROM companies');
  return rows;
}

// Create user (new or from existing user) - Updated: Use existingUserId
async function createUser(payload) {
  const { companyId, existingUserId, firstName, lastName, email, phoneNo, role, userGroup, isActive } = payload;

  let userData;
  if (existingUserId) {
    const user = await query('SELECT first_name, last_name, email, phone_no FROM users WHERE user_id = ? AND bit_deleted_flag = 0', [existingUserId]);
    if (!user[0]) throw new Error('User not found');
    userData = {
      first_name: user[0].first_name,
      last_name: user[0].last_name,
      email: user[0].email,
      phone_no: user[0].phone_no,
      user_group: userGroup,
      active_inactive_status: isActive ? 1 : 0
    };
  } else {
    userData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone_no: phoneNo,
      user_group: userGroup,
      active_inactive_status: isActive ? 1 : 0
    };
  }

  // Store userGroup as JSON string in users.user_group
  userData.user_group = JSON.stringify(payload.userGroup);  // Array of names

  // Insert into users
  const result = await query('INSERT INTO users SET ?', [userData]);
  const userId = result.insertId;

  // Get role_id from roles table
  const roleRow = await query('SELECT role_id FROM roles WHERE role_name = ?', [role]);
  if (!roleRow[0]) throw new Error('Role not found');
  const roleId = roleRow[0].role_id;

  // Insert into user_roles
  await query('INSERT INTO user_roles (user_id, company_id, role_id, bit_deleted_flag) VALUES (?, ?, ?, 0)', [userId, companyId, roleId]);

  // Generate secure token using crypto (random bytes)
  const resetToken = crypto.randomBytes(32).toString('hex');  // 64-char hex token (random)

  // Store plain token in login_activity.otp (no hashing)
  await query('INSERT INTO login_activity (user_id, otp, mail_time) VALUES (?, ?, NOW())', [userId, resetToken]);

  // Send reset email with plain token in link
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  await sendResetEmail(email, resetToken);

  return { success: true, message: 'User created successfully. Reset email sent.' };
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
  createUser,  // Export the function, not controller
  getUserGroups,
  getUsers,  // Export the function
  getCompanies,
  setPassword  // Add this back
};