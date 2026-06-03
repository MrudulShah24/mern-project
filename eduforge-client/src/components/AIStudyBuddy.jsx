import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, X, Send, Bot, User, Loader } from 'lucide-react';
import api from '../utils/axiosConfig';

const AIStudyBuddy = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Check if pathname matches /course-dashboard/:courseId or /progress/:courseId
  const match = location.pathname.match(/\/(course-dashboard|progress)\/([a-f\d]{24})/i);
  const courseId = match ? match[2] : null;

  const toggleDrawer = () => setIsOpen(!isOpen);

  // Reset chat / set initial welcome message whenever courseId changes
  useEffect(() => {
    const isCourseMode = !!courseId;
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: isCourseMode
          ? "Hey there! I am your **AI Study Buddy**. Ask me anything about this course, modules, coding exercises, or quizzes!"
          : "Hey there! I am your **AI Learning Assistant**. Ask me to recommend a course, suggest a learning topic, or help you find what you need!",
        time: new Date()
      }
    ]);
  }, [courseId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  // Return null if user is not logged in or is on a public/auth path
  const token = localStorage.getItem("token");
  const hidePaths = ['/', '/login', '/register', '/oauth-callback'];
  
  if (!token || hidePaths.includes(location.pathname)) {
    return null;
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      time: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Determine endpoint based on course mode or global mode
      const endpoint = courseId 
        ? `/courses/${courseId}/ask-assistant` 
        : `/courses/ask-assistant`;

      const response = await api.post(endpoint, {
        query: userMessage.text
      });

      const aiMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: response.data.reply,
        time: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error('AI Study Buddy error:', err);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "Sorry, I ran into an error connecting to the learning database. Please try again in a moment!",
        time: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to format simple markdown-like elements (bold, code blocks)
  const formatText = (text) => {
    if (!text) return '';
    
    // Split code blocks
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const lines = part.slice(3, -3).trim().split('\n');
        // Extract language if specified
        let lang = '';
        let codeLines = lines;
        if (lines[0] && !lines[0].includes(' ') && lines[0].length < 15) {
          lang = lines[0];
          codeLines = lines.slice(1);
        }
        
        return (
          <div key={index} className="my-3 font-mono text-xs bg-slate-950 dark:bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-300 overflow-x-auto shadow-inner">
            {lang && <div className="text-[10px] text-amber-500 uppercase tracking-wider mb-1.5 font-sans font-bold">{lang}</div>}
            <pre>{codeLines.join('\n')}</pre>
          </div>
        );
      }
      
      // Handle bold formatting (**text**)
      const boldParts = part.split(/(\*\*.*?\*\*)/g);
      return (
        <span key={index}>
          {boldParts.map((bPart, bIndex) => {
            if (bPart.startsWith('**') && bPart.endsWith('**')) {
              return <strong key={bIndex} className="font-bold text-amber-700 dark:text-amber-300">{bPart.slice(2, -2)}</strong>;
            }
            return bPart;
          })}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={toggleDrawer}
        className="fixed bottom-6 right-6 z-40 flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-amber-500 to-orange-600 hover:brightness-110 shadow-[0_16px_36px_rgba(245,158,11,0.35)] transition-transform duration-350 hover:scale-110 border border-amber-400/30 group animate-pulse"
        title={courseId ? "AI Study Buddy" : "AI Learning Assistant"}
      >
        <Sparkles className="w-6 h-6 text-white group-hover:rotate-12 transition-transform" />
      </button>

      {/* Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white/90 dark:bg-slate-950/90 border-l border-amber-100/50 dark:border-amber-500/10 shadow-[0_0_80px_rgba(0,0,0,0.15)] dark:shadow-[0_0_80px_rgba(0,0,0,0.45)] backdrop-blur-xl z-50 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-amber-100/50 dark:border-amber-500/10 bg-amber-500/5 dark:bg-slate-900/40">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-950 dark:text-white leading-tight">
                {courseId ? "AI Study Buddy" : "AI Learning Assistant"}
              </h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-amber-600 dark:text-amber-400 mt-0.5">EduForge Copilot</p>
            </div>
          </div>
          <button
            onClick={toggleDrawer}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-slate-800 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message History */}
        <div className="h-[calc(100vh-145px)] overflow-y-auto px-6 py-6 space-y-4 custom-scrollbar bg-transparent">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              {/* Avatar icon */}
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center border shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-amber-500/15 border-amber-500/20 text-amber-600 dark:text-amber-400'
                    : 'bg-indigo-500/15 border-indigo-500/20 text-indigo-650 dark:text-indigo-400'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div
                className={`p-4 rounded-2xl shadow-sm text-sm border leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-tr from-amber-500/10 to-orange-500/5 dark:from-amber-500/20 dark:to-orange-500/10 border-amber-500/20 text-gray-900 dark:text-slate-100 rounded-tr-none'
                    : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 text-gray-800 dark:text-slate-200 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-line">{formatText(msg.text)}</div>
                <span className="block text-[9px] text-gray-400 dark:text-slate-500 text-right mt-2 font-mono">
                  {new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-indigo-500/15 border border-indigo-500/20 text-indigo-400">
                <Bot className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-1.5">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSend}
          className="absolute bottom-0 inset-x-0 px-6 py-5 border-t border-amber-100/50 dark:border-amber-500/10 bg-white dark:bg-slate-950 flex gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={courseId ? "Ask about this course..." : "Ask about courses, topics, or what to learn..."}
            className="flex-1 px-4 py-3 text-sm rounded-xl border border-gray-200 dark:border-slate-850 dark:bg-slate-900/50 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 dark:focus:border-amber-400 transition"
            disabled={loading}
          />
          <button
            type="submit"
            className="p-3 bg-gradient-to-tr from-amber-500 to-orange-600 hover:brightness-110 rounded-xl text-white shadow-md disabled:opacity-50 transition"
            disabled={!input.trim() || loading}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
};

export default AIStudyBuddy;
