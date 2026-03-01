import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const Card3D = ({ children, onClick, className }) => {
  const ref = useRef(null);
  
  // STATE: Check for mouse device
  const [isHoverable, setIsHoverable] = useState(false);
  // STATE: track if currently hovering to activate physics
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
    setIsHoverable(mediaQuery.matches);
  }, []);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // OPTIMIZATION: We allow the spring to be slightly stiffer for snappier response
  // But we only use these values when isActive is true
  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["9deg", "-9deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-9deg", "9deg"]);

  const handleMouseMove = (e) => {
    if (!ref.current || !isHoverable) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    if (isHoverable) setIsActive(true);
  };

  const handleMouseLeave = () => {
    if (isHoverable) {
        setIsActive(false);
        x.set(0);
        y.set(0);
    }
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        // PERFORMANCE MAGIC: 
        // If not active, we force rotation to 0 to save CPU. 
        // We only listen to the physics engine (rotateX/Y) when hovering.
        rotateY: isActive ? rotateY : 0,
        rotateX: isActive ? rotateX : 0,
        transformStyle: "preserve-3d",
        backfaceVisibility: "hidden", // Helps browser render faster
      }}
      className={`relative w-full cursor-pointer transition-all duration-200 ${className}`}
    >
      <div
        style={{
          transform: "translateZ(20px)",
          transformStyle: "preserve-3d",
        }}
        className="relative h-full w-full rounded-2xl bg-white dark:bg-zinc-900 shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden group hover:shadow-2xl hover:shadow-orange-500/20 transition-shadow duration-300"
      >
        {children}
        
        {/* Gloss Effect - Only renders on Desktop */}
        <div className="hidden md:block absolute inset-0 z-20 bg-gradient-to-tr from-white/30 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />
      </div>
    </motion.div>
  );
};

export default Card3D;