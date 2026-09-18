import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * DossierCompileAnimation — Signature motion component displayed while
 * assembling the bank credit dossier / CAM packet.
 * Renders ruled ledger lines assembling into a statutory page block with PSL seal.
 */
export default function DossierCompileAnimation({
  stageText = 'खाता पृष्ठ संकलित हो रहे हैं • Compiling Ledger Folios...',
  subtext = 'बैंक-मानक PSL डॉसियर तैयार किया जा रहा है',
}) {
  const shouldReduceMotion = useReducedMotion();

  const lines = [1, 2, 3, 4, 5, 6];

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      {/* Ledger Page Sheet Container */}
      <div className="relative w-44 h-56 rounded-md bg-paper border border-ochre-400/50 shadow-md p-4 flex flex-col justify-between overflow-hidden">
        {/* Red Margin Rule line down left */}
        <div className="absolute left-3 top-0 bottom-0 w-[1.5px] bg-marginRule/70 pointer-events-none" />

        {/* Top Folio Header */}
        <div className="pl-3 border-b border-ochre-300/60 pb-1.5 flex justify-between items-center text-[8px] font-mono text-ledgerInk/60">
          <span>FOLIO #042</span>
          <span>SAAKHSETU</span>
        </div>

        {/* Assembling Ruled Lines */}
        <div className="pl-3 py-2 space-y-2 flex-1 flex flex-col justify-center">
          {lines.map((i) => (
            <motion.div
              key={i}
              initial={shouldReduceMotion ? { width: '100%', opacity: 1 } : { width: '0%', opacity: 0 }}
              animate={
                shouldReduceMotion
                  ? { width: '100%', opacity: 1 }
                  : {
                      width: ['0%', '100%'],
                      opacity: [0, 1],
                    }
              }
              transition={{
                duration: 0.5,
                delay: shouldReduceMotion ? 0 : i * 0.12,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: 'easeInOut',
              }}
              className="h-1 bg-ledgerInk/25 rounded-full"
              style={{
                maxWidth: i % 2 === 0 ? '90%' : '75%',
              }}
            />
          ))}
        </div>

        {/* Stamped PSL Mark in bottom corner */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 1.8 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1, scale: 1 }
              : {
                  opacity: [0, 0, 1, 1],
                  scale: [1.8, 1.8, 0.95, 1],
                  rotate: [0, 0, -6, -5],
                }
          }
          transition={{
            duration: 1.8,
            times: [0, 0.6, 0.8, 1],
            repeat: Infinity,
            repeatDelay: 0.8,
          }}
          className="self-end border border-marginRule text-marginRule rounded px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase font-serif"
        >
          PSL COMPLIANT
        </motion.div>
      </div>

      {/* Narrative status message */}
      <div className="mt-5 space-y-1">
        <p className="text-sm font-semibold text-ledgerInk font-serif tracking-tight">
          {stageText}
        </p>
        <p className="text-xs text-ledgerInk/65 font-sans">
          {subtext}
        </p>
      </div>
    </div>
  );
}
