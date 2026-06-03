import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, Flame, Orbit } from "lucide-react";
import LandingExperience from "../components/landing/LandingExperience";
import MotionStagger from "../components/animations/MotionStagger";
import MotionReveal from "../components/animations/MotionReveal";
import { fadeUp } from "../motion/variants";

const FORGE_PILLARS = [
  {
    title: "Ignite Curiosity",
    description: "Enter a cinematic universe where learning feels alive and intentional.",
    icon: Flame,
  },
  {
    title: "Refine Mastery",
    description: "Structured paths that transform raw knowledge into polished skills.",
    icon: Brain,
  },
  {
    title: "Ascend with Insight",
    description: "Intelligent progression built for focus, momentum, and achievement.",
    icon: Orbit,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const rawUser = localStorage.getItem("user");
    if (rawUser && rawUser !== "undefined") {
      navigate("/dashboard", { replace: true });
    } else {
      setIsChecking(false);
    }
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#fffbeb] dark:bg-[#05070d] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500/20 border-t-amber-500" />
      </div>
    );
  }

  return (
    <div className="bg-transparent text-gray-900 dark:text-white">
      <LandingExperience />

      <section className="relative py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,178,90,0.06),_transparent_60%)]" />
        <div className="container relative mx-auto px-6">
          <MotionStagger className="space-y-12">
            <MotionReveal variants={fadeUp}>
              <div className="max-w-2xl">
                <p className="text-xs uppercase tracking-[0.4em] text-amber-800/80 dark:text-amber-200/70 font-semibold">
                  The Knowledge Forge
                </p>
                <h2 className="mt-4 text-3xl font-semibold md:text-4xl text-gray-900 dark:text-white">
                  A premium ritual for forging skills.
                </h2>
                <p className="mt-4 text-gray-600 dark:text-white/60">
                  Every lesson feels like an unlock. Every milestone feels like craftsmanship. EduForge is
                  designed for modern learners who want depth, not noise.
                </p>
              </div>
            </MotionReveal>

            <div className="grid gap-6 md:grid-cols-3">
              {FORGE_PILLARS.map((pillar) => (
                <MotionReveal key={pillar.title} variants={fadeUp}>
                  <div className="group glass-card p-6 shadow-md transition hover:-translate-y-1 hover:border-amber-400/40 dark:hover:border-amber-300/30">
                    <pillar.icon className="h-10 w-10 text-amber-600 dark:text-amber-200/80 transition group-hover:text-amber-700 dark:group-hover:text-amber-100" />
                    <h3 className="mt-5 text-xl font-semibold text-gray-900 dark:text-white">{pillar.title}</h3>
                    <p className="mt-3 text-sm text-gray-600 dark:text-white/60">{pillar.description}</p>
                  </div>
                </MotionReveal>
              ))}
            </div>
          </MotionStagger>
        </div>
      </section>
    </div>
  );
};

export default Home;
