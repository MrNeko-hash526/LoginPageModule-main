const { query } = require('./config/db');
const bcrypt = require('bcryptjs');

async function debugUser() {
  try {
    console.log('=== Debugging user login ===\n');
    
    // Check if user exists
    const users = await query('SELECT id, email, firstName, vchPassword, bit_deleted_flag FROM tbl_login WHERE email = ?', ['admin@test.com']);
    
    if (users.length === 0) {
      console.log('❌ User admin@test.com not found in database');
      
      // Show all users
      const allUsers = await query('SELECT email, firstName FROM tbl_login WHERE bit_deleted_flag = 0');
      console.log('Available users:', allUsers);
      return;
    }
    
    const user = users[0];
    console.log('✅ User found:');
    console.log('- ID:', user.id);
    console.log('- Email:', user.email);
    console.log('- Name:', user.firstName);
    console.log('- Deleted flag:', user.bit_deleted_flag);
    console.log('- Password in DB:', user.vchPassword);
    console.log('- Password length:', user.vchPassword.length);
    console.log('- Is bcrypt hash:', user.vchPassword.startsWith('$2'));
    
    // Test password verification
    const testPassword = 'password123';
    console.log('\n=== Testing password verification ===');
    console.log('Testing password:', testPassword);
    
    if (user.vchPassword.startsWith('$2')) {
      console.log('Attempting bcrypt comparison...');
      const bcryptResult = await bcrypt.compare(testPassword, user.vchPassword);
      console.log('Bcrypt result:', bcryptResult);
    } else {
      console.log('Attempting plain text comparison...');
      const plainResult = testPassword === user.vchPassword;
      console.log('Plain text result:', plainResult);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugUser();