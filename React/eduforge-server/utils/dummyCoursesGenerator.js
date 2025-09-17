/**
 * Dummy Course Generator
 * Creates professional-quality sample courses with detailed modules, lessons, and interactive content
 */

const mongoose = require('mongoose');
const Course = require('../models/Course');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Course categories
const CATEGORIES = [
  'Web Development', 
  'Mobile Development',
  'Data Science',
  'Machine Learning',
  'Cloud Computing',
  'DevOps',
  'Cybersecurity',
  'Business',
  'Design',
  'Marketing'
];

// Course subcategories
const SUBCATEGORIES = {
  'Web Development': ['Frontend', 'Backend', 'Full Stack', 'JavaScript', 'React', 'Node.js', 'Vue.js', 'Angular'],
  'Mobile Development': ['Android', 'iOS', 'React Native', 'Flutter', 'Swift', 'Kotlin'],
  'Data Science': ['Python', 'R', 'Data Analysis', 'Data Visualization', 'Statistics', 'Big Data'],
  'Machine Learning': ['Deep Learning', 'TensorFlow', 'PyTorch', 'Natural Language Processing', 'Computer Vision'],
  'Cloud Computing': ['AWS', 'Azure', 'Google Cloud', 'Cloud Architecture', 'Serverless'],
  'DevOps': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Git', 'Infrastructure as Code'],
  'Cybersecurity': ['Network Security', 'Ethical Hacking', 'Security+', 'CISSP', 'Penetration Testing'],
  'Business': ['Entrepreneurship', 'Project Management', 'Leadership', 'Agile', 'Scrum', 'MBA'],
  'Design': ['UI/UX', 'Graphic Design', 'Web Design', 'Adobe Creative Suite', 'Figma'],
  'Marketing': ['Digital Marketing', 'SEO', 'Social Media Marketing', 'Content Marketing', 'Email Marketing']
};

// Course tags
const TAGS = {
  'Web Development': ['html', 'css', 'javascript', 'web', 'react', 'nodejs', 'frontend', 'backend'],
  'Mobile Development': ['android', 'ios', 'mobile', 'app development', 'react native', 'flutter'],
  'Data Science': ['python', 'data', 'analytics', 'pandas', 'numpy', 'jupyter', 'visualization'],
  'Machine Learning': ['ai', 'deep learning', 'neural networks', 'tensorflow', 'pytorch', 'algorithms'],
  'Cloud Computing': ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'iaas', 'paas', 'saas'],
  'DevOps': ['docker', 'kubernetes', 'ci/cd', 'jenkins', 'git', 'devops', 'automation'],
  'Cybersecurity': ['security', 'hacking', 'encryption', 'network', 'firewall', 'pentesting'],
  'Business': ['management', 'leadership', 'entrepreneurship', 'startup', 'agile', 'scrum'],
  'Design': ['ui', 'ux', 'user experience', 'photoshop', 'illustrator', 'figma', 'sketch'],
  'Marketing': ['digital marketing', 'seo', 'social media', 'content', 'email', 'analytics']
};

// Course levels
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Video providers
const VIDEO_PROVIDERS = ['youtube', 'vimeo'];

// Sample YouTube video IDs for different categories
const SAMPLE_VIDEOS = {
  'Web Development': [
    'W6NZfCO5SIk', 'hdI2bqOjy3c', 'PkZNo7MFNFg', 'NCwa_xi0Uuc', 
    'DLX62G4lc44', 'gQojMIhELvM', 'QFaFIcGhPoM', 'VfGW0Qiy2I0'
  ],
  'Mobile Development': [
    'ur6I5m2nTvk', 'AyLYd7UXLSc', 'tz-Y1RUMrfw', 'CuZA9ehp18E',
    'VHbSopMyc4M', 'cDTpncX1FL8', 'EgQTqAp4M7s', '0LhBvp8qpro'
  ],
  'Data Science': [
    'ua-CiDNNj30', '_uQrJ0TkZlc', 'r-uOLxNrNk8', 'GPVsHOlRBBI',
    'QDgwX8HQ-TE', 'rfscVS0vtbw', 'kqtD5dpn9C8', 'B9nFMZIYQYk'
  ],
  'Machine Learning': [
    'aircAruvnKk', 'QckIzHC99Xc', '5tvmMX8r_OM', 'rMFWWu-zU7U',
    'jGwO_UgTS7I', 'XfoYk_Z5AkI', 'tPYj3fFJGjk', 'VwVg9jCtqaU'
  ],
  'Default': [
    'dQw4w9WgXcQ', 'jNQXAC9IVRw', 'W0-ViIiI-Qo', 'TcMBFSGVi1c',
    'EhL2COwXFXQ', 'ZiE3aVQGf8s', 'cHHLHGNpCSA', 'mQlJqWEjJUY'
  ]
};

