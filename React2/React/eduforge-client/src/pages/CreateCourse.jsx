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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">Create a New Course</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">Fill in the details to launch your new course.</p>

        {/* Stepper */}
        <div className="flex justify-center items-center mb-8">
          {/* Step 1 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              <BookText />
            </div>
            <p className={`ml-2 font-semibold ${step >= 1 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>Details</p>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step > 1 ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
          {/* Step 2 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              <ListVideo />
            </div>
            <p className={`ml-2 font-semibold ${step >= 2 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>Curriculum</p>
          </div>
          <div className={`flex-1 h-1 mx-4 ${step > 2 ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
          {/* Step 3 */}
          <div className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= 3 ? 'bg-purple-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
              <Settings />
            </div>
            <p className={`ml-2 font-semibold ${step >= 3 ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400'}`}>Settings</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg">
          <form onSubmit={handleSubmit}>
            {renderStep()}
            <div className="flex justify-between mt-8">
              {step > 1 && <button type="button" onClick={prevStep} className="flex items-center px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"><ArrowLeft className="mr-2 h-5 w-5" /> Back</button>}
              <div className="flex-grow"></div>
              {step < 3 && <button type="button" onClick={nextStep} className="flex items-center px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition">Next <ArrowRight className="ml-2 h-5 w-5" /></button>}
              {step === 3 && <button type="submit" disabled={loading} className="px-6 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition">{loading ? "Creating..." : "Create Course"}</button>}
            </div>
          </form>
        </div>
        {status.error && <div className="mt-4 text-red-600 dark:text-red-400 flex items-center"><XCircle className="mr-2"/>{status.error}</div>}
        {status.success && <div className="mt-4 text-green-600 dark:text-green-400 flex items-center"><CheckCircle className="mr-2"/>{status.success}</div>}
      </div>
    </div>
  );
};

const Step1 = ({ formData, handleChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Course Details</h2>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Title</label>
      <input type="text" name="title" value={formData.title} onChange={handleChange} placeholder="e.g., Introduction to React" required className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100" />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Course Description</label>
      <textarea name="description" value={formData.description} onChange={handleChange} placeholder="A brief summary of your course" rows="4" required className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100"></textarea>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
      <input type="text" name="category" value={formData.category} onChange={handleChange} placeholder="e.g., Web Development" required className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100" />
    </div>
  </div>
);

const Step2 = ({ formData, handleModuleChange, handleLessonChange, addModule, removeModule, addLesson, removeLesson }) => (
  <div>
    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-6">Curriculum</h2>
    <div className="space-y-6">
      {formData.modules.map((module, modIndex) => (
        <div key={modIndex} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
          <div className="flex justify-between items-center mb-4">
            <input type="text" name="title" value={module.title} onChange={(e) => handleModuleChange(modIndex, e)} placeholder={`Module ${modIndex + 1}: Title`} className="flex-grow text-lg font-semibold border-b-2 border-gray-300 dark:border-gray-600 focus:border-purple-500 outline-none bg-transparent text-gray-900 dark:text-gray-100" />
            {formData.modules.length > 1 && <button type="button" onClick={() => removeModule(modIndex)} className="text-red-500 hover:text-red-700"><Trash2 /></button>}
          </div>
          <div className="space-y-3 ml-4">
            {module.lessons.map((lesson, lessonIndex) => (
              <div key={lessonIndex} className="flex items-center space-x-2">
                <input type="text" name="title" value={lesson.title} onChange={(e) => handleLessonChange(modIndex, lessonIndex, e)} placeholder={`Lesson ${lessonIndex + 1} Title`} className="flex-grow bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-gray-100" />
                <input type="text" name="videoUrl" value={lesson.videoUrl} onChange={(e) => handleLessonChange(modIndex, lessonIndex, e)} placeholder="Video URL (optional)" className="flex-grow bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:ring-1 focus:ring-purple-500 text-gray-900 dark:text-gray-100" />
                {module.lessons.length > 1 && <button type="button" onClick={() => removeLesson(modIndex, lessonIndex)} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={18} /></button>}
              </div>
            ))}
            <button type="button" onClick={() => addLesson(modIndex)} className="flex items-center text-sm text-purple-600 dark:text-purple-400 font-semibold hover:text-purple-800 dark:hover:text-purple-300 mt-2"><Plus size={16} className="mr-1" /> Add Lesson</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={addModule} className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-purple-500 hover:text-purple-500 transition"><Plus className="inline mr-2" /> Add Module</button>
    </div>
  </div>
);

const Step3 = ({ formData, handleChange }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-200">Course Settings</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Difficulty Level</label>
        <select name="level" value={formData.level} onChange={handleChange} className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100">
          <option>Beginner</option>
          <option>Intermediate</option>
          <option>Advanced</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Duration</label>
        <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g., 8 hours" className="w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 text-gray-900 dark:text-gray-100" />
      </div>
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thumbnail Image URL</label>
      <div className="mt-1 flex rounded-md shadow-sm">
        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm"><UploadCloud/></span>
        <input type="text" name="thumbnail" value={formData.thumbnail} onChange={handleChange} placeholder="https://example.com/image.png" className="flex-1 block w-full rounded-none rounded-r-md bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-gray-900 dark:text-gray-100" />
      </div>
    </div>
  </div>
);

export default CreateCourse;
