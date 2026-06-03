import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Award, AlertCircle, ChevronRight, Check, Lock } from 'lucide-react';
import api from '../utils/axiosConfig';

const CertificateEligibility = ({ courseId, enrollment }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkEligibility = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      if (!enrollment) {
        const progressRes = await api.get(`/courses/${courseId}/progress`);
        setProgress(progressRes.data.percentage || 0);
      }
      const res = await api.get(`/enrollments/certificate-eligibility/${courseId}`);
      setEligibility(res.data);
      setError('');
    } catch (err) {
      setError('Failed to check certificate eligibility.');
      console.error("Certificate eligibility error:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [courseId, enrollment]);

  useEffect(() => { checkEligibility(true); }, [courseId, checkEligibility]);

  useEffect(() => {
    if (enrollment) {
      setProgress(enrollment.progressPercentage || 0);
      checkEligibility(false);
    }
  }, [enrollment, checkEligibility]);

  const generateCertificate = async () => {
    try {
      setGenerating(true);
      await api.post(`/certificates/generate/${courseId}`);
      await checkEligibility();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate certificate');
    } finally {
      setGenerating(false);
    }
  };

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="relative rounded-2xl border border-amber-500/20 bg-slate-900/60 backdrop-blur-xl p-5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.06),_transparent_60%)] pointer-events-none" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-300">Checking Eligibility…</p>
            <p className="text-xs text-slate-500">Please wait</p>
          </div>
        </div>
        <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
          <div className="bg-amber-500 h-full rounded-full animate-pulse w-full" />
        </div>
      </div>
    );
  }

  /* ── 100% + generate ── */
  if (progress === 100 && (!eligibility?.success || error)) {
    return (
      <div className="relative rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-xl p-5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_70%)] pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Check className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">Course Completed! 🎉</p>
            <p className="text-xs text-slate-500">You've finished 100% of this course</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm mb-4">You're eligible for a certificate. Generate it now to showcase your achievement.</p>
        <button
          onClick={generateCertificate}
          disabled={generating}
          className={`w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
            generating
              ? 'bg-white/10 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:brightness-110 shadow-[0_6px_20px_rgba(245,158,11,0.25)]'
          }`}
        >
          {generating ? 'Generating…' : <><Award className="w-4 h-4" /> Generate Certificate</>}
        </button>
      </div>
    );
  }

  /* ── Eligible / has certificate ── */
  if (eligibility?.success) {
    return (
      <div className="relative rounded-2xl border border-emerald-500/25 bg-emerald-500/5 backdrop-blur-xl p-5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.08),_transparent_70%)] pointer-events-none" />
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
            <Award className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">Certificate Ready! 🏆</p>
            <p className="text-xs text-slate-500">Your certificate is waiting for you</p>
          </div>
        </div>
        <p className="text-slate-400 text-sm mb-4">Congratulations! You've earned a certificate. View, download, or share it.</p>
        <Link
          to={`/certificate/${courseId}`}
          className="w-full py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 hover:brightness-110 transition shadow-[0_6px_20px_rgba(245,158,11,0.25)]"
        >
          View Certificate <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  /* ── Not yet eligible ── */
  return (
    <div className="relative rounded-2xl border border-amber-500/20 bg-slate-900/60 backdrop-blur-xl p-5 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.05),_transparent_60%)] pointer-events-none" />

      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lock className="w-4 h-4 text-amber-400/70" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-300">Certificate Locked</p>
          <p className="text-xs text-slate-500">Complete the full course to unlock</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs font-semibold mb-2">
          <span className="text-slate-500">Progress</span>
          <span className="text-amber-400">{progress}%</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-full rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-600 mt-2">{100 - progress}% remaining to unlock certificate</p>
      </div>
    </div>
  );
};

export default CertificateEligibility;
