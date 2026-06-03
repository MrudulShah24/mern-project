import { useMemo } from "react";

const ParticleField = ({ count = 36, active = false, reducedMotion = false }) => {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, index) => {
        const opacity = 0.08 + Math.random() * 0.18;
        return {
          id: index,
          size: 2 + Math.random() * 2.8,
          left: Math.random() * 100,
          top: Math.random() * 100,
          opacity,
          duration: `${8 + Math.random() * 8}s`,
          delay: `${-Math.random() * 6}s`, // Negative delay makes them start immediately in middle of cycle
          driftX: `${(Math.random() - 0.5) * 24}px`,
          driftY: `${-15 - Math.random() * 20}px`,
        };
      }),
    [count]
  );

  if (reducedMotion) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-white/70"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.left}%`,
              top: `${p.top}%`,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes floatParticle {
          0%, 100% {
            transform: translate3d(0, 0, 0);
            opacity: var(--op);
          }
          50% {
            transform: translate3d(var(--dx), var(--dy), 0);
            opacity: calc(var(--op) + 0.12);
          }
        }
        .particle-dot {
          will-change: transform, opacity;
          animation: floatParticle var(--dur) ease-in-out var(--del) infinite;
        }
      `}</style>
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-white/60 particle-dot"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.left}%`,
            top: `${p.top}%`,
            '--op': p.opacity,
            '--dur': p.duration,
            '--del': p.delay,
            '--dx': p.driftX,
            '--dy': p.driftY,
          }}
        />
      ))}
    </div>
  );
};

export default ParticleField;
