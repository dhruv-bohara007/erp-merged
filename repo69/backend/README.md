
# Employee Management Backend

This backend service handles email notifications for the employee management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure your email settings in `.env`:
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: Your Gmail app password (not your regular password)

## Getting Gmail App Password

1. Enable 2-factor authentication on your Gmail account
2. Go to Google Account settings
3. Security > 2-Step Verification > App passwords
4. Generate an app password for this application

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will run on port 3001 by default.

## API Endpoints

### POST /api/send-welcome-email
Sends a welcome email to a new employee.

**Request Body:**
```json
{
  "employeeName": "John Doe",
  "employeeEmail": "john@example.com",
  "temporaryPassword": "temp123",
  "companyName": "ABC Company",
  "loginUrl": "http://localhost:5173/login"
}
```

### GET /api/health
Health check endpoint.
