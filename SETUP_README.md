# EduForge - Advanced Online Learning Platform
## MERN Stack Project Setup Guide

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Project Structure](#project-structure)
4. [Installation & Setup](#installation--setup)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**EduForge** is a full-stack online learning platform built with the MERN stack (MongoDB, Express.js, React, Node.js). It provides features like:
- User authentication and authorization
- Course catalog with search and filtering
- Video-based lessons with progress tracking
- Interactive quizzes and code exercises
- Personalized course recommendations
- Certificate generation and verification
- Admin dashboard for platform management

---

## ✅ Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14.0 or higher) - [Download here](https://nodejs.org/)
- **npm** (v6.0 or higher) - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
  - OR use **MongoDB Atlas** (Cloud) - [Sign up here](https://www.mongodb.com/cloud/atlas)
- **Git** (optional) - For version control

**Verify installations:**
```bash
node --version
npm --version
mongod --version  # For local MongoDB
```

---

## 📁 Project Structure

```
React/
├── eduforge-backend/          # Backend (Node.js + Express)
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Auth & validation middleware
│   ├── models/                # MongoDB models
│   ├── routes/                # API routes
│   ├── scripts/               # Utility scripts
│   ├── utils/                 # Helper functions
│   ├── index.js               # Server entry point
│   ├── package.json           # Backend dependencies
│   └── .env.example           # Environment variables template
│
├── eduforge-frontend/         # Frontend (React)
│   ├── public/                # Static files
│   ├── src/
│   │   ├── components/        # Reusable React components
│   │   ├── context/           # React Context providers
│   │   ├── pages/             # Page components
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Helper functions
│   │   ├── App.js             # Main App component
│   │   └── index.js           # React entry point
│   ├── package.json           # Frontend dependencies
│   └── .env.example           # Environment variables template
│
├── db-backup/                 # MongoDB database backup
│   └── eduforge/              # Database dump files
│
├── README.md                  # This file (setup instructions)
├── PROJECT_REPORT.md          # Detailed project documentation
└── .gitignore                 # Files to ignore in version control
```

---

## 🚀 Installation & Setup

Follow these steps carefully to set up the project on your local machine.

### Step 1: Extract the Project

If you received a ZIP file, extract it to your desired location:
```bash
# Windows (PowerShell)
Expand-Archive -Path eduforge-project.zip -DestinationPath C:\Projects\

# Linux/Mac
unzip eduforge-project.zip -d ~/Projects/
```

### Step 2: Install Backend Dependencies

```bash
# Navigate to backend folder
cd React/eduforge-server

# Install all dependencies
npm install
```

**This will install:**
- express (Web framework)
- mongoose (MongoDB ODM)
- bcryptjs (Password hashing)
- jsonwebtoken (JWT authentication)
- cors (Cross-origin resource sharing)
- dotenv (Environment variables)
- And other dependencies...

### Step 3: Install Frontend Dependencies

```bash
# Navigate to frontend folder (open a new terminal)
cd React/eduforge-client

# Install all dependencies
npm install
```

**This will install:**
- react (UI library)
- react-router-dom (Routing)
- axios (HTTP client)
- tailwindcss (CSS framework)
- recharts (Charts and analytics)
- And other dependencies...

### Step 4: Configure Environment Variables

#### Backend Configuration

1. Navigate to `eduforge-server/` folder
2. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Or on Windows:
   ```bash
   copy .env.example .env
   ```

3. Edit the `.env` file with your actual values:
   ```env
   PORT=5000
   
   # For LOCAL MongoDB:
   MONGO_URI=mongodb://localhost:27017/eduforge
   
   # OR for MongoDB Atlas (Cloud):
   # MONGO_URI=mongodb+srv://your_username:your_password@cluster0.xxxxx.mongodb.net/eduforge?retryWrites=true&w=majority
   
   JWT_SECRET=mySecretKey12345!@#$%
   NODE_ENV=development
   ```

   **Important:** Generate a strong random string for `JWT_SECRET` in production!

#### Frontend Configuration

1. Navigate to `eduforge-client/` folder
2. Create a `.env` file by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Or on Windows:
   ```bash
   copy .env.example .env
   ```

3. Edit the `.env` file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   PORT=3000
   ```

---

## 🗄️ Database Setup

You have **TWO options** for setting up the database:

### Option 1: Restore from Database Backup (Recommended)

If the `db-backup/` folder is included in the project:

1. **Start MongoDB service** (if using local MongoDB):
   ```bash
   # Windows
   net start MongoDB
   
   # Linux/Mac
   sudo systemctl start mongod
   ```

2. **Restore the database** using mongorestore:
   ```bash
   # Navigate to project root
   cd React/
   
   # Restore database
   mongorestore --db eduforge ./db-backup/eduforge
   ```

3. **Verify restoration:**
   ```bash
   # Connect to MongoDB
   mongosh
   
   # Switch to eduforge database
   use eduforge
   
   # Check collections
   show collections
   
   # Count documents in a collection
   db.courses.countDocuments()
   ```

### Option 2: Use Seed Scripts

If no backup is available, use the seed scripts:

1. **Start MongoDB service** (as shown above)

2. **Run the seed script**:
   ```bash
   # Navigate to backend folder
   cd React/eduforge-server
   
   # Run seed script
   npm run seed:courses
   ```

3. This will populate the database with dummy courses and data.

### Option 3: MongoDB Atlas (Cloud Database)

If you prefer using cloud database:

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. Whitelist your IP address (or use `0.0.0.0/0` for development)
5. Get your connection string
6. Update `MONGO_URI` in backend `.env` file with the Atlas connection string

---

## ▶️ Running the Application

### Start Backend Server

1. Open a terminal
2. Navigate to backend folder:
   ```bash
   cd React/eduforge-server
   ```
3. Start the server:
   ```bash
   # Development mode (auto-restart on changes)
   npm run dev
   
   # OR Production mode
   npm start
   ```

4. You should see:
   ```
   ✅ Connected to MongoDB
   🚀 Server running on port 5000
   ```

### Start Frontend Application

1. Open a **NEW terminal** (keep backend running)
2. Navigate to frontend folder:
   ```bash
   cd React/eduforge-client
   ```
3. Start the React app:
   ```bash
   npm start
   ```

4. The browser should automatically open at `http://localhost:3000`

### Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Sample API Endpoint:** http://localhost:5000/api/courses

### Test Credentials

If using the seeded data, you can login with:

**Admin Account:**
- Email: `admin@eduforge.com`
- Password: `admin123`

**Student Account:**
- Email: `student@eduforge.com`
- Password: `student123`

*(Note: Create these manually if they don't exist)*

---

## 🧪 Testing

### Backend API Testing

Use **Postman** or **Thunder Client** to test API endpoints:

1. **Register User:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/register`
   - Body (JSON):
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }
     ```

2. **Login:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`
   - Body (JSON):
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```

3. **Get All Courses:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/courses`
   - Headers: `Authorization: Bearer YOUR_JWT_TOKEN`

### Frontend Testing

```bash
# Run frontend tests
cd React/eduforge-client
npm test
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. "Cannot connect to MongoDB"

**Problem:** Backend can't connect to database

**Solutions:**
- Ensure MongoDB service is running: `net start MongoDB` (Windows) or `sudo systemctl start mongod` (Linux)
- Check `MONGO_URI` in `.env` file
- Verify MongoDB is listening on port 27017: `netstat -an | findstr 27017`
- If using Atlas, check internet connection and IP whitelist

#### 2. "Port 5000 already in use"

**Problem:** Another application is using port 5000

**Solutions:**
- Change `PORT` in backend `.env` file to another port (e.g., 5001)
- Kill the process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Linux/Mac
  lsof -i :5000
  kill -9 <PID>
  ```

#### 3. "Module not found" errors

**Problem:** Dependencies not installed

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORS errors in browser

**Problem:** Frontend can't communicate with backend

**Solutions:**
- Ensure backend CORS is configured to allow `http://localhost:3000`
- Check backend `index.js` has:
  ```javascript
  app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
  ```

#### 5. "JWT must be provided" error

**Problem:** Authentication token missing or invalid

**Solutions:**
- Ensure you're logged in
- Check if token is stored in localStorage
- Re-login to get a fresh token
- Verify `JWT_SECRET` matches in `.env`

#### 6. Frontend shows blank page

**Solutions:**
- Check browser console for errors (F12)
- Ensure backend is running
- Verify `REACT_APP_API_URL` in frontend `.env`
- Clear browser cache and reload

---

## 📦 Creating Database Backup

If you want to create your own database backup:

```bash
# Navigate to project root
cd React/

# Create backup
mongodump --db eduforge --out ./db-backup

# This creates: db-backup/eduforge/ folder with BSON files
```

---

## 🏗️ Building for Production

### Backend

```bash
cd React/eduforge-server
npm start
```

### Frontend

```bash
cd React/eduforge-client
npm run build
```

This creates an optimized `build/` folder that can be deployed.

---

## 📚 Additional Resources

- **Project Report:** See `PROJECT_REPORT.md` for detailed documentation
- **API Documentation:** Available in backend `/routes` folder comments
- **Component Documentation:** Check individual component files in `src/components`

---

## 👥 Support

If you encounter any issues:

1. Check the **Troubleshooting** section above
2. Review error messages in terminal/console
3. Check MongoDB connection
4. Verify all dependencies are installed
5. Ensure `.env` files are configured correctly

---

## 📝 Important Notes

- **Never commit `.env` files** with real credentials to version control
- **Always use `.env.example`** as a template
- **Keep `JWT_SECRET` secure** in production
- **Backup your database** regularly
- **Test on a fresh setup** before submission

---

## 🎓 Project Information

- **Technology Stack:** MERN (MongoDB, Express.js, React, Node.js)
- **Frontend:** React 19.1.1 with Tailwind CSS
- **Backend:** Node.js with Express 5.1.0
- **Database:** MongoDB 8.x with Mongoose ODM
- **Authentication:** JWT (JSON Web Tokens)

---

**Happy Coding! 🚀**

For detailed project documentation, refer to `PROJECT_REPORT.md`.
