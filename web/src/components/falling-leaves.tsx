"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

function Leaf({ delay, x, size, dur }: { delay: number; x: number; size: number; dur: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="absolute -top-10 text-crimson/70"
      style={{ left: `${x}%` }}
      initial={{ y: -40, rotate: 0, opacity: 0 }}
      animate={{
        y: ["-5vh", "105vh"],
        x: [0, 30, -20, 25, 0],
        rotate: [0, 120, 240, 360],
        opacity: [0, 0.9, 0.9, 0.5, 0],
      }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
    >
      {/* stylised maple leaf */}
      <path
        fill="currentColor"
        d="M12 2l1.6 3.2 3.2-1 .1 3.3 3.1 1.1-2 2.6 2 2.6-3.1 1.1-.1 3.3-3.2-1L12 22l-1.6-3.2-3.2 1-.1-3.3L4 16.4l2-2.6-2-2.6 3.1-1.1.1-3.3 3.2 1L12 2z"
      />
    </motion.svg>
  );
}

export function FallingLeaves() {
  const leaves = useMemo(
    () =>
      Array.from({ length: 16 }).map((_, i) => ({
        id: i,
        delay: Math.random() * 12,
        x: Math.random() * 100,
        size: 12 + Math.random() * 16,
        dur: 12 + Math.random() * 12,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {leaves.map((l) => (
        <Leaf key={l.id} delay={l.delay} x={l.x} size={l.size} dur={l.dur} />
      ))}
    </div>
  );
}
