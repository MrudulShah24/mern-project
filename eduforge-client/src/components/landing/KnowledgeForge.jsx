import { motion } from "framer-motion";
import useParallax from "../../hooks/useParallax";
import { cinematicEase } from "../../motion/variants";

const KnowledgeForge = ({ active = false, reducedMotion = false }) => {
  const parallax = useParallax(18, !reducedMotion);

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ perspective: "1200px", x: parallax.x, y: parallax.y }}
    >
      <motion.div
        className="relative w-[220px] h-[260px] md:w-[320px] md:h-[360px]"
        animate={reducedMotion ? undefined : { y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        whileHover={reducedMotion ? undefined : { rotateX: -4, rotateY: 6, scale: 1.02 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#fffaf0] via-[#fff5e6] to-[#ffeed0] dark:from-[#111a2f] dark:via-[#0f172a] dark:to-[#0b1020] border border-amber-500/10 dark:border-amber-500/20 shadow-[0_30px_90px_rgba(180,120,50,0.15)] dark:shadow-[0_30px_90px_rgba(5,10,20,0.8)]" />
        <div className="absolute inset-2 rounded-[28px] bg-gradient-to-br from-white to-[#fff8ee] dark:from-[#0b1222] dark:to-[#070a14] border border-amber-400/20 dark:border-amber-500/10" />
        <div className="absolute left-0 top-0 bottom-0 w-6 md:w-8 rounded-l-[32px] bg-gradient-to-b from-[#ffeecf] to-[#ffdcb3] dark:from-[#2a2f45] dark:to-[#121827] opacity-60 dark:opacity-70" />

        <motion.div
          className="absolute -inset-10 rounded-[40px] bg-amber-500/20 blur-[90px]"
          animate={{ opacity: active ? 0.9 : 0.45, scale: active ? 1.05 : 0.95 }}
          transition={{ duration: 1.2, ease: cinematicEase }}
        />
        <motion.div
          className="absolute -inset-14 rounded-[40px] bg-blue-500/20 blur-[120px]"
          animate={{ opacity: active ? 0.55 : 0.2 }}
          transition={{ duration: 1.4, ease: cinematicEase }}
        />

        <motion.div
          className="absolute inset-5 rounded-[24px] bg-gradient-to-br from-white to-[#fffbf5] dark:from-[#101a2f] dark:via-[#0c1426] dark:to-[#060a14] border border-amber-500/10 dark:border-amber-500/20"
          animate={{ boxShadow: active ? "inset 0 0 60px rgba(255,170,70,0.25)" : "inset 0 0 20px rgba(120,170,255,0.15)" }}
          transition={{ duration: 1.2, ease: cinematicEase }}
        />

        <motion.div
          className="absolute inset-8 rounded-full bg-gradient-to-br from-amber-300/25 via-orange-500/30 to-amber-200/20 blur-sm"
          animate={{ scale: active ? 1.08 : 0.96, opacity: active ? 0.85 : 0.55 }}
          transition={{ duration: 1.3, ease: cinematicEase }}
        />
        <motion.div
          className="absolute inset-[72px] rounded-full bg-gradient-to-br from-amber-400/40 via-orange-400/35 to-amber-200/30"
          animate={{ scale: active ? 1.1 : 0.92, opacity: active ? 0.9 : 0.5 }}
          transition={{ duration: 1.4, ease: cinematicEase }}
        />

        <motion.div
          className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-[#fff9f0] via-[#fff4e3] to-[#ffebcc] dark:from-[#141b2e] dark:via-[#111827] dark:to-[#0b1020] border border-amber-500/15 dark:border-amber-500/20"
          style={{ transformOrigin: "bottom center", transformStyle: "preserve-3d" }}
          animate={active ? { rotateX: -55, y: -12 } : { rotateX: 0, y: 0 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
        />

        <motion.div
          className="absolute inset-6 rounded-[26px] bg-[radial-gradient(circle_at_top,_rgba(255,196,120,0.45),_transparent_70%)]"
          animate={{ opacity: active ? 1 : 0, scale: active ? 1.05 : 0.95 }}
          transition={{ duration: 1.2, ease: cinematicEase }}
        />
      </motion.div>
    </motion.div>
  );
};

export default KnowledgeForge;
