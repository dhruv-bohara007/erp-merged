
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure Multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

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

// Send invoice email with PDF attachment
app.post('/api/send-invoice-email', upload.single('pdf'), async (req, res) => {
  try {
    const { to, cc, subject, message } = req.body;
    const pdfFile = req.file;

    if (!to || !subject || !pdfFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and PDF file'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      cc: cc || undefined,
      subject: subject,
      text: message || '',
      attachments: [
        {
          filename: pdfFile.originalname || 'invoice.pdf',
          content: pdfFile.buffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Invoice email sent successfully'
    });

  } catch (error) {
    console.error('Error sending invoice email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

// Send registration invitation to new employee
app.post('/api/send-registration-invite', async (req, res) => {
  try {
    const { 
      employeeName, 
      employeeEmail, 
      companyName,
      registrationUrl 
    } = req.body;

    if (!employeeName || !employeeEmail || !companyName || !registrationUrl) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: employeeEmail,
      subject: `You've been invited to join ${companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hello ${employeeName},</h2>
          
          <p>You've been invited to join <strong>${companyName}</strong>!</p>
          
          <p>To get started, please create your account by clicking the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${registrationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Create Your Account
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            You'll be able to set your own password during registration.
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
      message: 'Registration invitation sent successfully'
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

// Send purchase order email with PDF attachment
app.post('/api/send-purchase-order-email', upload.single('pdf'), async (req, res) => {
  try {
    const { to, cc, subject, message } = req.body;
    const pdfFile = req.file;

    if (!to || !subject || !pdfFile) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, and PDF file'
      });
    }

    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: to,
      cc: cc || undefined,
      subject: subject,
      text: message || '',
      attachments: [
        {
          filename: pdfFile.originalname || 'purchase-order.pdf',
          content: pdfFile.buffer,
          contentType: 'application/pdf'
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: 'Purchase order email sent successfully'
    });

  } catch (error) {
    console.error('Error sending purchase order email:', error);
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
