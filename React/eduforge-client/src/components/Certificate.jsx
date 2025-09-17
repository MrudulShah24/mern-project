import React, { useRef, useState } from 'react';
import { Award, Download, Share2, CheckCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import certificateBg from '../assets/certificate-bg.svg';

const Certificate = ({ certificate }) => {
  const { student, course, instructor, issueDate, certificateId } = certificate;
  const certificateRef = useRef();
  const [showToast, setShowToast] = useState(false);

  const downloadCertificate = () => {
    const input = certificateRef.current;
    // Temporarily remove the dark mode class from the certificate element to ensure it prints with a white background
    const certificateElement = input.querySelector('.certificate-body');
    const hadDarkMode = certificateElement.classList.contains('dark:bg-gray-900');
    if (hadDarkMode) {
      certificateElement.classList.remove('dark:bg-gray-900');
      certificateElement.classList.add('bg-white');
    }

    html2canvas(input, {
      scale: 3, // Increase scale for better resolution
      useCORS: true,
      backgroundColor: null, // Use transparent background
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`EduForge-Certificate-${course.title.replace(/\s+/g, '-')}.pdf`);

      // Add the dark mode class back if it was there
      if (hadDarkMode) {
        certificateElement.classList.add('dark:bg-gray-900');
        certificateElement.classList.remove('bg-white');
      }
    });
  };

  const shareCertificate = async () => {
    const shareUrl = `${window.location.origin}/verify/${certificateId}`;
    const shareData = {
      title: `My Certificate for ${course.title}`,
      text: `I just completed the course "${course.title}" on EduForge! Check out my certificate.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err.message);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (err) {
        console.error('Failed to copy:', err.message);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Certificate Preview */}
      <div ref={certificateRef} className="w-full aspect-[1.414/1] overflow-hidden">
        <div className="certificate-body relative w-full h-full bg-white dark:bg-gray-900 p-8 shadow-2xl flex flex-col justify-between border-8 border-purple-800 dark:border-purple-500 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900">
          {/* Decorative elements */}
          <div
            className="absolute inset-0 bg-center bg-cover opacity-5"
            style={{ backgroundImage: `url(${certificateBg})` }}
          ></div>
          <div className="absolute top-4 left-4 w-16 h-16 border-l-4 border-t-4 border-purple-300 dark:border-purple-700"></div>
          <div className="absolute top-4 right-4 w-16 h-16 border-r-4 border-t-4 border-purple-300 dark:border-purple-700"></div>
          <div className="absolute bottom-4 left-4 w-16 h-16 border-l-4 border-b-4 border-purple-300 dark:border-purple-700"></div>
          <div className="absolute bottom-4 right-4 w-16 h-16 border-r-4 border-b-4 border-purple-300 dark:border-purple-700"></div>

          <div className="text-center z-10">
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 tracking-widest">EduForge</p>
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-purple-800 dark:text-purple-400 my-4">Certificate of Completion</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">This is to certify that</p>
            
            <h2 className="text-3xl md:text-4xl font-cursive text-gray-800 dark:text-gray-200 mb-4">
              {student.name}
            </h2>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">
              has successfully completed the course
            </p>
            
            <h3 className="text-2xl md:text-3xl font-bold text-purple-700 dark:text-purple-300 mb-8">
              {course.title}
            </h3>
          </div>
          
          <div className="flex justify-between items-end z-10">
            <div className="text-center">
              <p className="text-lg font-semibold border-b-2 border-gray-400 dark:border-gray-600 px-8 pb-1">{instructor.name}</p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Instructor</p>
            </div>
            
            <div className="text-center">
              <div className="w-24 h-24 bg-yellow-400 dark:bg-yellow-500 rounded-full flex items-center justify-center text-white relative seal">
                <Award className="w-12 h-12" />
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                  <path id="circlePath" fill="none" d="M 10, 50 a 40,40 0 1,1 80,0 a 40,40 0 1,1 -80,0" />
                  <text>
                    <textPath href="#circlePath" className="text-[9px] font-semibold tracking-wider fill-current">
                      OFFICIAL SEAL • EDUFORGE PLATFORM •
                    </textPath>
                  </text>
                </svg>
              </div>
            </div>

            <div className="text-center">
              <p className="text-lg font-semibold border-b-2 border-gray-400 dark:border-gray-600 px-8 pb-1">
                {new Date(issueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Date of Issue</p>
            </div>
          </div>
          
          <div className="mt-4 text-gray-500 dark:text-gray-500 text-xs text-center z-10">
            Certificate ID: {certificateId}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 my-8">
        <button
          onClick={downloadCertificate}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105"
        >
          <Download className="w-5 h-5 mr-2" />
          Download PDF
        </button>
        <button
          onClick={shareCertificate}
          className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-white dark:bg-gray-700 border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-600 transition-transform transform hover:scale-105"
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share Certificate
        </button>
      </div>

      {/* Verification Info */}
      <div className="text-center text-gray-600 dark:text-gray-400">
        <p className="mb-2">Verify this certificate at:</p>
        <a
          href={`${window.location.origin}/verify/${certificateId}`}
          className="text-purple-600 dark:text-purple-400 hover:underline break-all"
          target="_blank"
          rel="noopener noreferrer"
        >
          {`${window.location.origin}/verify/${certificateId}`}
        </a>
      </div>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center animate-fade-in-out">
          <CheckCircle className="w-6 h-6 mr-3" />
          Link copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default Certificate;
