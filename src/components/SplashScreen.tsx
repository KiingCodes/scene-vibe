import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import logo from '@/assets/scene-logo.jpg';

const SplashScreen = ({ minDuration = 1400 }: { minDuration?: number }) => {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setShow(false), minDuration);
    return () => clearTimeout(t);
  }, [minDuration]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black"
          aria-hidden
        >
          {/* Ambient glows */}
          <div className="absolute -top-40 -left-40 w-[480px] h-[480px] rounded-full opacity-50 blur-[120px]" style={{ background: 'hsl(270 90% 55%)' }} />
          <div className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full opacity-50 blur-[130px]" style={{ background: 'hsl(210 100% 55%)' }} />

          <motion.img
            src={logo}
            alt="SCENE"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-[260px] max-w-[70vw] drop-shadow-[0_0_45px_rgba(168,85,247,0.55)]"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
