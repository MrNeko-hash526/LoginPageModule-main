const { query } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// Create user (new or from existing contact) - Updated: pass_exp_date not set here (will be set on password creation)
async function createUser(payload) {
  const { companyId, existingContactId, firstName, lastName, email, phoneNo, role, userGroup, isActive } = payload;

  let userData;
  if (existingContactId) {
    const contact = await query('SELECT name, email, phone FROM contacts WHERE id = ?', [existingContactId]);
    if (!contact[0]) throw new Error('Contact not found');
    const [fName, lName] = contact[0].name.split(' ');
    userData = {
      first_name: fName || '',
      last_name: lName || '',
      email: contact[0].email,
      phone_no: contact[0].phone,
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

  // Insert into users
  const result = await query('INSERT INTO users SET ?', [userData]);
  const userId = result.insertId;

  // Get role_id from roles table
  const roleRow = await query('SELECT role_id FROM roles WHERE role_name = ?', [role]);
  if (!roleRow[0]) throw new Error('Role not found');
  const roleId = roleRow[0].role_id;

  // Insert into user_roles
  await query('INSERT INTO user_roles (user_id, company_id, role_id, bit_deleted_flag) VALUES (?, ?, ?, 0)', [userId, companyId, roleId]);

  // Generate secure token using crypto
  const resetToken = crypto.randomBytes(32).toString('hex');  // 64-char hex token
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');  // SHA-256 hash (64 chars)

  // Store hash in login_activity.otp, set mail_time to now (use for 24h expiry check)
  await query('INSERT INTO login_activity (user_id, otp, mail_time) VALUES (?, ?, NOW())', [userId, hashedToken]);
  // pass_exp_date remains NULL until password is set

  // Send reset email with plain token
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

// Get user groups
async function getUserGroups() {
  const rows = await query('SELECT id, name FROM user_groups'); // Assuming user_groups table exists
  return rows;
}

// Get existing contacts
async function getContacts() {
  const rows = await query('SELECT id, name, email FROM contacts'); // Assuming contacts table exists
  return rows;
}

// Get companies
async function getCompanies() {
  const rows = await query('SELECT company_id AS id, company_name AS name, parent_company_id AS parentId FROM companies');
  return rows;
}

module.exports = { 
  createUser,
  getUserGroups,
  getContacts,
  getCompanies
};