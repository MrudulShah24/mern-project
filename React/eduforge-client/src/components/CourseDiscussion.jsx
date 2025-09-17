import React, { useState, useEffect } from 'react';
import { Send, Star } from 'lucide-react';
import api from '../utils/axiosConfig';

// A simple skeleton loader for individual list items
const ItemSkeleton = () => (
  <div className="flex space-x-3 animate-pulse">
    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
    <div className="flex-1 space-y-2">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    </div>
  </div>
);

const CourseDiscussion = ({ courseId }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [reviews, setReviews] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'discussions'

  useEffect(() => {
    fetchReviewsAndDiscussions();
  }, [courseId]);

  const fetchReviewsAndDiscussions = async () => {
    try {
      setLoading(true);
      const [reviewsRes, discussionsRes] = await Promise.all([
        api.get(`/courses/${courseId}/reviews`),
        api.get(`/courses/${courseId}/discussions`)
      ]);
      setReviews(reviewsRes.data);
      setDiscussions(discussionsRes.data);
    } catch (err) {
      setError('Failed to load reviews and discussions');
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!newReview.comment) {
      setError('Please enter a comment for your review.');
      return;
    }
    try {
      await api.post(`/courses/${courseId}/reviews`, newReview);
      setNewReview({ rating: 5, comment: '' });
      fetchReviewsAndDiscussions();
      setError('');
    } catch (err) {
      setError('Failed to submit review. You may have already reviewed this course.');
    }
  };

  const submitMessage = async (e) => {
    e.preventDefault();
    if (!newMessage) return;
    try {
      await api.post(`/courses/${courseId}/discussions`, { content: newMessage });
      setNewMessage('');
      fetchReviewsAndDiscussions();
      setError('');
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const renderLoading = () => (
    <div className="space-y-6">
      <ItemSkeleton />
      <ItemSkeleton />
      <ItemSkeleton />
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800/50 rounded-xl shadow-md p-6">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button
          onClick={() => setActiveTab('reviews')}
          className={`px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === 'reviews'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab('discussions')}
          className={`px-4 py-3 font-medium text-sm transition-colors ${
            activeTab === 'discussions'
              ? 'border-b-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          Discussions ({discussions.length})
        </button>
      </div>

      {error && <div className="text-red-500 bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-600 p-3 rounded-lg mb-4">{error}</div>}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div>
          {/* Submit Review Form */}
          <form onSubmit={submitReview} className="mb-8 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <h3 className="font-semibold text-lg mb-4 text-gray-800 dark:text-gray-200">Leave a Review</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Rating
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="text-gray-300 hover:text-yellow-400 transition-colors"
                  >
                    <Star className={`w-7 h-7 ${ star <= newReview.rating ? 'text-yellow-400 fill-current' : '' }`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <textarea
                value={newReview.comment}
                onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows="3"
                placeholder="Share your thoughts on the course..."
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="px-5 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors"
            >
              Submit Review
            </button>
          </form>

          {/* Reviews List */}
          {loading ? renderLoading() : (
            <div className="space-y-6">
              {reviews.length > 0 ? reviews.map((review) => (
                <div key={review._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <img
                        src={review.user?.avatar || `https://ui-avatars.com/api/?name=${review.user?.name}&background=random`}
                        alt={review.user?.name}
                        className="w-10 h-10 rounded-full mr-3"
                      />
                      <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">{review.user?.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 pl-13">{review.comment}</p>
                </div>
              )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">No reviews yet. Be the first to leave one!</p>}
            </div>
          )}
        </div>
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <div>
          {/* Discussion List */}
          <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto pr-2">
            {loading ? renderLoading() : (
              discussions.length > 0 ? discussions.map((message) => (
                <div key={message._id} className="flex space-x-3">
                  <img
                    src={message.user?.avatar || `https://ui-avatars.com/api/?name=${message.user?.name}&background=random`}
                    alt={message.user?.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1">
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="font-medium text-gray-800 dark:text-gray-200">{message.user?.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{message.content}</p>
                    </div>
                    {/* Replies can be implemented here if needed */}
                  </div>
                </div>
              )) : <p className="text-center text-gray-500 dark:text-gray-400 py-8">No discussions yet. Start a conversation!</p>
            )}
          </div>

          {/* New Message Form */}
          <form onSubmit={submitMessage} className="flex space-x-3 items-center sticky bottom-0 bg-white dark:bg-gray-800 py-4">
             <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=random`}
                alt={user?.name}
                className="w-10 h-10 rounded-full"
              />
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Ask a question or share your thoughts..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
            />
            <button
              type="submit"
              className="p-2 bg-purple-600 text-white rounded-full hover:bg-purple-700 disabled:bg-purple-400 dark:disabled:bg-purple-800 transition-colors"
              disabled={!newMessage}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CourseDiscussion;
