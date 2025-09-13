import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp, MessageCircle, Send } from 'lucide-react';
import api from '../utils/axiosConfig';

const CourseRating = ({ courseId }) => {
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReviews();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/courses/${courseId}/reviews`);
      setReviews(response.data);
    } catch (err) {
      setError('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!comment) {
      setError('Please add a comment to your review.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/courses/${courseId}/reviews`, { rating, comment });
      setComment('');
      setRating(5);
      fetchReviews(); // Refresh reviews after submission
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review. You may have already reviewed this course.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (currentRating, onStarClick = null, onHover = null, onLeave = null, starSize = 'w-8 h-8') => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onStarClick && onStarClick(star)}
          onMouseEnter={() => onHover && onHover(star)}
          onMouseLeave={() => onLeave && onLeave()}
          className="focus:outline-none text-gray-300 dark:text-gray-600"
          disabled={!onStarClick}
        >
          <Star
            className={`${starSize} transition-colors ${
              (hover || currentRating) >= star
                ? 'text-yellow-400 fill-current'
                : ''
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-xl p-6 sm:p-8">
      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Student Reviews</h3>

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="mb-10 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
        <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">Leave Your Review</h4>
        <div className="mb-4">
          {renderStars(rating, setRating, setHover, () => setHover(null))}
        </div>
        <div className="mb-4">
          <textarea
            id="comment"
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="What did you think of the course?"
            required
          ></textarea>
        </div>

        {error && (
          <div className="mb-4 text-red-500 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 p-3 rounded-lg text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition-all"
        >
          <Send className="w-5 h-5 mr-2" />
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>

      {/* Reviews List */}
      {loading ? (
        <div className="text-center text-gray-500 dark:text-gray-400">Loading reviews...</div>
      ) : (
        <div className="space-y-8">
          {reviews.length > 0 ? reviews.map((review) => (
            <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0">
              <div className="flex items-start">
                <img
                  src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name}&background=random`}
                  alt={review.user?.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{review.user?.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    {renderStars(review.rating, null, null, null, 'w-5 h-5')}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-3">{review.comment}</p>
                  {/* <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                    <button className="flex items-center hover:text-purple-600 dark:hover:text-purple-400">
                      <ThumbsUp className="w-4 h-4 mr-1" />
                      Helpful
                    </button>
                    <button className="flex items-center hover:text-purple-600 dark:hover:text-purple-400">
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Reply
                    </button>
                  </div> */}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              <p className="font-semibold">No reviews yet.</p>
              <p>Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseRating;
