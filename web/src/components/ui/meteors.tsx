"use client";

/* Meteors - Magic UI / 21st.dev ecosystem component, themed crimson. */

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function Meteors({ number = 14, className }: { number?: number; className?: string }) {
  const [styles, setStyles] = useState<React.CSSProperties[]>([]);

  useEffect(() => {
    setStyles(
      Array.from({ length: number }).map(() => ({
        top: "-10%",
        left: `${Math.floor(Math.random() * 100)}%`,
        animationDelay: `${(Math.random() * 5).toFixed(2)}s`,
        animationDuration: `${(3 + Math.random() * 6).toFixed(2)}s`,
      }))
    );
  }, [number]);

  return (
    <>
      {styles.map((s, i) => (
        <span
          key={i}
          style={s}
          className={cn(
            "meteor pointer-events-none absolute size-[2px] rounded-full bg-crimson-bright shadow-[0_0_8px_2px_rgba(224,70,58,0.5)]",
            className
          )}
        >
          <span className="absolute top-1/2 -z-10 h-px w-[70px] -translate-y-1/2 bg-gradient-to-r from-crimson-bright to-transparent" />
        </span>
      ))}
    </>
  );
}
