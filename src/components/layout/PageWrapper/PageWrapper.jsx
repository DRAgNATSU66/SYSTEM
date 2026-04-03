import React from 'react';
import { motion } from 'framer-motion'; // eslint-disable-line no-unused-vars

const variants = {
  hidden: { opacity: 0, y: 15 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut', staggerChildren: 0.1 } },
  exit: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } }
};

const PageWrapper = ({ children, className }) => {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
};
export default PageWrapper;
