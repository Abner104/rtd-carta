import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";
import { gsap } from "gsap";
import { Wine, Lock, Mail, Eye, EyeOff } from "lucide-react";

function getCachedColors() {
  try {
    return {
      primary: localStorage.getItem("rtd_primary") || "#c89b4f",
      bg: localStorage.getItem("rtd_bg") || "#080808",
    };
  } catch {
    return { primary: "#c89b4f", bg: "#080808" };
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { primary, bg } = getCachedColors();

  const cardRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(logoRef.current,
      { scale: 0.5, opacity: 0, rotation: -15 },
      { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: "back.out(1.7)" }
    );
    gsap.fromTo(cardRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: "power2.out" }
    );
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setError("Email o contraseña incorrectos");
      gsap.fromTo(cardRef.current,
        { x: -8 }, { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
      );
      return;
    }

    navigate("/admin");
  }

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: bg }}
    >
      {/* Logo animado */}
      <div ref={logoRef} className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ backgroundColor: `${primary}20`, border: `1px solid ${primary}40` }}>
          <Wine size={32} style={{ color: primary }} />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white">RTD Admin</h1>
        <p className="mt-1 text-xs tracking-widest uppercase" style={{ color: primary }}>Panel de gestión</p>
      </div>

      {/* Card */}
      <form
        ref={cardRef}
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: `${primary}08`, border: `1px solid ${primary}22` }}
      >
        {/* Error */}
        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <Lock size={14} />
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Email</label>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600 transition">
            <Mail size={15} className="flex-shrink-0 text-zinc-600" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rtd.com"
              required
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-zinc-600"
            />
          </div>
        </div>

        {/* Contraseña */}
        <div className="mb-6">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Contraseña</label>
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 focus-within:border-zinc-600 transition">
            <Lock size={15} className="flex-shrink-0 text-zinc-600" />
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="flex-1 bg-transparent text-sm text-white outline-none placeholder-zinc-600"
            />
            <button type="button" onClick={() => setShowPass((v) => !v)} className="text-zinc-600 hover:text-zinc-400 transition">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-black transition hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-black/30 border-t-black" />
              Ingresando...
            </>
          ) : "Entrar al panel"}
        </button>
      </form>

      {/* Link al menú */}
      <a href="/" className="mt-6 text-xs transition hover:opacity-80" style={{ color: `${primary}88` }}>
        ← Ver carta pública
      </a>
    </main>
  );
}
