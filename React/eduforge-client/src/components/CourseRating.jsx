import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, Flag, UserCircle, MoreHorizontal, Edit, Trash2, Filter } from 'lucide-react';
import api from '../utils/axiosConfig';

const StarRating = ({ value, onChange, readOnly = false, size = 'default' }) => {
  const [hoverRating, setHoverRating] = useState(0);
  
  const handleClick = (rating) => {
    if (!readOnly && onChange) onChange(rating);
  };
  
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8'
  };
  
  const starClass = sizeClasses[size] || sizeClasses.default;
  
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(rating => (
        <button
          key={rating}
          type="button"
          onClick={() => handleClick(rating)}
          onMouseEnter={() => !readOnly && setHoverRating(rating)}
          onMouseLeave={() => !readOnly && setHoverRating(0)}
          className={`${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
          disabled={readOnly}
        >
          <Star
            className={`${starClass} ${
              (hoverRating ? rating <= hoverRating : rating <= value)
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

const CourseRating = ({ courseId }) => {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    content: '',
    helpfulness: 0,
    courseCompletionPercentage: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterBy, setFilterBy] = useState('all');
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user')) || {};
  // Add a retry counter ref to prevent infinite retries
  const retryCount = React.useRef(0);
  const maxRetries = 2; // Maximum number of retries

  useEffect(() => {
    let isMounted = true;
    
    const fetchReviews = async () => {
      // Only try to fetch if we haven't exceeded retry limit
      if (retryCount.current >= maxRetries) {
        setError('Unable to load reviews at this time. Please try again later.');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        
        // Fetch reviews and stats, but handle them separately to avoid Promise.all failing completely
        let reviewsData = [];
        let statsData = {
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
        };
        
        try {
          const reviewsResponse = await api.get(`/reviews/courses/${courseId}/reviews?sort=${sortBy}&filter=${filterBy}`);
          if (isMounted) {
            reviewsData = reviewsResponse.data;
            setReviews(reviewsData);
          }
        } catch (reviewErr) {
          console.error('Failed to fetch reviews list:', reviewErr);
        }
        
        try {
          const statsResponse = await api.get(`/reviews/courses/${courseId}/reviews/stats`);
          if (isMounted) {
            statsData = statsResponse.data;
            setStats(statsData);
          }
        } catch (statsErr) {
          console.error('Failed to fetch review stats:', statsErr);
        }
        
        // Only try to fetch user review if we're authenticated
        if (user && user._id) {
          try {
            const userReviewResponse = await api.get(`/reviews/courses/${courseId}/reviews/user`);
            
            if (isMounted && userReviewResponse.data) {
              setUserReview(userReviewResponse.data);
              setFormData({
                rating: userReviewResponse.data.rating,
                title: userReviewResponse.data.title,
                content: userReviewResponse.data.content,
                helpfulness: userReviewResponse.data.helpfulness || 0,
                courseCompletionPercentage: userReviewResponse.data.courseCompletionPercentage || 0
              });
            }
          } catch (userReviewErr) {
            console.log('No user review found or error fetching it:', userReviewErr);
          }
        }
        
        // If at least one request succeeded, we consider it a partial success
        if (isMounted) {
          setLoading(false);
          setError('');
          retryCount.current = 0; // Reset retry count on success
        }
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
        if (isMounted) {
          setError('Failed to load reviews. Please try again later.');
          retryCount.current += 1;
          setLoading(false);
        }
      }
    };
    
    fetchReviews();
    
    return () => {
      isMounted = false; // Clean up to prevent state updates after unmount
    };
  }, [courseId, sortBy, filterBy]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRatingChange = (rating) => {
    setFormData(prev => ({ ...prev, rating }));
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      const reviewData = {
        ...formData,
        course: courseId
      };
      
      let response;
      if (editMode && userReview) {
        response = await api.put(`/reviews/courses/${courseId}/reviews/${userReview._id}`, reviewData);
        setUserReview(response.data);
        
        // Update review in the list
        setReviews(prev => prev.map(review => 
          review._id === userReview._id ? response.data : review
        ));
      } else {
        response = await api.post(`/reviews/courses/${courseId}/reviews`, reviewData);
        setUserReview(response.data);
        
        // Add new review to the list
        setReviews(prev => [response.data, ...prev]);
      }
      
      setShowReviewForm(false);
      setEditMode(false);
      
      // Refresh stats
      const statsResponse = await api.get(`/reviews/courses/${courseId}/reviews/stats`);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setError(err.response?.data?.error || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleEditReview = () => {
    setFormData({
      rating: userReview.rating,
      title: userReview.title,
      content: userReview.content,
      helpfulness: userReview.helpfulness,
      courseCompletionPercentage: userReview.courseCompletionPercentage
    });
    setEditMode(true);
    setShowReviewForm(true);
  };
  
  const handleDeleteReview = async () => {
    if (!userReview) return;
    
    if (!window.confirm('Are you sure you want to delete your review?')) {
      return;
    }
    
    try {
      await api.delete(`/reviews/courses/${courseId}/reviews/${userReview._id}`);
      
      // Remove from reviews list
      setReviews(prev => prev.filter(review => review._id !== userReview._id));
      setUserReview(null);
      
      // Reset form data
      setFormData({
        rating: 0,
        title: '',
        content: '',
        helpfulness: 0,
        courseCompletionPercentage: 0
      });
      
      // Refresh stats
      const statsResponse = await api.get(`/reviews/courses/${courseId}/reviews/stats`);
      setStats(statsResponse.data);
    } catch (err) {
      console.error('Failed to delete review:', err);
      setError('Failed to delete review. Please try again.');
    }
  };
  
  const handleHelpful = async (reviewId) => {
    try {
      const response = await api.post(`/reviews/courses/${courseId}/reviews/${reviewId}/helpful`);
      
      // Update the review in the list
      setReviews(prev => prev.map(review => 
        review._id === reviewId ? { ...review, helpfulCount: response.data.helpfulCount } : review
      ));
      
      // If it's the user's review, update that too
      if (userReview && userReview._id === reviewId) {
        setUserReview(prev => ({ ...prev, helpfulCount: response.data.helpfulCount }));
      }
    } catch (err) {
      console.error('Failed to mark review as helpful:', err);
    }
  };
  
  const handleReport = async (reviewId) => {
    try {
      await api.post(`/reviews/courses/${courseId}/reviews/${reviewId}/report`);
      alert('Review has been reported. Thank you for helping us maintain quality content.');
    } catch (err) {
      console.error('Failed to report review:', err);
      alert('Failed to report review. Please try again.');
    }
  };
  
  const getRatingPercentage = (rating) => {
    return stats.totalReviews > 0 
      ? Math.round((stats.ratingDistribution[rating] / stats.totalReviews) * 100) 
      : 0;
  };
  
  const renderRatingStats = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        <div className="text-center">
          <div className="text-5xl font-bold text-gray-900 dark:text-white mb-2">
            {stats.averageRating.toFixed(1)}
          </div>
          <StarRating value={Math.round(stats.averageRating)} readOnly size="large" />
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
          </div>
        </div>
        
        <div className="flex-1">
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className="flex items-center space-x-2 mb-2">
              <div className="text-sm font-medium w-3 text-gray-700 dark:text-gray-300">{rating}</div>
              <Star className="w-4 h-4 text-yellow-400" />
              <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-400 rounded-full"
                  style={{ width: `${getRatingPercentage(rating)}%` }}
                ></div>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 w-10">
                {getRatingPercentage(rating)}%
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {!userReview && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="mt-6 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
        >
          Write a Review
        </button>
      )}
    </div>
  );
  
  const renderReviewForm = () => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
        {editMode ? 'Edit Your Review' : 'Write a Review'}
      </h3>
      
      <form onSubmit={handleSubmitReview}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Overall Rating
          </label>
          <StarRating value={formData.rating} onChange={handleRatingChange} />
        </div>
        
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Review Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Summarize your experience"
            required
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Review Content
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            rows="4"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Share your experience with this course. What did you like or dislike?"
            required
          ></textarea>
        </div>
        
        <div className="mb-4">
          <label htmlFor="helpfulness" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Course Helpfulness
          </label>
          <select
            id="helpfulness"
            name="helpfulness"
            value={formData.helpfulness}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="0">Select...</option>
            <option value="1">Not helpful</option>
            <option value="2">Somewhat helpful</option>
            <option value="3">Helpful</option>
            <option value="4">Very helpful</option>
            <option value="5">Extremely helpful</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label htmlFor="courseCompletionPercentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            How much of the course have you completed?
          </label>
          <select
            id="courseCompletionPercentage"
            name="courseCompletionPercentage"
            value={formData.courseCompletionPercentage}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="0">Select...</option>
            <option value="25">Less than 25%</option>
            <option value="50">About 50%</option>
            <option value="75">About 75%</option>
            <option value="100">100% Completed</option>
          </select>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <div className="flex space-x-3">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : editMode ? 'Update Review' : 'Submit Review'}
          </button>
          
          <button
            type="button"
            onClick={() => { setShowReviewForm(false); setEditMode(false); }}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
  
  const renderUserReview = () => {
    if (!userReview) return null;
    
    return (
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-800 rounded-full p-3">
              <UserCircle className="w-6 h-6 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Your Review</h4>
              <div className="flex items-center space-x-2 mt-1">
                <StarRating value={userReview.rating} readOnly size="small" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(userReview.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={handleEditReview}
              className="p-1.5 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Edit className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteReview}
              className="p-1.5 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4">{userReview.title}</h3>
        <p className="text-gray-700 dark:text-gray-300 mt-2">{userReview.content}</p>
        
        {userReview.helpfulness > 0 && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
            Helpfulness: {['', 'Not helpful', 'Somewhat helpful', 'Helpful', 'Very helpful', 'Extremely helpful'][userReview.helpfulness]}
          </div>
        )}
        
        {userReview.courseCompletionPercentage > 0 && (
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Course completion: {userReview.courseCompletionPercentage}%
          </div>
        )}
      </div>
    );
  };
  
  const renderReviewFilters = () => (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div className="text-xl font-semibold text-gray-800 dark:text-white">
        {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
      </div>
      
      <div className="flex flex-wrap gap-4">
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="appearance-none pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="helpful">Most Helpful</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        <div className="relative">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="appearance-none pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
          >
            <option value="all">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
            <option value="completed">Completed Course</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Filter className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
  
  const renderReviewList = () => (
    <div>
      {renderReviewFilters()}
      
      {reviews.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-10 text-center">
          <MessageCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No Reviews Yet</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Be the first to share your experience with this course.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div
              key={review._id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-3">
                    <UserCircle className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {review.user?.name || 'Anonymous'}
                    </h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <StarRating value={review.rating} readOnly size="small" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  {review.user?._id !== user?._id && (
                    <button
                      onClick={() => handleReport(review._id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                      title="Report"
                    >
                      <Flag className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-4">{review.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 mt-2">{review.content}</p>
              
              {review.helpfulness > 0 && (
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
                  Helpfulness: {['', 'Not helpful', 'Somewhat helpful', 'Helpful', 'Very helpful', 'Extremely helpful'][review.helpfulness]}
                </div>
              )}
              
              {review.courseCompletionPercentage > 0 && (
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Course completion: {review.courseCompletionPercentage}%
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-between">
                <button
                  onClick={() => handleHelpful(review._id)}
                  className="flex items-center space-x-1 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful{review.helpfulCount > 0 ? ` (${review.helpfulCount})` : ''}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  
  // Show loading state only on first load
  if (loading && !userReview && reviews.length === 0) {
    return (
      <div className="animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg mb-8"></div>
        <div className="space-y-6">
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  // Show error state with fallback UI when error occurs and we have no data
  if (error && reviews.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Student Reviews</h2>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="text-red-500 dark:text-red-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Unable to Load Reviews
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {error}
          </p>
          <div className="mt-4">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Student Reviews</h2>
      
      {renderRatingStats()}
      
      {user && user._id && showReviewForm && renderReviewForm()}
      
      {!showReviewForm && userReview && renderUserReview()}
      
      {renderReviewList()}
      
      {error && reviews.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-300">
          {error}
          <button 
            onClick={() => window.location.reload()}
            className="ml-4 px-2 py-1 bg-red-100 dark:bg-red-800 rounded text-xs font-medium hover:bg-red-200 dark:hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseRating;
