import { useEffect, useState } from "react";

export default function CursorFollower() {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);
    };
    const leave = () => setVisible(false);
    const enter = () => setVisible(true);

    window.addEventListener("mousemove", move);
    document.addEventListener("mouseleave", leave);
    document.addEventListener("mouseenter", enter);
    return () => {
      window.removeEventListener("mousemove", move);
      document.removeEventListener("mouseleave", leave);
      document.removeEventListener("mouseenter", enter);
    };
  }, [visible]);

  return (
    <div
      className="pointer-events-none fixed z-[9999] rounded-full transition-transform duration-150 ease-out"
      style={{
        left: pos.x - 10,
        top: pos.y - 10,
        width: 20,
        height: 20,
        background: "hsl(var(--accent))",
        border: "2px solid hsl(var(--accent))",
        boxShadow: "0 0 15px hsl(var(--accent) / 0.5), 0 0 30px hsl(var(--accent) / 0.2)",
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0)",
      }}
    />
  );
}
