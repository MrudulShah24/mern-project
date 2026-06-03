import { motion } from "framer-motion";
import { fadeUp } from "../../motion/variants";

const MotionReveal = ({ children, className, variants = fadeUp, ...rest }) => (
  <motion.div className={className} variants={variants} {...rest}>
    {children}
  </motion.div>
);

export default MotionReveal;
