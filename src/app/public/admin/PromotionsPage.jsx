import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabaseClient";
import { Plus, Trash2, CheckCircle } from "lucide-react";

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 text-white shadow-xl"
    >
      <CheckCircle size={18} className="text-green-400" />
      {message}
    </motion.div>
  );
}

export default function PromotionsPage() {
  const { primary } = useOutletContext() || { primary: "#c89b4f" };
  const [promotions, setPromotions] = useState([]);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ title: "", description: "", badge: "" });

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase.from("promotions").select("*").order("sort_order");
    setPromotions(data || []);
  }

  async function create(e) {
    e.preventDefault();
    if (!form.title.trim()) return;
    const { error } = await supabase.from("promotions").insert({
      title: form.title,
      description: form.description,
      badge: form.badge || null,
      active: true,
      sort_order: promotions.length,
    });
    if (error) { setToast("Error al crear"); return; }
    setForm({ title: "", description: "", badge: "" });
    await load();
    setToast("Promoción creada");
  }

  async function toggle(id, active) {
    await supabase.from("promotions").update({ active: !active }).eq("id", id);
    await load();
    setToast(active ? "Desactivada" : "Activada");
  }

  async function remove(id, title) {
    if (!confirm(`¿Eliminar "${title}"?`)) return;
    await supabase.from("promotions").delete().eq("id", id);
    await load();
    setToast("Promoción eliminada");
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ color: primary }}>Promociones</h1>
        <p className="mt-1 text-zinc-400">Destacá ofertas en la parte superior del menú</p>
      </motion.div>

      <form onSubmit={create} className="mt-8 grid gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <input
          value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="Título * (ej: 2x1 en Mojitos)" required
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-600"
        />
        <textarea
          value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción (ej: Todos los viernes de 18 a 21hs)" rows="2"
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-600"
        />
        <input
          value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })}
          placeholder="Badge (ej: 🔥 Oferta, ✨ Nuevo, 🎉 Promo)"
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none focus:border-zinc-600"
        />
        <button
          type="submit"
          className="flex w-fit items-center gap-2 rounded-xl px-5 py-3 font-bold text-black transition hover:opacity-80"
          style={{ backgroundColor: primary }}
        >
          <Plus size={16} /> Agregar promoción
        </button>
      </form>

      <div className="mt-8 grid gap-3">
        {promotions.map((promo) => (
          <div key={promo.id} className="flex items-start justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div>
              {promo.badge && (
                <span className="mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: `${primary}25`, color: primary }}>
                  {promo.badge}
                </span>
              )}
              <h3 className="font-semibold text-white">{promo.title}</h3>
              {promo.description && <p className="mt-0.5 text-sm text-zinc-400">{promo.description}</p>}
            </div>
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => toggle(promo.id, promo.active)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
                style={promo.active
                  ? { backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }
                  : { backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }
                }
              >
                {promo.active ? "Desactivar" : "Activar"}
              </button>
              <button onClick={() => remove(promo.id, promo.title)} className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 transition">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <p className="text-center text-sm text-zinc-600 py-8">No hay promociones. Creá una arriba.</p>
        )}
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
