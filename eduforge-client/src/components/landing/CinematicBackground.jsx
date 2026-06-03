import { motion } from "framer-motion";
import ParticleField from "./ParticleField";
import FloatingSymbols from "./FloatingSymbols";

const CinematicBackground = ({ active = false, reducedMotion = false }) => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#fcfbf9_0%,_#f8f6f1_45%,_#f1ede4_100%)] dark:bg-[radial-gradient(circle_at_top,_#121a34_0%,_#070a14_45%,_#04060a_100%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(251,191,36,0.04),_transparent_55%)] dark:bg-[radial-gradient(circle_at_20%_20%,_rgba(84,116,255,0.18),_transparent_55%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_30%,_rgba(254,215,170,0.06),_transparent_60%)] dark:bg-[radial-gradient(circle_at_80%_30%,_rgba(255,174,92,0.2),_transparent_60%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_75%,_rgba(253,230,138,0.05),_transparent_60%)] dark:bg-[radial-gradient(circle_at_70%_75%,_rgba(40,188,255,0.12),_transparent_60%)]" />
    <ParticleField count={reducedMotion ? 20 : 40} active={active} reducedMotion={reducedMotion} />
    <FloatingSymbols active={active} reducedMotion={reducedMotion} />
    <motion.div
      className="absolute inset-0 bg-[#fcfbf9] dark:bg-[#04060a]"
      animate={{ opacity: active ? 0.55 : 0.35 }}
      transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
    />
    <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(252,251,249,0.1),rgba(248,246,241,0.4))] dark:bg-[linear-gradient(120deg,rgba(6,10,20,0.6),rgba(5,8,15,0.85))]" />
  </div>
);

export default CinematicBackground;
