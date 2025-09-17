import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Play, Code, Save, Copy, Download } from 'lucide-react';
import lessonService from '../services/lessonService';

const CodeExercise = ({ 
  exerciseData, 
  courseId, 
  moduleId, 
  lessonId, 
  onComplete = () => {}
}) => {
  const [code, setCode] = useState(exerciseData?.starterCode || '');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error', null
  const [feedback, setFeedback] = useState('');
  const [showHint, setShowHint] = useState(false);
  
  // Load saved code if available
  useEffect(() => {
    const loadSavedCode = async () => {
      try {
        const response = await lessonService.getSavedCode(courseId, moduleId, lessonId);
        
        if (response && response.code) {
          setCode(response.code);
        }
      } catch (err) {
        console.error('Failed to load saved code:', err);
        // Fall back to starter code, which is already set
      }
    };
    
    if (courseId && moduleId && lessonId) {
      loadSavedCode();
    }
  }, [courseId, moduleId, lessonId, exerciseData?.starterCode]);
  
  // Run the code
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput('');
    setStatus(null);
    
    try {
      const response = await lessonService.runCode(code, exerciseData.language);
      setOutput(response.output);
    } catch (err) {
      console.error('Failed to run code:', err);
      setOutput(err.response?.data?.error || 'An error occurred while running your code.');
    } finally {
      setIsRunning(false);
    }
  };
  
  // Save the code
  const handleSaveCode = async () => {
    setIsSaving(true);
    
    try {
      await lessonService.saveCode(courseId, moduleId, lessonId, code);
      
      setFeedback('Code saved successfully!');
      setTimeout(() => setFeedback(''), 3000);
    } catch (err) {
      console.error('Failed to save code:', err);
      setFeedback('Failed to save code. Please try again.');
      setTimeout(() => setFeedback(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Submit the code for evaluation
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setStatus(null);
    
    try {
      const response = await lessonService.submitCode(courseId, moduleId, lessonId, code);
      
      if (response.passed) {
        setStatus('success');
        setOutput(response.output || 'All tests passed successfully!');
        onComplete();
      } else {
        setStatus('error');
        setOutput(response.output || 'Some tests failed. Please check your code.');
      }
    } catch (err) {
      console.error('Failed to submit code:', err);
      setStatus('error');
      setOutput(err.response?.data?.error || 'An error occurred while submitting your code.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Copy code to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    setFeedback('Code copied to clipboard!');
    setTimeout(() => setFeedback(''), 3000);
  };
  
  // Download code as a file
  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `exercise-${lessonId}.${getFileExtension(exerciseData.language)}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Helper to get file extension based on language
  const getFileExtension = (language) => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      csharp: 'cs',
      cpp: 'cpp',
      php: 'php',
      ruby: 'rb',
      swift: 'swift',
      typescript: 'ts',
      go: 'go'
    };
    
    return extensions[language.toLowerCase()] || 'txt';
  };
  
  // Helper to get language display name
  const getLanguageDisplayName = (language) => {
    const names = {
      javascript: 'JavaScript',
      python: 'Python',
      java: 'Java',
      csharp: 'C#',
      cpp: 'C++',
      php: 'PHP',
      ruby: 'Ruby',
      swift: 'Swift',
      typescript: 'TypeScript',
      go: 'Go'
    };
    
    return names[language.toLowerCase()] || language;
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
      {/* Exercise Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{exerciseData.title}</h2>
        <div className="text-gray-600 dark:text-gray-300 prose prose-sm dark:prose-invert max-w-none mb-4">
          <div dangerouslySetInnerHTML={{ __html: exerciseData.description }} />
        </div>
        
        {/* Language Badge */}
        <div className="flex items-center mb-2">
          <Code className="w-4 h-4 mr-2 text-purple-600" />
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            {getLanguageDisplayName(exerciseData.language)}
          </span>
        </div>
        
        {/* Hint Toggle */}
        {exerciseData.hint && (
          <div className="mt-4">
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
            
            {showHint && (
              <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-md text-sm">
                {exerciseData.hint}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Code Editor and Output */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
        {/* Code Editor */}
        <div className="flex flex-col h-96">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 px-4 py-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Code Editor</span>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyCode}
                className="p-1.5 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadCode}
                className="p-1.5 text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
                title="Download code"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <textarea
            className="flex-1 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 resize-none focus:outline-none"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`Write your ${getLanguageDisplayName(exerciseData.language)} code here...`}
            spellCheck="false"
          />
        </div>
        
        {/* Output Panel */}
        <div className="flex flex-col h-96">
          <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Output</span>
          </div>
          
          <div className="flex-1 p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 overflow-auto">
            {isRunning && (
              <div className="flex items-center text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-purple-500 mr-2"></div>
                Running code...
              </div>
            )}
            
            {status === 'success' && (
              <div className="flex items-center text-green-500 mb-2">
                <CheckCircle className="w-5 h-5 mr-2" />
                Success! All tests passed.
              </div>
            )}
            
            {status === 'error' && (
              <div className="flex items-center text-red-500 mb-2">
                <AlertCircle className="w-5 h-5 mr-2" />
                There are issues with your code.
              </div>
            )}
            
            <pre className="whitespace-pre-wrap">{output}</pre>
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
        <div className="flex space-x-3">
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
          
          <button
            onClick={handleSaveCode}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
        
        <button
          onClick={handleSubmitCode}
          disabled={isSubmitting}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          {isSubmitting ? 'Submitting...' : 'Submit Solution'}
        </button>
      </div>
      
      {/* Feedback Message */}
      {feedback && (
        <div className="p-3 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-center">
          {feedback}
        </div>
      )}
    </div>
  );
};

export default CodeExercise;