// Sample code snippets for different categories
const CODE_SNIPPETS = {
  'Web Development': {
    javascript: `// Simple React component
import React, { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>
        Click me
      </button>
    </div>
  );
}

export default Counter;`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Modern Web Page</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <header>
    <nav>
      <div class="logo">Company</div>
      <ul>
        <li><a href="#home">Home</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
    </nav>
  </header>
  
  <main>
    <section id="hero">
      <h1>Welcome to Our Website</h1>
      <p>Learn modern web development techniques</p>
      <button>Get Started</button>
    </section>
  </main>
  
  <footer>
    <p>&copy; 2025 Company. All rights reserved.</p>
  </footer>
  
  <script src="script.js"></script>
</body>
</html>`
  },
  'Mobile Development': {
    javascript: `// React Native component
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const App = () => {
  const [count, setCount] = useState(0);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to React Native</Text>
      <Text style={styles.counter}>Count: {count}</Text>
      <Button title="Increment" onPress={() => setCount(count + 1)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  title: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  counter: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 15,
  },
});

export default App;`,
    java: `// Android Activity
package com.example.myapp;

import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class MainActivity extends AppCompatActivity {
    private int count = 0;
    private TextView countTextView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        countTextView = findViewById(R.id.count_text);
        Button incrementButton = findViewById(R.id.increment_button);

        incrementButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                count++;
                countTextView.setText("Count: " + count);
            }
        });
    }
}`
  },
  'Data Science': {
    python: `# Data analysis with pandas
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

# Load the dataset
df = pd.read_csv('sales_data.csv')

# View the first few rows
print(df.head())

# Basic statistics
print(df.describe())

# Group by and aggregate
monthly_sales = df.groupby('month')['sales'].sum().reset_index()

# Create a visualization
plt.figure(figsize=(12, 6))
sns.barplot(x='month', y='sales', data=monthly_sales)
plt.title('Monthly Sales Performance')
plt.xlabel('Month')
plt.ylabel('Total Sales ($)')
plt.xticks(rotation=45)
plt.tight_layout()
plt.show()

# Correlation analysis
correlation = df.corr()
plt.figure(figsize=(10, 8))
sns.heatmap(correlation, annot=True, cmap='coolwarm')
plt.title('Correlation Matrix')
plt.tight_layout()
plt.show()`
  },
  'Machine Learning': {
    python: `# Simple neural network with TensorFlow
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.datasets import mnist
import numpy as np

# Load and preprocess the MNIST dataset
(x_train, y_train), (x_test, y_test) = mnist.load_data()
x_train = x_train.reshape(-1, 28*28).astype('float32') / 255.0
x_test = x_test.reshape(-1, 28*28).astype('float32') / 255.0

# One-hot encode the labels
y_train = tf.keras.utils.to_categorical(y_train, 10)
y_test = tf.keras.utils.to_categorical(y_test, 10)

# Build the model
model = Sequential([
    Dense(128, activation='relu', input_shape=(784,)),
    Dense(64, activation='relu'),
    Dense(10, activation='softmax')
])

# Compile the model
model.compile(
    optimizer='adam',
    loss='categorical_crossentropy',
    metrics=['accuracy']
)

# Train the model
history = model.fit(
    x_train, y_train,
    batch_size=64,
    epochs=5,
    validation_split=0.2
)

# Evaluate the model
test_loss, test_acc = model.evaluate(x_test, y_test)
print(f'Test accuracy: {test_acc:.3f}')`
  },
  'Default': {
    javascript: `// Hello World function
function sayHello() {
  console.log("Hello, World!");
}

sayHello();`,
    python: `# Hello World program
def say_hello():
    print("Hello, World!")

