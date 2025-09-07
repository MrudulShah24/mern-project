// src/pages/ProgressPage.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProgressPage = () => {
  const { courseId } = useParams();
  const [enrollment, setEnrollment] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // ⚠️ Replace with logged-in user ID from auth context
    const userId = "replace_with_logged_in_user_id";

    axios.get(`http://localhost:5000/api/enrollments/${userId}`)
      .then((res) => {
        const enrolled = res.data.find(e => e.course._id === courseId);
        if (enrolled) {
          setEnrollment(enrolled);
          setProgress(enrolled.progress);
        }
      })
      .catch((err) => console.error(err));
  }, [courseId]);

  const handleProgressUpdate = async () => {
    try {
      const updated = await axios.put(
        `http://localhost:5000/api/enrollments/${enrollment._id}`,
        { progress }
      );
      setEnrollment(updated.data);
      alert("✅ Progress updated!");
    } catch (err) {
      console.error(err);
    }
  };

  if (!enrollment) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Progress for {enrollment.course.title}</h2>
      <p>Current progress: {progress}%</p>

      <input
        type="number"
        min="0"
        max="100"
        value={progress}
        onChange={(e) => setProgress(Number(e.target.value))}
      />
      <button onClick={handleProgressUpdate}>Update Progress</button>
    </div>
  );
};

export default ProgressPage;
