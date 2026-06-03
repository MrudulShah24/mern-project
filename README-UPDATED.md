# EduForge - Advanced Online Learning Platform

EduForge is a full-stack educational platform designed to provide a seamless learning experience similar to platforms like Coursera and Udemy. It features a modern, responsive interface and a robust backend with advanced recommendation algorithms and course management features.

## ✨ Key Features

- **User Authentication:** Secure registration, login, and JWT-based session management
- **Course Catalog:** Browse, search, and filter courses by category, level, and more
- **Personalized Recommendations:** AI-driven course recommendations based on user preferences and behavior
- **Interactive Learning:** Video lectures, quizzes, code exercises, and lesson content
- **Progress Tracking:** Detailed progress metrics and visualizations
- **Course Discussions:** Q&A forums and discussion boards for each course
- **Certificate Generation:** Automated certificate creation for completed courses
- **Course Analytics:** Comprehensive analytics for instructors and administrators
- **Admin Dashboard:** Complete management interface for courses, users, and platform data

## 🚀 Recent Updates

- **Simplified Recommendation System:** Enhanced recommendation engine with "For You" and "Trending" tabs
- **Improved Navigation:** Optimized scrolling behavior when navigating between course pages
- **Certificate Verification:** Public verification system for course certificates
- **Enhanced Quiz System:** Improved quiz validation and results visualization
- **Video Player Upgrades:** Better video playback controls and progress tracking
- **Enrollment Fixes:** Resolved issues with course enrollment visibility and tracking

## 🔧 Tech Stack

### Frontend
- **React:** Component-based UI library
- **React Router:** Client-side routing
- **Tailwind CSS:** Utility-first styling framework
- **Lucide React:** Modern icon library
- **Recharts:** Interactive data visualization
- **Axios:** Promise-based HTTP client

### Backend
- **Node.js:** JavaScript runtime
- **Express:** Web application framework
- **MongoDB:** NoSQL database
- **Mongoose:** MongoDB object modeling
- **JWT:** Authentication mechanism
- **bcrypt:** Password hashing library

## 📋 Project Structure

```
eduforge-client/           # Frontend React application
├── public/                # Static files
└── src/
    ├── assets/            # Images, icons, etc.
    ├── components/        # Reusable UI components
    │   ├── CourseCard.jsx
    │   ├── CourseRecommendations.jsx
    │   ├── VideoPlayer.jsx
    │   ├── Quiz.jsx
    │   └── ...
    ├── context/           # React context providers
    ├── pages/             # Page components
    │   ├── CourseDetails.jsx
    │   ├── Dashboard.jsx
    │   ├── Login.jsx
    │   └── ...
    ├── services/          # API service layer
    └── utils/             # Helper functions

eduforge-server/           # Backend Node.js/Express application
├── controllers/           # Request handlers
│   ├── authController.js
│   ├── courseController.js
│   ├── recommendationController.js
│   └── ...
├── middleware/            # Express middleware
├── models/                # Mongoose data models
│   ├── User.js
│   ├── Course.js
│   ├── Enrollment.js
│   └── ...
├── routes/                # API routes
├── scripts/               # Utility scripts
└── utils/                 # Helper functions
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Backend Setup
1. Navigate to the server directory:
   ```bash
   cd eduforge-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd eduforge-client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user and get token
- `GET /api/auth/me` - Get current user profile

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course details
- `POST /api/courses` - Create a new course (admin only)
- `PUT /api/courses/:id` - Update course (admin only)
- `DELETE /api/courses/:id` - Delete course (admin only)

### Recommendations
- `GET /api/recommendations` - Get personalized course recommendations
- `GET /api/recommendations/trending` - Get trending courses

### Enrollments
- `POST /api/enrollments` - Enroll in a course
- `GET /api/enrollments/user` - Get current user's enrollments
- `GET /api/enrollments/course/:courseId` - Get course enrollments (admin only)

### Progress
- `GET /api/progress/:courseId` - Get user progress in a course
- `PUT /api/progress/:courseId` - Update user progress
- `GET /api/progress/analytics` - Get aggregated progress data

### Certificates
- `GET /api/certificates/user` - Get user's earned certificates
- `GET /api/certificates/:id` - Get certificate details
- `GET /api/certificates/verify/:code` - Verify certificate authenticity

## 🔒 Security Features
- JWT-based authentication
- Password hashing
- Role-based access control
- Protected routes
- Input validation

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd eduforge-server
npm test

# Frontend tests
cd eduforge-client
npm test
```

## 🚀 Deployment

The application can be deployed using various platforms:

### Frontend
- Vercel
- Netlify
- AWS S3 + CloudFront

### Backend
- Heroku
- AWS EC2
- Digital Ocean

## 🤝 Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## 📄 License
This project is licensed under the MIT License - see the LICENSE.md file for details.

## 👥 Team
- Your Team Members Here