if __name__ == "__main__":
    say_hello()`
  }
};

// Sample quiz questions for different categories
const QUIZ_QUESTIONS = {
  'Web Development': [
    {
      text: 'Which of the following is not a JavaScript framework?',
      options: [
        { text: 'React', isCorrect: false },
        { text: 'Angular', isCorrect: false },
        { text: 'Vue', isCorrect: false },
        { text: 'Django', isCorrect: true }
      ],
      explanation: 'Django is a Python web framework, not a JavaScript framework.'
    },
    {
      text: 'What does CSS stand for?',
      options: [
        { text: 'Computer Style Sheets', isCorrect: false },
        { text: 'Creative Style Sheets', isCorrect: false },
        { text: 'Cascading Style Sheets', isCorrect: true },
        { text: 'Colorful Style Sheets', isCorrect: false }
      ],
      explanation: 'CSS stands for Cascading Style Sheets, which is used for describing the presentation of a document written in HTML.'
    },
    {
      text: 'Which HTML tag is used to create a hyperlink?',
      options: [
        { text: '<a>', isCorrect: true },
        { text: '<h>', isCorrect: false },
        { text: '<p>', isCorrect: false },
        { text: '<link>', isCorrect: false }
      ],
      explanation: 'The <a> (anchor) tag is used to create hyperlinks in HTML.'
    }
  ],
  'Mobile Development': [
    {
      text: 'Which language is primarily used for iOS development?',
      options: [
        { text: 'Java', isCorrect: false },
        { text: 'Swift', isCorrect: true },
        { text: 'C#', isCorrect: false },
        { text: 'Kotlin', isCorrect: false }
      ],
      explanation: 'Swift is the primary programming language used for iOS app development.'
    },
    {
      text: 'What is the name of Google\'s UI toolkit for building natively compiled applications?',
      options: [
        { text: 'React Native', isCorrect: false },
        { text: 'Xamarin', isCorrect: false },
        { text: 'Flutter', isCorrect: true },
        { text: 'Ionic', isCorrect: false }
      ],
      explanation: 'Flutter is Google\'s UI toolkit for building natively compiled applications for mobile, web, and desktop from a single codebase.'
    }
  ],
  'Data Science': [
    {
      text: 'Which Python library is commonly used for data manipulation and analysis?',
      options: [
        { text: 'NumPy', isCorrect: false },
        { text: 'Pandas', isCorrect: true },
        { text: 'Matplotlib', isCorrect: false },
        { text: 'Scikit-learn', isCorrect: false }
      ],
      explanation: 'Pandas is a Python library providing high-performance, easy-to-use data structures and data analysis tools.'
    },
    {
      text: 'What does the acronym SQL stand for?',
      options: [
        { text: 'Structured Query Language', isCorrect: true },
        { text: 'Standard Query Language', isCorrect: false },
        { text: 'Simple Question Language', isCorrect: false },
        { text: 'System Query Language', isCorrect: false }
      ],
      explanation: 'SQL stands for Structured Query Language, which is used for managing and manipulating relational databases.'
    }
  ],
  'Default': [
    {
      text: 'What does HTML stand for?',
      options: [
        { text: 'Hyper Text Markup Language', isCorrect: true },
        { text: 'High Text Machine Language', isCorrect: false },
        { text: 'Hyper Transfer Markup Language', isCorrect: false },
        { text: 'Home Tool Markup Language', isCorrect: false }
      ],
      explanation: 'HTML stands for Hyper Text Markup Language, which is the standard markup language for creating web pages.'
    },
    {
      text: 'Which programming language is known as the "mother of all languages"?',
      options: [
        { text: 'Java', isCorrect: false },
        { text: 'C', isCorrect: true },
        { text: 'Python', isCorrect: false },
        { text: 'JavaScript', isCorrect: false }
      ],
      explanation: 'C is often referred to as the "mother of all languages" because many modern programming languages have derived syntax and features from it.'
    }
  ]
};

// Instructor data
const INSTRUCTORS = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@example.com',
    password: 'password123',
    bio: 'Dr. Sarah Johnson is a Professor of Computer Science with over 15 years of experience in web development and software engineering. She has worked at Google and Microsoft and now teaches full-time.',
    role: 'instructor'
  },
  {
    name: 'Michael Chen',
    email: 'michael.chen@example.com',
    password: 'password123',
    bio: 'Michael Chen is a Senior Mobile Developer with 10+ years of experience developing iOS and Android applications. He has created apps with millions of downloads and now shares his knowledge through teaching.',
    role: 'instructor'
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@example.com',
    password: 'password123',
    bio: 'Dr. Rodriguez holds a PhD in Data Science and has worked as a Data Scientist at Netflix and Amazon. She specializes in machine learning and predictive analytics.',
    role: 'instructor'
  },
  {
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    password: 'password123',
    bio: 'James Wilson is a DevOps Engineer and Cloud Architect with certifications in AWS, Azure, and Google Cloud. He has helped dozens of companies migrate to the cloud and implement CI/CD pipelines.',
    role: 'instructor'
  },
  {
    name: 'Sophia Patel',
    email: 'sophia.patel@example.com',
    password: 'password123',
    bio: 'Sophia Patel is a UI/UX Designer who has worked with startups and Fortune 500 companies. She combines design theory with practical applications to create user-friendly interfaces.',
    role: 'instructor'
  }
];

// Helper function to get a random item from an array
const getRandomItem = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get multiple random items from an array
const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Generate a random price between min and max
const getRandomPrice = (min, max) => Math.floor(Math.random() * (max - min + 1) + min) * 5;

// Create a random course
const createCourse = async (instructor) => {
  const category = getRandomItem(CATEGORIES);
  const subcategory = getRandomItem(SUBCATEGORIES[category] || []);
  const level = getRandomItem(LEVELS);
  const tags = getRandomItems(TAGS[category] || TAGS['Default'], Math.floor(Math.random() * 5) + 3);
  
  // Generate modules (2-6 modules per course)
  const moduleCount = Math.floor(Math.random() * 5) + 2;
  const modules = [];
  
  let totalDuration = 0;
  
  for (let i = 0; i < moduleCount; i++) {
    // Generate lessons (3-8 lessons per module)
    const lessonCount = Math.floor(Math.random() * 6) + 3;
    const lessons = [];
    
    let moduleDuration = 0;
    
    for (let j = 0; j < lessonCount; j++) {
      // Randomly determine lesson type
      const hasVideo = Math.random() > 0.2; // 80% chance of having a video
      const hasQuiz = Math.random() > 0.6; // 40% chance of having a quiz
      const hasCodeExercise = Math.random() > 0.7; // 30% chance of having a code exercise
      
      // Get video if applicable
      const videoProvider = getRandomItem(VIDEO_PROVIDERS);
      const videoId = getRandomItem(SAMPLE_VIDEOS[category] || SAMPLE_VIDEOS['Default']);
      const videoUrl = videoProvider === 'youtube' ? `https://www.youtube.com/embed/${videoId}` : null;
      
      // Generate quiz if applicable
      let quiz = null;
      if (hasQuiz) {
        const questions = QUIZ_QUESTIONS[category] || QUIZ_QUESTIONS['Default'];
        quiz = {
          title: `Lesson ${j + 1} Quiz`,
          description: 'Test your knowledge of the concepts covered in this lesson.',
          timeLimit: Math.floor(Math.random() * 10) + 5, // 5-15 minutes
          passingScore: 70,
          questions: getRandomItems(questions, Math.floor(Math.random() * 3) + 2) // 2-4 questions
        };
      }
      
      // Generate code exercise if applicable
      let codeExercise = null;
      if (hasCodeExercise) {
        const language = ['javascript', 'python', 'java', 'html', 'css'][Math.floor(Math.random() * 5)];
        const snippets = CODE_SNIPPETS[category] || CODE_SNIPPETS['Default'];
        const starterCode = snippets[language] || snippets['javascript'] || '// Write your code here';
        
        codeExercise = {
          title: `Coding Exercise: Lesson ${j + 1}`,
          description: 'Apply what you\'ve learned by completing this coding exercise.',
          instructions: 'Follow the instructions in the comments and implement the required functionality.',
          language,
          starterCode,
          expectedPatterns: ['function', 'return', 'console.log'],
          avoidPatterns: ['eval', 'alert'],
          testCases: [
            { input: 'test input 1', expectedOutput: 'expected output 1', hidden: false },
            { input: 'test input 2', expectedOutput: 'expected output 2', hidden: true }
          ],
          difficulty: getRandomItem(['easy', 'medium', 'hard'])
        };
      }
      
      // Lesson duration in minutes
      const lessonDuration = Math.floor(Math.random() * 10) + 5; // 5-15 minutes
      moduleDuration += lessonDuration;
      
      lessons.push({
        title: `Lesson ${j + 1}: ${subcategory} Concepts ${j + 1}`,
        description: `Learn essential concepts about ${subcategory} in this comprehensive lesson.`,
        content: `<h2>Welcome to Lesson ${j + 1}</h2><p>In this lesson, you will learn about key concepts related to ${subcategory}. We'll cover theory and practical applications to help you master these skills.</p><p>Let's get started!</p>`,
        duration: lessonDuration,
        videoUrl,
        videoProvider,
        quiz,
        codeExercise,
        order: j + 1
      });
    }
    
    // Add end-of-module quiz
    const moduleQuiz = {
      title: `Module ${i + 1} Assessment`,
      description: 'Comprehensive assessment covering all topics in this module.',
      timeLimit: 30,
      passingScore: 70,
      questions: getRandomItems(QUIZ_QUESTIONS[category] || QUIZ_QUESTIONS['Default'], 5)
    };
    
    totalDuration += moduleDuration;
    
    modules.push({
      title: `Module ${i + 1}: ${subcategory} Fundamentals ${i + 1}`,
      description: `Master the fundamentals of ${subcategory} through hands-on lessons and practical exercises.`,
      duration: moduleDuration,
      lessons,
      quiz: moduleQuiz,
      order: i + 1
    });
  }
  
  // Create course object
  const course = new Course({
    title: `Complete ${subcategory} Guide: From Beginner to Professional`,
    description: `Learn ${subcategory} from scratch and become job-ready with this comprehensive course. Perfect for ${level.toLowerCase()} students who want to master ${category.toLowerCase()} skills.
    
    In this course, you will:
    - Understand core concepts of ${subcategory}
    - Build real-world projects that demonstrate your skills
    - Learn best practices used by industry professionals
    - Prepare for technical interviews in the field
    
    By the end of this course, you'll have the skills and confidence to pursue a career in ${category}.`,
    instructor: instructor._id,
    instructors: [instructor._id],
    price: getRandomPrice(20, 100),
    discount: {
      percentage: Math.random() > 0.7 ? Math.floor(Math.random() * 4) * 10 + 10 : 0, // 0%, 10%, 20%, 30% or 40% discount
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },
    rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 rating
    reviewCount: Math.floor(Math.random() * 500) + 50, // 50-550 reviews
    category,
    subcategory,
    tags,
    thumbnail: `https://source.unsplash.com/random/800x600?${category.toLowerCase().replace(/ /g, '-')}`,
    duration: totalDuration,
    level,
    learningObjectives: [
      `Understand core concepts of ${subcategory}`,
      `Build professional-quality ${category.toLowerCase()} projects`,
      `Implement best practices for ${subcategory}`,
      `Debug common issues in ${category.toLowerCase()} applications`,
      `Deploy your ${subcategory} projects to production`
    ],
    prerequisites: [
      level === 'Beginner' ? 'No prior experience required' : `Basic understanding of ${category}`,
      level === 'Advanced' ? `Intermediate knowledge of ${subcategory}` : 'Basic computer skills',
      'Willingness to learn and practice'
    ],
    targetAudience: [
      `Students interested in learning ${subcategory}`,
      `Professionals looking to upskill in ${category}`,
      `${level} learners who want to master ${subcategory}`,
      'Job seekers preparing for technical interviews'
    ],
    modules,
    certificateAvailable: true,
    certificateTemplate: 'default',
    enrolledCount: Math.floor(Math.random() * 10000) + 1000, // 1000-11000 students
    status: 'published',
    language: 'English',
    featured: Math.random() > 0.8, // 20% chance of being featured
    publishedAt: new Date(),
    updatedAt: new Date()
  });
  
  await course.save();
  console.log(`Created course: ${course.title}`);
  return course;
};

