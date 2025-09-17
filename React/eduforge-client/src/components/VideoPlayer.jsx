import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipForward, SkipBack, RefreshCw } from 'lucide-react';

const VideoPlayer = ({ 
  videoUrl, 
  title, 
  onComplete = () => {}, 
  autoComplete = true, 
  completionPercentage = 90 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [completionMarked, setCompletionMarked] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // Handle video metadata loading
  const handleLoadedMetadata = () => {
    setDuration(videoRef.current.duration);
    setLoading(false);
  };
  
  // Handle video playback errors
  const handleError = () => {
    console.error('Video error with URL:', videoUrl);
    setError('Error loading video. The video might be unavailable or the URL is incorrect.');
    setLoading(false);
  };
  
  // Check if video URL is valid on mount
  useEffect(() => {
    if (!videoUrl) {
      setError('No video URL provided');
      setLoading(false);
      return;
    }
    
    // Reset state when video URL changes
    setLoading(true);
    setError(null);
    setCompletionMarked(false);
    setProgress(0);
    setCurrentTime(0);
    
    // Handle YouTube embeds
    if (videoUrl.includes('youtube.com/embed/') || videoUrl.includes('youtu.be/')) {
      // YouTube videos will load via iframe, so we can consider it not loading
      setLoading(false);
    }
  }, [videoUrl]);
  
  // Toggle play/pause
  const togglePlay = () => {
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };
  
  // Update current time and progress
  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current.currentTime);
    const percent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(percent);
    
    // Mark video as complete when watched to the completion percentage
    if (autoComplete && 
        percent >= completionPercentage && 
        !completionMarked) {
      setCompletionMarked(true);
      onComplete();
    }
  };
  
  // Seek to a specific time when clicking on the progress bar
  const handleSeek = (e) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / progressBar.offsetWidth;
    videoRef.current.currentTime = pos * videoRef.current.duration;
  };
  
  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    videoRef.current.volume = newVolume;
    setIsMuted(newVolume === 0);
  };
  
  // Toggle mute
  const toggleMute = () => {
    if (isMuted) {
      videoRef.current.volume = volume;
    } else {
      videoRef.current.volume = 0;
    }
    setIsMuted(!isMuted);
  };
  
  // Skip forward 10 seconds
  const skipForward = () => {
    videoRef.current.currentTime += 10;
  };
  
  // Skip backward 10 seconds
  const skipBackward = () => {
    videoRef.current.currentTime -= 10;
  };
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  // Format time in MM:SS format
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div 
      className="relative bg-black rounded-lg overflow-hidden"
      ref={containerRef}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-10">
          <div className="text-white text-center p-4">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={() => { setError(null); if (videoRef.current) videoRef.current.load(); }}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              <RefreshCw className="w-4 h-4 inline mr-1" />
              Retry
            </button>
          </div>
        </div>
      )}
      
      {/* Use iframe for YouTube videos, video element for others */}
      {videoUrl && videoUrl.includes('youtube.com/embed/') ? (
        <div className="aspect-video w-full">
          <iframe
            src={videoUrl}
            className="w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "Video"}
            onLoad={() => {
              setLoading(false);
              // Auto-mark YouTube videos as complete after 2 seconds since we can't track their progress
              if (autoComplete) {
                setTimeout(() => {
                  if (!completionMarked) {
                    setCompletionMarked(true);
                    onComplete();
                  }
                }, 2000);
              }
            }}
          />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-auto"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onEnded={() => { setIsPlaying(false); onComplete(); }}
        />
      )}
      
      {/* Video Controls - Only show for native video, not for YouTube */}
      {videoUrl && !videoUrl.includes('youtube.com/embed/') && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          {/* Progress Bar */}
          <div 
            className="h-1 bg-gray-600 rounded-full mb-2 cursor-pointer"
            onClick={handleSeek}
          >
            <div 
              className="h-full bg-purple-600 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* Play/Pause Button */}
              <button 
                onClick={togglePlay}
                className="text-white hover:text-purple-400 transition-colors"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
              
              {/* Skip Backward Button */}
              <button 
                onClick={skipBackward}
                className="text-white hover:text-purple-400 transition-colors"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              
              {/* Skip Forward Button */}
              <button 
                onClick={skipForward}
                className="text-white hover:text-purple-400 transition-colors"
              >
                <SkipForward className="w-5 h-5" />
              </button>
              
              {/* Time Display */}
              <div className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Volume Control */}
              <div className="flex items-center">
                <button 
                  onClick={toggleMute}
                  className="text-white hover:text-purple-400 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </button>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 ml-2"
                />
              </div>
              
              {/* Fullscreen Button */}
              <button 
                onClick={toggleFullscreen}
                className="text-white hover:text-purple-400 transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Video Title Overlay */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black to-transparent p-4">
        <h3 className="text-white text-lg font-medium">{title}</h3>
      </div>
    </div>
  );
};

export default VideoPlayer;