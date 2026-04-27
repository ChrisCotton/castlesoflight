import React, { useRef } from 'react';
import { cn } from "@/lib/utils";

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
  flashlightSize?: number;
  showBeam?: boolean;
  style?: React.CSSProperties;
}

/**
 * InteractiveCard
 * Wraps content with:
 * 1. Animated Gradient Border (Border Beam) on hover
 * 2. Mouse-following Flashlight effect (Radial Glow)
 * 3. Optional scanning beam animation
 */
export default function InteractiveCard({ 
  children, 
  className,
  containerClassName,
  flashlightSize,
  showBeam = false,
  style,
}: InteractiveCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    containerRef.current.style.setProperty('--x', `${x}px`);
    containerRef.current.style.setProperty('--y', `${y}px`);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "border-beam-container flashlight-effect group",
        containerClassName
      )}
      style={{
        ...style,
        ...(flashlightSize ? { '--flashlight-size': `${flashlightSize}px` } as React.CSSProperties : {}),
      }}
    >
      {/* The scanning beam animation */}
      {showBeam && <div className="scanning-beam" />}

      {/* The content wrapper */}
      <div className={cn("relative z-10 h-full w-full", className)}>
        {children}
      </div>

      {/* The rotating light beam - placed after content with high z-index */}
      <div className="border-beam" />
    </div>
  );
}
