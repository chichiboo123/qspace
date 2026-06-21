import { useMemo } from "react";

export default function StarField() {
  const stars = useMemo(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 2.5 + 0.5,
      duration: Math.random() * 4 + 2,
      delay: Math.random() * 3,
    }));
  }, []);

  return (
    <div className="star-field">
      {/* Nebula glows */}
      <div
        className="nebula-glow"
        style={{
          width: 400,
          height: 400,
          top: "10%",
          left: "60%",
          background: "radial-gradient(circle, hsl(270 60% 50% / 0.3), transparent)",
        }}
      />
      <div
        className="nebula-glow"
        style={{
          width: 300,
          height: 300,
          bottom: "20%",
          left: "10%",
          background: "radial-gradient(circle, hsl(190 90% 50% / 0.2), transparent)",
        }}
      />
      {stars.map((star) => (
        <div
          key={star.id}
          className="star"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: star.size,
            height: star.size,
            ["--duration" as string]: `${star.duration}s`,
            animationDelay: `${star.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
