import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * RubberStamp — Authentic circular vermillion stamped mark:
 * "दर्ज • RECORDED • साख सेतु"
 * Features haptic-feeling snap impact (scale-and-settle with slight overshoot).
 * Respects prefers-reduced-motion.
 */
export default function RubberStamp({
  text = 'दर्ज • RECORDED',
  subtext = 'साख सेतु सत्यापित',
  date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
  onComplete,
  className = '',
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className={`pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 ${className}`}>
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 2.3, rotate: 12 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: [0, 0.95, 0.9, 0.9],
                scale: [2.3, 0.92, 1.04, 1],
                rotate: [12, -4, -3, -3.5],
              }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.1 }
            : {
                duration: 0.42,
                times: [0, 0.6, 0.85, 1],
                ease: 'easeOut',
              }
        }
        onAnimationComplete={onComplete}
        className="relative flex flex-col items-center justify-center w-40 h-40 rounded-full border-[3px] border-double border-marginRule/90 p-2 shadow-sm select-none"
        style={{
          boxShadow: '0 0 0 2px rgba(178, 58, 46, 0.35), inset 0 0 0 2px rgba(178, 58, 46, 0.25)',
          background: 'radial-gradient(circle, rgba(245, 239, 227, 0.94) 55%, rgba(178, 58, 46, 0.08) 100%)',
        }}
      >
        {/* Inner dashed ring */}
        <div className="absolute inset-1.5 rounded-full border border-dashed border-marginRule/70 pointer-events-none" />

        {/* Top Arc text */}
        <div className="text-[10px] font-bold tracking-widest text-marginRule uppercase font-sans">
          {text}
        </div>

        {/* Center icon / rule */}
        <div className="my-0.5 flex items-center gap-1.5 text-marginRule">
          <div className="h-[1px] w-4 bg-marginRule/60" />
          <span className="text-xs font-serif font-black tracking-tight text-marginRule">
            ✓ {date}
          </span>
          <div className="h-[1px] w-4 bg-marginRule/60" />
        </div>

        {/* Bottom Subtext */}
        <div className="text-[9px] font-semibold tracking-wider text-marginRule/90 font-sans">
          {subtext}
        </div>

        {/* Distressed ink texture artifact overlay */}
        <div
          className="absolute inset-0 rounded-full mix-blend-multiply opacity-25 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 30% 35%, transparent 20%, rgba(178,58,46,0.4) 21%, transparent 22%),
                              radial-gradient(circle at 75% 70%, transparent 15%, rgba(178,58,46,0.3) 16%, transparent 17%)`,
          }}
        />
      </motion.div>
    </div>
  );
}
