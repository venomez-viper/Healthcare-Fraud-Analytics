"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const PINKS = ["#f4c2d2", "#eaa6bd", "#f7d4de", "#e58fa9"];

function Petal({
  delay,
  x,
  size,
  dur,
  color,
}: {
  delay: number;
  x: number;
  size: number;
  dur: number;
  color: string;
}) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className="absolute -top-10"
      style={{ left: `${x}%`, color }}
      initial={{ y: -40, rotate: 0, opacity: 0 }}
      animate={{
        y: ["-5vh", "105vh"],
        x: [0, 40, -25, 35, 0],
        rotate: [0, 160, 300, 420],
        opacity: [0, 0.95, 0.95, 0.6, 0],
      }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
    >
      {/* cherry blossom petal with a soft notch */}
      <path
        fill="currentColor"
        d="M12 3c-3 3.5-4.4 8-3 12.5.5 1.7 1.8 3 3 4.5 1.2-1.5 2.5-2.8 3-4.5 1.4-4.5 0-9-3-12.5zm0 12.8l-1.4 2.1h2.8L12 15.8z"
      />
    </motion.svg>
  );
}

export function FallingLeaves() {
  const petals = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        delay: Math.random() * 12,
        x: Math.random() * 100,
        size: 10 + Math.random() * 14,
        dur: 11 + Math.random() * 12,
        color: PINKS[i % PINKS.length],
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {petals.map((p) => (
        <Petal key={p.id} {...p} />
      ))}
    </div>
  );
}
