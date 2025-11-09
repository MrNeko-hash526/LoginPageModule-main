const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

// Create transporter with Ethereal SMTP (same as in add.service.js)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
  port: process.env.EMAIL_PORT || 587,
  auth: {
    user: process.env.EMAIL_USER || 'adam.schowalter@ethereal.email',
    pass: process.env.EMAIL_PASS || 'gAhPqGRgmhkUjCMSUw'
  }
});

// Update sendTestEmail to use the correct frontend URL (5173)
async function sendTestEmail() {
  try {
    // Dummy token and email for testing
    const dummyToken = 'test-token-123';
    const dummyEmail = 'test@example.com';
    const resetLink = `http://localhost:5173/reset-password?token=${dummyToken}&email=${encodeURIComponent(dummyEmail)}`;  // Updated to 5173

    const mailOptions = {
      from: process.env.EMAIL_USER || 'adam.schowalter@ethereal.email',
      to: 'test@example.com',
      subject: 'Test Email from Node.js',
      html: `<p>This is a test email to check if mail sending works.</p><p>Click <a href="${resetLink}">here</a> to reset your password (test link).</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL (Ethereal):', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending test email:', error);
  }
}

// Run the test
sendTestEmail();