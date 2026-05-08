import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { supabase } from "../../../lib/supabaseClient";
import { Plus, Trash2, CheckCircle, ImagePlus } from "lucide-react";

function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-zinc-800 px-5 py-3 text-white shadow-xl"
    >
      <CheckCircle size={18} className="text-green-400" />
      {message}
    </motion.div>
  );
}

export default function CategoriesPage() {
  const { primary } = useOutletContext() || { primary: "#c89b4f" };
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState("");
  const [toast, setToast] = useState(null);
  const listRef = useRef(null);

  useEffect(() => { loadCategories(); }, []);

  async function loadCategories() {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
  }

  useEffect(() => {
    if (!listRef.current || categories.length === 0) return;
    gsap.fromTo(
      listRef.current.children,
      { x: -15, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.06, duration: 0.35, ease: "power2.out" }
    );
  }, [categories.length]);

  async function createCategory(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await supabase.from("categories").insert({ name, active: true, sort_order: categories.length + 1 });
    setName("");
    await loadCategories();
    setToast("Categoría creada");
  }

  async function uploadBanner(id, file) {
    const ext = file.name.split(".").pop();
    const fileName = `banner-${id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(fileName, file, { upsert: true });
    if (error) { setToast("Error subiendo banner"); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(fileName);
    await supabase.from("categories").update({ banner_url: data.publicUrl }).eq("id", id);
    await loadCategories();
    setToast("Banner actualizado");
  }

  async function deleteCategory(id, catName) {
    if (!confirm(`¿Eliminar "${catName}"? Los productos de esta categoría quedarán sin categoría.`)) return;
    await supabase.from("categories").delete().eq("id", id);
    await loadCategories();
    setToast("Categoría eliminada");
  }

  async function toggleCategory(id, active) {
    await supabase.from("categories").update({ active: !active }).eq("id", id);
    await loadCategories();
    setToast(active ? "Categoría desactivada" : "Categoría activada");
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ color: primary }}>Categorías</h1>
        <p className="mt-1 text-zinc-400">Administra categorías del menú</p>
      </motion.div>

      <form onSubmit={createCategory} className="mt-8 flex gap-3">
        <input
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-zinc-600"
          placeholder="Ej: Mojitos"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-black transition hover:opacity-80"
          style={{ backgroundColor: primary }}
        >
          <Plus size={18} />
          Crear
        </button>
      </form>

      <div ref={listRef} className="mt-8 grid gap-3">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
          >
            <div className="flex items-center gap-4">
              {category.banner_url && (
                <img src={category.banner_url} alt={category.name} className="h-12 w-20 rounded-lg object-cover" />
              )}
              <div>
                <h3 className="text-lg font-semibold">{category.name}</h3>
                <p className={`mt-0.5 text-sm ${category.active ? "text-green-400" : "text-red-400"}`}>
                  {category.active ? "Activa" : "Desactivada"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="cursor-pointer rounded-lg p-2 transition hover:opacity-70" style={{ color: primary }} title="Subir banner">
                <ImagePlus size={16} />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(category.id, e.target.files[0])} />
              </label>
              <button
                onClick={() => toggleCategory(category.id, category.active)}
                className="rounded-lg px-4 py-2 text-sm font-medium transition"
                style={category.active
                  ? { backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }
                  : { backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }
                }
              >
                {category.active ? "Desactivar" : "Activar"}
              </button>

              <button
                onClick={() => deleteCategory(category.id, category.name)}
                className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
