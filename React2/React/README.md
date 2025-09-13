# EduForge - Online Learning Platform

EduForge is a full-stack web application designed to provide a comprehensive platform for creating, managing, and enrolling in online courses. It features a modern, user-friendly interface and a robust backend to support a seamless learning experience.

## Features

- **User Authentication:** Secure user registration and login functionality.
- **Course Management:** Create, update, and delete courses with detailed descriptions, modules, and quizzes.
- **Course Enrollment:** Students can browse and enroll in available courses.
- **Interactive Learning:** Engage with course content, including video lectures, articles, and quizzes.
- **Progress Tracking:** Monitor course progress with a personalized dashboard.
- **Course Analytics:** Instructors can view detailed analytics for their courses, including enrollment numbers, completion rates, and student performance.
- **Discussion Forums:** A dedicated space for students and instructors to discuss course-related topics.
- **Admin Panel:** A centralized dashboard for administrators to manage users, courses, and site-wide settings.

## Tech Stack

### Frontend

- **React:** A JavaScript library for building user interfaces.
- **React Router:** For declarative routing in the application.
- **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
- **Recharts:** A composable charting library for data visualization.
- **Axios:** A promise-based HTTP client for making API requests.

### Backend

- **Node.js:** A JavaScript runtime for building server-side applications.
- **Express:** A fast, unopinionated, minimalist web framework for Node.js.
- **MongoDB:** A NoSQL database for storing application data.
- **Mongoose:** An ODM (Object Data Modeling) library for MongoDB and Node.js.
- **JSON Web Tokens (JWT):** For securing API endpoints and authenticating users.
- **bcrypt.js:** A library for hashing passwords.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js and npm installed on your machine.
- A MongoDB database instance (local or cloud-based).

### Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/your-username/eduforge.git
    cd eduforge
    ```

2.  **Set up the backend:**
    - Navigate to the `eduforge-server` directory:
      ```sh
      cd eduforge-server
      ```
    - Install the dependencies:
      ```sh
      npm install
      ```
    - Create a `.env` file in the `eduforge-server` directory and add the following environment variables:
      ```
      PORT=5000
      MONGO_URI=your_mongodb_connection_string
      JWT_SECRET=your_jwt_secret
      ```
    - Start the server:
      ```sh
      npm run dev
      ```

3.  **Set up the frontend:**
    - Open a new terminal and navigate to the `eduforge-client` directory:
      ```sh
      cd eduforge-client
      ```
    - Install the dependencies:
      ```sh
      npm install
      ```
    - Start the client:
      ```sh
      npm start
      ```

The application should now be running, with the frontend available at `http://localhost:3000` and the backend at `http://localhost:5000`.

## Available Scripts

### eduforge-client

- `npm start`: Runs the app in development mode.
- `npm run build`: Builds the app for production.
- `npm test`: Launches the test runner.

### eduforge-server

- `npm start`: Starts the server in production mode.
- `npm run dev`: Starts the server in development mode with `nodemon`.
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Frontend Setup
1. Navigate to eduforge-client directory:
```bash
cd eduforge-client
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm start
```

### Backend Setup
1. Navigate to eduforge-server directory:
```bash
cd eduforge-server
```

2. Install dependencies:
```bash
npm install
```

3. Create a .env file with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login

### Courses
- GET /api/courses - Get all courses
- POST /api/courses - Create new course (Admin only)
- GET /api/courses/:id - Get course details
- PUT /api/courses/:id - Update course (Admin only)
- DELETE /api/courses/:id - Delete course (Admin only)

### Enrollments
- POST /api/enrollments - Enroll in a course
- GET /api/enrollments/user/:userId - Get user enrollments
- GET /api/enrollments/course/:courseId - Get course enrollments

### Progress
- GET /api/progress/:userId/:courseId - Get user progress in course
- PUT /api/progress/:userId/:courseId - Update progress

### Messages
- POST /api/messages - Send message
- GET /api/messages/:userId - Get user messages

## Security Features
- JWT-based authentication
- Password hashing
- Role-based access control
- Protected routes
- Input validation

## Contributing
Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the LICENSE.md file for details
