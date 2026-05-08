import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabaseClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Credenciales incorrectas");
      return;
    }

    navigate("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] text-white">
      <form onSubmit={handleLogin} className="w-full max-w-sm rounded-2xl border border-[#c89b4f]/30 bg-zinc-950 p-8">
        <h1 className="text-2xl font-bold text-[#c89b4f]">RTD Admin</h1>
        <p className="mt-2 text-sm text-zinc-400">Ingresa al panel</p>

        <input
          className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 outline-none"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="mt-3 w-full rounded-lg bg-zinc-900 px-4 py-3 outline-none"
          placeholder="Contraseña"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="mt-6 w-full rounded-lg bg-[#c89b4f] py-3 font-bold text-black">
          Entrar
        </button>
      </form>
    </main>
  );
}