import { useMemo } from "react";

const SYMBOLS = ["</>", "{ }", "∑", "λ", "AI", "∫", "Δ", "∞", "π", "ƒ(x)"];

const FloatingSymbols = ({ active = false, reducedMotion = false }) => {
  const glyphs = useMemo(
    () =>
      SYMBOLS.map((symbol, index) => {
        const opacity = 0.08 + Math.random() * 0.12;
        return {
          id: `${symbol}-${index}`,
          symbol,
          left: 8 + Math.random() * 84,
          top: 10 + Math.random() * 70,
          delay: `${-Math.random() * 4}s`,
          opacity,
          size: 10 + Math.random() * 6,
          duration: `${6 + Math.random() * 6}s`,
          driftY: `${-10 - Math.random() * 15}px`,
        };
      }),
    []
  );

  if (reducedMotion) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {glyphs.map((g) => (
          <span
            key={g.id}
            className="absolute text-white/40 tracking-widest font-mono"
            style={{
              left: `${g.left}%`,
              top: `${g.top}%`,
              fontSize: `${g.size}px`,
              opacity: g.opacity,
            }}
          >
            {g.symbol}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <style>{`
        @keyframes floatSymbol {
          0%, 100% {
            transform: translate3d(0, 0, 0);
            opacity: var(--op);
          }
          50% {
            transform: translate3d(0, var(--dy), 0);
            opacity: calc(var(--op) + 0.15);
          }
        }
        .floating-glyph {
          will-change: transform, opacity;
          animation: floatSymbol var(--dur) ease-in-out var(--del) infinite;
        }
      `}</style>
      {glyphs.map((g) => (
        <span
          key={g.id}
          className="absolute text-white/50 tracking-widest floating-glyph font-mono"
          style={{
            left: `${g.left}%`,
            top: `${g.top}%`,
            fontSize: `${g.size}px`,
            '--op': g.opacity,
            '--dur': g.duration,
            '--del': g.delay,
            '--dy': g.driftY,
          }}
        >
          {g.symbol}
        </span>
      ))}
    </div>
  );
};

export default FloatingSymbols;
