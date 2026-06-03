import { motion } from "framer-motion";
import { staggerContainer } from "../../motion/variants";

const MotionStagger = ({ children, className, stagger = 0.12, delay = 0.1, ...rest }) => (
  <motion.div
    className={className}
    variants={staggerContainer(stagger, delay)}
    initial="hidden"
    animate="show"
    {...rest}
  >
    {children}
  </motion.div>
);

export default MotionStagger;
