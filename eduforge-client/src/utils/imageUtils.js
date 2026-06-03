// Helper function to get course thumbnail images
const courseImages = {
  // Exact file paths as provided
  'cissp': '/images/course-thumbnails/CISSP_Course.png',
  'vue': '/images/course-thumbnails/VueJs_Course.png',
  'data visualization': '/images/course-thumbnails/Data_Visualization_Course.png',
  'data analysis': '/images/course-thumbnails/Data_Analysis_Course.png',
  'web design': '/images/course-thumbnails/Web_Design_Guide_Course.png'
};

// Get a thumbnail based on course title, category or ID
export const getCourseThumbnail = (course) => {
  // If the course already has a valid thumbnail, use it
  if (course.thumbnail && !course.thumbnail.includes('placeholder')) {
    return course.thumbnail;
  }
  
  // Look for specific course matches based on title or category
  const title = (course.title || '').toLowerCase();
  const category = (course.category || '').toLowerCase();
  
  // CISSP courses
  if (title.includes('cissp') || 
      title.includes('security') || 
      category.includes('cissp') || 
      category.includes('security') ||
      category.includes('certification')) {
    return courseImages.cissp;
  }
  
  // Vue.js courses
  if (title.includes('vue') || 
      title.includes('vue.js') || 
      title.includes('javascript framework') ||
      category.includes('vue') || 
      category.includes('javascript') ||
      category.includes('frontend')) {
    return courseImages.vue;
  }
  
  // Data Visualization courses
  if (title.includes('data visualization') || 
      title.includes('visualize') || 
      title.includes('charts') ||
      title.includes('tableau') ||
      category.includes('visualization') ||
      category.includes('data visualization')) {
    return courseImages['data visualization'];
  }
  
  // Data Analysis courses
  if (title.includes('data analysis') || 
      title.includes('analytics') || 
      title.includes('data science') ||
      title.includes('statistics') ||
      category.includes('analysis') || 
      category.includes('analytics') ||
      category.includes('data')) {
    return courseImages['data analysis'];
  }
  
  // Web Design courses
  if (title.includes('web design') || 
      title.includes('html') || 
      title.includes('css') ||
      title.includes('ui') ||
      title.includes('ux') ||
      category.includes('web design') || 
      category.includes('design') ||
      category.includes('web')) {
    return courseImages['web design'];
  }
  
  // If no specific match, determine based on course ID to ensure consistent assignment
  if (course._id) {
    const idLastChar = course._id.toString().slice(-1);
    const idValue = parseInt(idLastChar, 16) % 5;
    
    // Assign one of the 5 images based on the ID
    switch(idValue) {
      case 0: return courseImages.cissp;
      case 1: return courseImages.vue;
      case 2: return courseImages['data visualization'];
      case 3: return courseImages['data analysis'];
      case 4: 
      default: return courseImages['web design'];
    }
  }
  
  // Default fallback if nothing else matches
  return courseImages['web design'];
};

// Fallback image if the selected thumbnail fails to load
export const fallbackThumbnail = '/images/course-thumbnails/Web_Design_Guide_Course.png';

export default {
  getCourseThumbnail,
  fallbackThumbnail,
  courseImages
};