import { useRef } from "react";
import { motion, useMotionValue, useSpring, useReducedMotion } from "framer-motion";

const MagneticButton = ({
  children,
  className,
  intensity = 18,
  disabled,
  onClick,
  type = "button",
  ...rest
}) => {
  const reduceMotion = useReducedMotion();
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 160, damping: 16, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 160, damping: 16, mass: 0.4 });

  const handleMove = (event) => {
    if (reduceMotion || !ref.current || disabled) return;
    const rect = ref.current.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left - rect.width / 2) / rect.width;
    const offsetY = (event.clientY - rect.top - rect.height / 2) / rect.height;
    x.set(offsetX * intensity);
    y.set(offsetY * intensity);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{ x: springX, y: springY }}
      whileHover={reduceMotion || disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={className}
      {...rest}
    >
      {children}
    </motion.button>
  );
};

export default MagneticButton;
