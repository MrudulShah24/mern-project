import { useEffect } from "react";
import { useMotionValue, useSpring } from "framer-motion";

const useParallax = (strength = 16, enabled = true) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 140, damping: 18, mass: 0.5 });
  const springY = useSpring(y, { stiffness: 140, damping: 18, mass: 0.5 });

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      x.set(0);
      y.set(0);
      return;
    }

    const handleMove = (event) => {
      const offsetX = (event.clientX / window.innerWidth - 0.5) * strength;
      const offsetY = (event.clientY / window.innerHeight - 0.5) * strength;
      x.set(offsetX);
      y.set(offsetY);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [enabled, strength, x, y]);

  return { x: springX, y: springY };
};

export default useParallax;
