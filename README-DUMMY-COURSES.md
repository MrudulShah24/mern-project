# Dummy Course Generator for EduForge

This guide explains how to use the professional-quality dummy course generator for the EduForge platform.

## Features

- Generates realistic course data with detailed modules, lessons, and interactive content
- Creates a variety of course categories including Web Development, Data Science, Machine Learning, etc.
- Includes quizzes, video lessons, code exercises, and text-based content
- Simulates enrollments, ratings, and reviews to make the platform look active

## Methods to Generate Dummy Courses

### Method 1: Using Admin Panel (Recommended)

1. Log in to the EduForge platform with an admin account
2. Navigate to the Admin Panel
3. Click the "Generate Professional Courses" button
4. Wait for the process to complete (this might take a few minutes)
5. The page will automatically refresh when courses are generated

### Method 2: Using Command Line

You can also generate courses directly from the command line:

```bash
# Navigate to the server directory
cd eduforge-server

# Run the seed script
npm run seed:courses
```

### Method 3: Using API Endpoint

You can trigger course generation programmatically by calling the API endpoint:

```
POST /api/admin/generate-courses
```

*Note: This endpoint requires admin authentication.*

## Customization

The course generator is highly customizable. You can modify the following files to adjust the generated content:

- `eduforge-server/utils/dummyCoursesGenerator.js`: The main generator logic
- Categories, difficulty levels, and course types can be modified in this file

## Troubleshooting

If you encounter any issues with course generation:

1. Check the server logs for error messages
2. Ensure your MongoDB connection is working properly
3. Verify that you have admin privileges if using the admin panel or API
4. Check that all required dependencies are installed

## Notes

- The generation process creates 10-15 professional-quality courses
- Each course has 4-10 modules with various lessons
- The process may take a few minutes to complete
- Existing courses will not be affected by the generation process