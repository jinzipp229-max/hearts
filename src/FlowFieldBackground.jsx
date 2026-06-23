import { useEffect, useRef, useState } from "react";

const defaultConfig = {
  particleCount: 800,
  noiseScale: 0.003,
  speed: 1.2,
  lineLength: 180,
  lineWidth: 0.9,
  fadeAlpha: 0.05,
  colorMode: "aurora",
};

const colorModes = {
  aurora: (x, y, t, w, h) => {
    const hue = ((x / w) * 180 + (y / h) * 60 + t * 0.3) % 360;
    return `hsla(${hue}, 80%, 65%, 0.6)`;
  },
  fire: (x, y, t, w, h) => {
    const hue = 10 + ((y / h) * 40 + t * 0.5) % 50;
    return `hsla(${hue}, 95%, 55%, 0.65)`;
  },
  ocean: (x, y, t, w, h) => {
    const hue = 180 + ((x / w) * 40 + t * 0.2) % 40;
    return `hsla(${hue}, 75%, 60%, 0.55)`;
  },
  mono: (x, y, t) => {
    const alpha = 0.3 + Math.sin(t * 0.05) * 0.15;
    return `rgba(255,255,255,${alpha})`;
  },
};

// Simplex-like smooth noise using trig
function noise(x, y, t) {
  return (
    Math.sin(x * 1.3 + t * 0.5) * Math.cos(y * 0.9 - t * 0.3) +
    Math.sin(x * 0.7 - t * 0.4) * Math.cos(y * 1.5 + t * 0.2) +
    Math.sin((x + y) * 0.5 + t * 0.6) * 0.5
  );
}

export default function FlowFieldBackground() {
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const particlesRef = useRef([]);
  const configRef = useRef(defaultConfig);
  const [config, setConfig] = useState(defaultConfig);
  const [showControls, setShowControls] = useState(false);

  function initParticles(canvas, count) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        age: Math.random() * 200,
        maxAge: 150 + Math.random() * 200,
      });
    }
    return arr;
  }

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let t = 0;

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      particlesRef.current = initParticles(canvas, configRef.current.particleCount);
      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    resize();
    window.addEventListener("resize", resize);

    function animate() {
      const cfg = configRef.current;
      const { width: W, height: H } = canvas;
      const colorFn = colorModes[cfg.colorMode] || colorModes.aurora;

      ctx.fillStyle = `rgba(10, 10, 15, ${cfg.fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.age++;
        if (p.age > p.maxAge) {
          p.x = Math.random() * W;
          p.y = Math.random() * H;
          p.age = 0;
          p.maxAge = 150 + Math.random() * 200;
          continue;
        }

        const nx = p.x * cfg.noiseScale;
        const ny = p.y * cfg.noiseScale;
        const angle = noise(nx, ny, t * 0.01) * Math.PI * 2;

        const vx = Math.cos(angle) * cfg.speed;
        const vy = Math.sin(angle) * cfg.speed;

        const opacity = Math.sin((p.age / p.maxAge) * Math.PI);
        ctx.strokeStyle = colorFn(p.x, p.y, t, W, H).replace(
          /[\d.]+\)$/,
          `${(opacity * 0.7).toFixed(2)})`
        );
        ctx.lineWidth = cfg.lineWidth;

        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        p.x += vx;
        p.y += vy;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }

      t++;
      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  function update(key, val) {
    const next = { ...config, [key]: val };
    setConfig(next);
    if (key === "particleCount") {
      const canvas = canvasRef.current;
      if (canvas) particlesRef.current = initParticles(canvas, val);
    }
  }

  const sliders = [
    { key: "particleCount", label: "Particles", min: 100, max: 2000, step: 50 },
    { key: "noiseScale", label: "Flow scale", min: 0.001, max: 0.01, step: 0.0005 },
    { key: "speed", label: "Speed", min: 0.3, max: 4, step: 0.1 },
    { key: "lineWidth", label: "Line width", min: 0.3, max: 3, step: 0.1 },
    { key: "fadeAlpha", label: "Trail fade", min: 0.01, max: 0.2, step: 0.005 },
  ];

  return (
    <div style={{ position: "relative", width: "100%", height: "500px", borderRadius: 12, overflow: "hidden", background: "#0a0a0f" }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />

      {/* Color mode pills */}
      <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
        {Object.keys(colorModes).map((mode) => (
          <button
            key={mode}
            onClick={() => update("colorMode", mode)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: `1.5px solid ${config.colorMode === mode ? "#fff" : "rgba(255,255,255,0.25)"}`,
              background: config.colorMode === mode ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.4)",
              color: "#fff",
              fontSize: 12,
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              fontFamily: "inherit",
              textTransform: "capitalize",
              letterSpacing: "0.03em",
            }}
          >
            {mode}
          </button>
        ))}
      </div>

      {/* Controls toggle */}
      <button
        onClick={() => setShowControls((v) => !v)}
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          padding: "5px 14px",
          borderRadius: 20,
          border: "1.5px solid rgba(255,255,255,0.25)",
          background: "rgba(0,0,0,0.45)",
          color: "#fff",
          fontSize: 12,
          cursor: "pointer",
          backdropFilter: "blur(8px)",
          fontFamily: "inherit",
        }}
      >
        {showControls ? "hide controls" : "controls ↗"}
      </button>

      {/* Control panel */}
      {showControls && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            width: 220,
            background: "rgba(10,10,20,0.75)",
            backdropFilter: "blur(16px)",
            border: "0.5px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {sliders.map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontFamily: "inherit" }}>{label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", fontFamily: "inherit" }}>
                  {key === "noiseScale"
                    ? config[key].toFixed(4)
                    : key === "fadeAlpha"
                    ? config[key].toFixed(3)
                    : config[key]}
                </span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={config[key]}
                onChange={(e) => update(key, parseFloat(e.target.value))}
                style={{ width: "100%", accentColor: "#7f77dd" }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