// Main function to generate sample data
const generateSampleData = async () => {
  console.log('Starting sample data generation...');
  
  try {
    // Check if instructors already exist
    const existingInstructors = await User.find({ role: 'instructor' });
    let instructors = [];
    
    if (existingInstructors.length > 0) {
      console.log('Using existing instructors...');
      instructors = existingInstructors;
    } else {
      console.log('Creating instructors...');
      // Create instructors
      for (const instructorData of INSTRUCTORS) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(instructorData.password, salt);
        
        const instructor = new User({
          ...instructorData,
          password: hashedPassword
        });
        
        await instructor.save();
        instructors.push(instructor);
      }
      console.log(`Created ${instructors.length} instructors`);
    }
    
    // Check if courses already exist
    const existingCourses = await Course.countDocuments();
    console.log(`${existingCourses} courses already exist. Generating new courses anyway...`);
    
    // Generate courses
    console.log('Creating courses...');
    const coursePromises = [];
    const courseCount = 15; // Number of courses to generate
    
    for (let i = 0; i < courseCount; i++) {
      const instructor = getRandomItem(instructors);
      coursePromises.push(createCourse(instructor));
    }
    
    await Promise.all(coursePromises);
    console.log(`Successfully created ${courseCount} courses`);
    
  } catch (error) {
    console.error('Error generating sample data:', error);
  }
};

module.exports = generateSampleData;