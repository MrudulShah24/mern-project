import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import CinematicBackground from "./CinematicBackground";
import KnowledgeForge from "./KnowledgeForge";
import MotionStagger from "../animations/MotionStagger";
import MotionReveal from "../animations/MotionReveal";
import MagneticButton from "../ui/MagneticButton";
import AuthCard from "../auth/AuthCard";
import { fadeUp, scaleIn } from "../../motion/variants";
import useMediaQuery from "../../hooks/useMediaQuery";

const LandingExperience = () => {
  const [activated, setActivated] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const reducedMotion = prefersReducedMotion || isMobile;

  useEffect(() => {
    if (!activated) {
      setShowAuth(false);
      return;
    }
    const timer = setTimeout(() => setShowAuth(true), reducedMotion ? 250 : 700);
    return () => clearTimeout(timer);
  }, [activated, reducedMotion]);

  return (
    <section className="relative min-h-screen overflow-hidden bg-transparent text-gray-900 dark:text-white">
      <CinematicBackground active={activated} reducedMotion={reducedMotion} />

      <motion.div
        className="relative z-10 flex min-h-screen items-center px-6 pb-12 pt-32 md:pt-28"
        animate={{ scale: activated ? (reducedMotion ? 1.01 : 1.05) : 1 }}
        transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mx-auto grid w-full max-w-6xl items-center gap-14 md:grid-cols-[1.15fr_0.85fr]">
          <MotionStagger className="space-y-6">
            <MotionReveal variants={fadeUp}>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-white/45 dark:bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-amber-800/80 dark:text-white/70 backdrop-blur-md">
                Forge Knowledge &bull; Craft Skills
              </span>
            </MotionReveal>
            <MotionReveal variants={fadeUp}>
              <h1 className="text-4xl font-semibold leading-tight text-gray-900 dark:text-white md:text-6xl">
                Enter the{" "}
                <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 dark:from-amber-200 dark:via-orange-300 dark:to-amber-200 bg-clip-text text-transparent">
                  EduForge
                </span>{" "}
                learning universe.
              </h1>
            </MotionReveal>
            <MotionReveal variants={fadeUp}>
              <p className="max-w-xl text-base text-gray-600 dark:text-white/70 md:text-lg">
                A cinematic, intelligent space where knowledge is forged into mastery. Unlock curated
                skill paths, immersive lessons, and a learning ritual that feels alive.
              </p>
            </MotionReveal>
            <MotionReveal variants={fadeUp}>
              <div className="flex flex-wrap items-center gap-4">
                <MagneticButton
                  onClick={() => setActivated((prev) => !prev)}
                  className="group relative overflow-hidden rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 px-7 py-3 text-sm font-semibold text-[#120a00] shadow-[0_20px_60px_rgba(255,170,70,0.25)]"
                >
                  <span className="relative z-10">{activated ? "Return to Hero" : "Start Learning"}</span>
                  <span className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.6),_transparent_70%)]" />
                </MagneticButton>
                <Link
                  to="/courses"
                  className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 dark:border-amber-500/30 px-6 py-3 text-sm text-gray-700 hover:text-gray-900 dark:text-white/80 transition hover:border-amber-400 dark:hover:border-amber-400/50 dark:hover:text-white backdrop-blur-sm"
                >
                  Explore Library <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </MotionReveal>
            <MotionReveal variants={fadeUp}>
              <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.25em] text-gray-400 dark:text-white/40">
                <span>Immersive Paths</span>
                <span>&bull;</span>
                <span>Adaptive Progression</span>
                <span>&bull;</span>
                <span>Premium Mentors</span>
              </div>
            </MotionReveal>
          </MotionStagger>

          <div className="relative flex items-center justify-center">
            <KnowledgeForge active={activated} reducedMotion={reducedMotion} />
            <AnimatePresence mode="wait">
              {showAuth && (
                <motion.div
                  key="auth"
                  className="absolute inset-0 flex items-center justify-center"
                  variants={scaleIn}
                  initial="hidden"
                  animate="show"
                  exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                >
                  <AuthCard compact />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default LandingExperience;
