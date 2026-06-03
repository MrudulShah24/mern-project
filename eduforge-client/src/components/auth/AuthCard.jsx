import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Github, Globe, Lock, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/axiosConfig";
import AuthInput from "./AuthInput";
import MotionStagger from "../animations/MotionStagger";
import MotionReveal from "../animations/MotionReveal";
import MagneticButton from "../ui/MagneticButton";
import { fadeUp } from "../../motion/variants";

const AuthCard = ({ compact = false, defaultMode = "login", routeOnModeChange = false }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(defaultMode);
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const copy = useMemo(
    () => ({
      login: {
        title: "Return to your forge",
        subtitle: "Continue where your knowledge was forged.",
        button: "Enter EduForge",
      },
      register: {
        title: "Forge a new identity",
        subtitle: "Step into a premium learning realm crafted for mastery.",
        button: "Create your forge",
      },
    }),
    []
  );

  const setModeSafely = (nextMode) => {
    setMode(nextMode);
    setError("");
    setSuccess("");
    if (routeOnModeChange) {
      navigate(nextMode === "login" ? "/login" : "/register");
    }
  };

  const handleChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");
    setSuccess("");

    if (!formData.email || !formData.password || (mode === "register" && !formData.name)) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "login") {
        const res = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });
        if (res.data.token && res.data.user) {
          localStorage.setItem("user", JSON.stringify(res.data.user));
          localStorage.setItem("token", res.data.token);
          navigate("/dashboard");
        } else {
          throw new Error("Invalid response from server");
        }
      } else {
        const res = await api.post("/auth/register", {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        });
        setSuccess(res.data.message || "Account forged. Please sign in.");
        setTimeout(() => setModeSafely("login"), 1800);
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (mode === "login"
            ? "Login failed. Please check your credentials."
            : "Registration failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className={`relative w-full ${compact ? "max-w-sm" : "max-w-md"} rounded-[28px] border border-amber-200/80 dark:border-amber-500/20 bg-white/60 dark:bg-white/10 p-6 text-gray-950 dark:text-white shadow-[0_40px_120px_rgba(180,120,50,0.08)] dark:shadow-[0_40px_120px_rgba(5,10,20,0.7)] backdrop-blur-2xl md:p-8`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute -top-10 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full bg-amber-400/30 blur-2xl" />
      <MotionStagger className="space-y-5">
        <MotionReveal variants={fadeUp}>
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.4em] text-amber-800/80 dark:text-amber-200/80 font-semibold font-display">EduForge</p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 dark:text-white">{copy[mode].title}</h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-white/60">{copy[mode].subtitle}</p>
          </div>
        </MotionReveal>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-800 dark:text-red-200"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {success && (
            <motion.div
              key="success"
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-100"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.form onSubmit={handleSubmit} className="space-y-4" variants={fadeUp}>
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.4 }}
              >
                <AuthInput
                  label="Full name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  icon={User}
                  autoComplete="name"
                  disabled={loading}
                />
              </motion.div>
            )}
          </AnimatePresence>
          <AuthInput
            label="Email address"
            name="email"
            value={formData.email}
            onChange={handleChange}
            icon={Mail}
            type="email"
            autoComplete="email"
            disabled={loading}
          />
          <AuthInput
            label="Password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            icon={Lock}
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            disabled={loading}
          />

          <MagneticButton
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 px-6 py-3 text-sm font-semibold text-[#140900] shadow-[0_18px_50px_rgba(255,167,70,0.35)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Forging..." : copy[mode].button}
          </MagneticButton>
        </motion.form>

        <MotionReveal variants={fadeUp}>
          <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-white/40">
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            <span>Or continue with</span>
            <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
          </div>
        </MotionReveal>

        <MotionReveal variants={fadeUp}>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
              className="flex items-center justify-center gap-2 w-full rounded-2xl border border-amber-200 bg-white/60 dark:border-amber-500/20 dark:bg-white/5 px-4 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-white/90 transition hover:border-amber-400 hover:bg-white/80 dark:hover:border-amber-400/40 dark:hover:bg-white/10 shadow-[0_4px_12px_rgba(180,120,50,0.04)]"
            >
              <Globe className="h-5 w-5 text-blue-500 dark:text-blue-400" />
              Continue with Google
            </button>
          </div>
        </MotionReveal>

        <MotionReveal variants={fadeUp}>
          <div className="text-center text-xs text-gray-500 dark:text-white/60">
            {mode === "login" ? "New to EduForge?" : "Already forging knowledge?"}{" "}
            <button
              type="button"
              onClick={() => setModeSafely(mode === "login" ? "register" : "login")}
              className="text-amber-600 dark:text-amber-200/90 transition hover:text-amber-700 dark:hover:text-amber-100 font-semibold"
            >
              {mode === "login" ? "Create an account" : "Sign in"}
            </button>
          </div>
        </MotionReveal>
      </MotionStagger>
    </motion.div>
  );
};

export default AuthCard;
