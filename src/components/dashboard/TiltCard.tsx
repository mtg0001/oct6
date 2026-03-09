import { useRef, useState, useCallback } from "react";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

export function TiltCard({ children, className = "" }: TiltCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={`transition-transform duration-300 ease-out ${hovered ? "scale-[1.02]" : "scale-100"} ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}
