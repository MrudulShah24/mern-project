import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useReducedMotion } from "framer-motion";
import CinematicBackground from "../landing/CinematicBackground";
import AuthCard from "./AuthCard";
import useMediaQuery from "../../hooks/useMediaQuery";

const AuthExperienceShell = ({ defaultMode }) => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const reducedMotion = prefersReducedMotion || isMobile;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-transparent text-gray-900 dark:text-white">
      <CinematicBackground active={false} reducedMotion={reducedMotion} />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-24">
        <AuthCard defaultMode={defaultMode} routeOnModeChange />
      </div>
    </div>
  );
};

export default AuthExperienceShell;
