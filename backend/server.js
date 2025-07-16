
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create transporter for nodemailer
const createTransporter = () => {
  return nodemailer.createTransport({ // Correct: createTransport is the method
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send welcome email to new employee
app.post('/api/send-welcome-email', async (req, res) => {
  try {
    const { 
      employeeName, 
      employeeEmail, 
      temporaryPassword, 
      companyName,
      loginUrl 
    } = req.body;

    if (!employeeName || !employeeEmail || !temporaryPassword || !companyName || !loginUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: employeeEmail,
      subject: `Welcome to ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${employeeName},</h2>
          
          <p>You've been added to the <strong>${companyName}</strong> system.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Login Email:</strong> ${employeeEmail}</p>
            <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              👉 Click here to login
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            For security reasons, you'll be required to change your password upon first login.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Welcome email sent successfully'
    });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
