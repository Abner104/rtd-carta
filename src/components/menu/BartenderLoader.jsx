import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export default function BartenderLoader({ primary = "#c89b4f", bg = "#080808", text = "Preparando tu carta" }) {
  const fillRef = useRef(null);
  const dropsRef = useRef([]);
  const wrapRef = useRef(null);

  useEffect(() => {
    // Entrada del conjunto
    gsap.fromTo(wrapRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Líquido sube y baja en loop
    gsap.fromTo(fillRef.current,
      { scaleY: 0, transformOrigin: "bottom center" },
      { scaleY: 1, duration: 2, ease: "power1.inOut", repeat: -1, yoyo: true }
    );

    // Gotas caen en cascada
    dropsRef.current.forEach((drop, i) => {
      if (!drop) return;
      gsap.set(drop, { y: 0, opacity: 0 });
      gsap.to(drop, {
        y: 40,
        opacity: 1,
        duration: 0.5,
        delay: i * 0.25 + 0.3,
        repeat: -1,
        repeatDelay: 1.2,
        ease: "power2.in",
        onRepeat() { gsap.set(drop, { y: 0, opacity: 0 }); },
      });
    });
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{ backgroundColor: bg }}
    >
      <div ref={wrapRef} className="flex flex-col items-center gap-6">

        {/* Copa + gotas */}
        <div className="relative flex flex-col items-center">
          {/* Gotas encima de la copa */}
          <div className="relative mb-2 h-10 w-16 flex items-end justify-center gap-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                ref={(el) => { dropsRef.current[i] = el; }}
                style={{
                  width: 6,
                  height: 10,
                  borderRadius: "50% 50% 50% 50% / 40% 40% 60% 60%",
                  backgroundColor: primary,
                  opacity: 0,
                }}
              />
            ))}
          </div>

          {/* Copa SVG grande */}
          <svg width="100" height="120" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <clipPath id="glass-fill-clip">
                <path d="M16 8 L84 8 L62 68 L56 78 L44 78 L38 68 Z" />
              </clipPath>
            </defs>

            {/* Líquido animado */}
            <rect
              ref={fillRef}
              x="0" y="0" width="100" height="82"
              fill={primary}
              fillOpacity="0.45"
              clipPath="url(#glass-fill-clip)"
            />

            {/* Copa exterior */}
            <path
              d="M14 6 L86 6 L63 68 L57 80 L57 96 L68 96 L68 104 L32 104 L32 96 L43 96 L43 80 L37 68 Z"
              stroke={primary}
              strokeWidth="3"
              strokeLinejoin="round"
              fill="none"
            />

            {/* Brillo interior */}
            <path d="M22 16 L78 16" stroke={primary} strokeWidth="1.5" strokeOpacity="0.2" strokeLinecap="round" />
          </svg>
        </div>

        {/* Texto */}
        <div className="text-center">
          <p className="text-sm font-semibold tracking-[0.4em] uppercase" style={{ color: primary }}>
            {text}
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {[0, 1, 2].map((i) => <DotPulse key={i} delay={i * 0.2} primary={primary} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function DotPulse({ delay, primary }) {
  const ref = useRef(null);
  useEffect(() => {
    gsap.fromTo(ref.current,
      { opacity: 0.15, scale: 0.6 },
      { opacity: 1, scale: 1.4, duration: 0.5, delay, repeat: -1, yoyo: true, ease: "power1.inOut" }
    );
  }, [delay]);
  return (
    <div ref={ref} className="h-2 w-2 rounded-full" style={{ backgroundColor: primary }} />
  );
}
