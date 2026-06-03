// utils/schemas.js
const { z } = require('zod');

// Authentication schemas
const registerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters long' }),
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters long' }),
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Invalid email address' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

// Course schemas
const courseSchema = z.object({
  title: z.string().trim().min(3, { message: 'Title must be at least 3 characters long' }),
  description: z.string().trim().min(10, { message: 'Description must be at least 10 characters long' }),
  price: z.number().nonnegative({ message: 'Price must be 0 or greater' }).optional().default(0),
  category: z.string().trim().min(1, { message: 'Category is required' }).optional(),
  tags: z.array(z.string()).optional(),
  thumbnail: z.string().trim().url({ message: 'Thumbnail must be a valid URL' }).optional(),
  duration: z.number().positive({ message: 'Duration must be positive' }).optional(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional().default('Beginner'),
  learningObjectives: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  modules: z.array(z.object({
    title: z.string().trim().min(1, { message: 'Module title is required' }),
    description: z.string().trim().optional(),
    lessons: z.array(z.object({
      title: z.string().trim().min(1, { message: 'Lesson title is required' }),
      content: z.string().trim().optional(),
      videoUrl: z.string().trim().optional(),
      duration: z.number().optional(),
    })).optional(),
  })).optional(),
  certificateAvailable: z.boolean().optional().default(false),
  status: z.enum(['draft', 'published', 'archived']).optional().default('draft'),
});

module.exports = {
  registerSchema,
  loginSchema,
  courseSchema,
};
