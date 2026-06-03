import React, { useState } from "react";
import api from "../utils/axiosConfig";
import { BookText, Plus, Trash2, ArrowLeft, ArrowRight, CheckCircle, XCircle, UploadCloud, Settings, ListVideo } from "lucide-react";

const CreateCourse = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    level: "Beginner",
    thumbnail: "",
    duration: "",
    modules: [{ title: "", lessons: [{ title: "", videoUrl: "" }] }],
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ success: "", error: "" });

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleModuleChange = (modIndex, e) => {
    const { name, value } = e.target;
    const updatedModules = [...formData.modules];
    updatedModules[modIndex][name] = value;
    setFormData(prev => ({ ...prev, modules: updatedModules }));
  };

  const handleLessonChange = (modIndex, lessonIndex, e) => {
    const { name, value } = e.target;
    const updatedModules = [...formData.modules];
    updatedModules[modIndex].lessons[lessonIndex][name] = value;
    setFormData(prev => ({ ...prev, modules: updatedModules }));
  };

  const addModule = () => {
    setFormData(prev => ({
      ...prev,
      modules: [...prev.modules, { title: "", lessons: [{ title: "", videoUrl: "" }] }],
    }));
  };

  const removeModule = (modIndex) => {
    setFormData(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== modIndex),
    }));
  };

  const addLesson = (modIndex) => {
    const updatedModules = [...formData.modules];
    updatedModules[modIndex].lessons.push({ title: "", videoUrl: "" });
    setFormData(prev => ({ ...prev, modules: updatedModules }));
  };

  const removeLesson = (modIndex, lessonIndex) => {
    const updatedModules = [...formData.modules];
    updatedModules[modIndex].lessons = updatedModules[modIndex].lessons.filter((_, i) => i !== lessonIndex);
    setFormData(prev => ({ ...prev, modules: updatedModules }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ success: "", error: "" });

    // Reformat lessons to match the old simple array structure for backend compatibility
    const lessonsForBackend = formData.modules.flatMap(module => 
      module.lessons.map(lesson => `${module.title}: ${lesson.title}`)
    );

    const payload = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      level: formData.level,
      thumbnail: formData.thumbnail,
      duration: formData.duration,
      lessons: lessonsForBackend, // Sending the simplified lesson structure
    };

    try {
      await api.post("/courses", payload);
      setStatus({ success: "Course created successfully!", error: "" });
      // Reset form or redirect
      setFormData({
        title: "", description: "", category: "", level: "Beginner", thumbnail: "", duration: "",
        modules: [{ title: "", lessons: [{ title: "", videoUrl: "" }] }],
      });
      setStep(1);
    } catch (err) {
      setStatus({ success: "", error: err.response?.data?.error || "Failed to create course." });
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1 formData={formData} handleChange={handleChange} />;
      case 2:
        return <Step2 formData={formData} handleModuleChange={handleModuleChange} handleLessonChange={handleLessonChange} addModule={addModule} removeModule={removeModule} addLesson={addLesson} removeLesson={removeLesson} />;
      case 3:
        return <Step3 formData={formData} handleChange={handleChange} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Create a New Course</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Fill in the details to launch your new course.</p>

        {/* Stepper */}
        <div className="flex justify-center items-center mb-8">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              step >= 1 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/10' 
                : 'bg-white/60 dark:bg-slate-900/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-500'
            }`}>
              <BookText className="w-5 h-5" />
            </div>
            <p className={`ml-2.5 font-semibold ${step >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>Details</p>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step > 1 ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-amber-100/30 dark:bg-slate-800/40'}`}></div>
          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              step >= 2 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/10' 
                : 'bg-white/60 dark:bg-slate-900/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-500'
            }`}>
              <ListVideo className="w-5 h-5" />
            </div>
            <p className={`ml-2.5 font-semibold ${step >= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>Curriculum</p>
          </div>
          <div className={`flex-1 h-1 mx-4 rounded-full transition-all ${step > 2 ? 'bg-gradient-to-r from-amber-500 to-orange-600' : 'bg-amber-100/30 dark:bg-slate-800/40'}`}></div>
          {/* Step 3 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              step >= 3 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/10' 
                : 'bg-white/60 dark:bg-slate-900/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-500'
            }`}>
              <Settings className="w-5 h-5" />
            </div>
            <p className={`ml-2.5 font-semibold ${step >= 3 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>Settings</p>
          </div>
        </div>

        <div className="glass-panel p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit}>
            {renderStep()}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <button 
                  type="button" 
                  onClick={prevStep} 
                  className="flex items-center px-6 py-2.5 bg-white/60 dark:bg-slate-800/60 border border-amber-100/60 dark:border-amber-500/15 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-amber-50/50 dark:hover:bg-slate-800/40 transition"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" /> Back
                </button>
              )}
              <div className="flex-grow"></div>
              {step < 3 && (
                <button 
                  type="button" 
                  onClick={nextStep} 
                  className="flex items-center px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold rounded-xl hover:brightness-105 transition shadow-sm"
                >
                  Next <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              )}
              {step === 3 && (
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl hover:brightness-105 transition shadow-md disabled:opacity-60"
                >
                  {loading ? "Creating..." : "Create Course"}
                </button>
              )}
            </div>
          </form>
        </div>
        {status.error && <div className="mt-4 text-red-650 dark:text-red-400 flex items-center font-medium"><XCircle className="mr-2"/>{status.error}</div>}
        {status.success && <div className="mt-4 text-emerald-650 dark:text-emerald-400 flex items-center font-medium"><CheckCircle className="mr-2"/>{status.success}</div>}
      </div>
    </div>
  );
};

const Step1 = ({ formData, handleChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Course Details</h2>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course Title</label>
      <input 
        type="text" 
        name="title" 
        value={formData.title} 
        onChange={handleChange} 
        placeholder="e.g., Introduction to React" 
        required 
        className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500" 
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Course Description</label>
      <textarea 
        name="description" 
        value={formData.description} 
        onChange={handleChange} 
        placeholder="A brief summary of your course" 
        rows="4" 
        required 
        className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500"
      ></textarea>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Category</label>
      <input 
        type="text" 
        name="category" 
        value={formData.category} 
        onChange={handleChange} 
        placeholder="e.g., Web Development" 
        required 
        className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500" 
      />
    </div>
  </div>
);

const Step2 = ({ formData, handleModuleChange, handleLessonChange, addModule, removeModule, addLesson, removeLesson }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">Curriculum</h2>
    <div className="space-y-6">
      {formData.modules.map((module, modIndex) => (
        <div key={modIndex} className="glass-panel p-5 shadow-sm relative overflow-hidden bg-white/20 dark:bg-slate-950/20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(245,158,11,0.02),_transparent_55%)] pointer-events-none" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <input 
              type="text" 
              name="title" 
              value={module.title} 
              onChange={(e) => handleModuleChange(modIndex, e)} 
              placeholder={`Module ${modIndex + 1}: Title`} 
              className="flex-grow text-lg font-bold border-b border-amber-100/60 dark:border-amber-500/20 focus:border-amber-500 outline-none bg-transparent text-gray-900 dark:text-gray-100 pb-1.5 transition" 
            />
            {formData.modules.length > 1 && (
              <button 
                type="button" 
                onClick={() => removeModule(modIndex)} 
                className="text-red-500 hover:text-red-700 hover:bg-red-500/10 p-2 rounded-xl transition"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
          <div className="space-y-3 ml-4 relative z-10">
            {module.lessons.map((lesson, lessonIndex) => (
              <div key={lessonIndex} className="flex items-center space-x-2">
                <input 
                  type="text" 
                  name="title" 
                  value={lesson.title} 
                  onChange={(e) => handleLessonChange(modIndex, lessonIndex, e)} 
                  placeholder={`Lesson ${lessonIndex + 1} Title`} 
                  className="flex-grow bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500 text-sm" 
                />
                <input 
                  type="text" 
                  name="videoUrl" 
                  value={lesson.videoUrl} 
                  onChange={(e) => handleLessonChange(modIndex, lessonIndex, e)} 
                  placeholder="Video URL (optional)" 
                  className="flex-grow bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500 text-sm" 
                />
                {module.lessons.length > 1 && (
                  <button 
                    type="button" 
                    onClick={() => removeLesson(modIndex, lessonIndex)} 
                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-500/10 rounded-xl transition flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => addLesson(modIndex)} 
              className="flex items-center text-sm text-amber-600 dark:text-amber-400 font-semibold hover:text-amber-700 dark:hover:text-amber-300 mt-2 px-2 py-1 hover:bg-amber-500/5 rounded-lg transition"
            >
              <Plus size={16} className="mr-1" /> Add Lesson
            </button>
          </div>
        </div>
      ))}
      <button 
        type="button" 
        onClick={addModule} 
        className="w-full py-3 border-2 border-dashed border-amber-300/40 dark:border-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/5 transition font-semibold"
      >
        <Plus className="inline mr-2" /> Add Module
      </button>
    </div>
  </div>
);

const Step3 = ({ formData, handleChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Course Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Difficulty Level</label>
        <select 
          name="level" 
          value={formData.level} 
          onChange={handleChange} 
          className="w-full bg-white/60 dark:bg-slate-950/45 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition"
        >
          <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Beginner</option>
          <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Intermediate</option>
          <option className="bg-white dark:bg-slate-900 text-gray-900 dark:text-gray-100">Advanced</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Estimated Duration</label>
        <input 
          type="text" 
          name="duration" 
          value={formData.duration} 
          onChange={handleChange} 
          placeholder="e.g., 8 hours" 
          className="w-full bg-white/60 dark:bg-slate-950/40 border border-amber-100/60 dark:border-amber-500/15 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 text-gray-900 dark:text-gray-100 transition placeholder-gray-400 dark:placeholder-gray-500" 
        />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Thumbnail Image URL</label>
      <div className="mt-1 flex rounded-xl shadow-sm overflow-hidden border border-amber-100/60 dark:border-amber-500/15 focus-within:ring-2 focus-within:ring-amber-500/10 focus-within:border-amber-500">
        <span className="inline-flex items-center px-4.5 bg-white/40 dark:bg-slate-950/50 border-r border-amber-100/60 dark:border-amber-500/15 text-gray-500 dark:text-gray-400 text-sm"><UploadCloud className="w-5 h-5" /></span>
        <input 
          type="text" 
          name="thumbnail" 
          value={formData.thumbnail} 
          onChange={handleChange} 
          placeholder="https://example.com/image.png" 
          className="flex-1 block w-full bg-white/60 dark:bg-slate-950/40 px-4 py-2.5 focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 sm:text-sm transition" 
        />
      </div>
    </div>
  </div>
);

export default CreateCourse;
