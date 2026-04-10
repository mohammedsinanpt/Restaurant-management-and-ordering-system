import React, { useRef, useState, useEffect, memo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// Wrap in memo so the component doesn't re-render unless props change
const Card3D = memo(({ children, onClick, className }) => {
  const ref = useRef(null);
  const [isHoverable, setIsHoverable] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Detect if the device actually supports hover (prevents lag on mobile)
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsHoverable(mediaQuery.matches);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Simplified physics for smoother performance
  const mouseXSpring = useSpring(x, { stiffness: 100, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 100, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7deg", "-7deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7deg", "7deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current || !isHoverable || !isActive) return;

    const rect = ref.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => isHoverable && setIsActive(true)}
      onMouseLeave={() => {
        setIsActive(false);
        x.set(0);
        y.set(0);
      }}
      onClick={onClick}
      style={{
        // PERFORMANCE: Only calculate rotation if the user is hovering
        rotateY: isActive ? rotateY : 0,
        rotateX: isActive ? rotateX : 0,
        transformStyle: "preserve-3d",
        willChange: isActive ? "transform" : "auto", // Hints GPU only when needed
      }}
      className={`relative w-full cursor-pointer ${className}`}
    >
      <div
        style={{
          transform: "translateZ(20px)",
          transformStyle: "preserve-3d",
        }}
        className="relative h-full w-full rounded-2xl bg-zinc-900 shadow-xl border border-white/5 overflow-hidden group transition-shadow duration-300"
      >
        {children}
      </div>
    </motion.div>
  );
});

export default Card3D;