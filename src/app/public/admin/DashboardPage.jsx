import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { supabase } from "../../../lib/supabaseClient";
import { Package, Tag, Eye, TrendingUp, Users, ExternalLink, RefreshCw } from "lucide-react";

export default function DashboardPage() {
  const { primary } = useOutletContext() || { primary: "#c89b4f" };
  const [stats, setStats] = useState({ products: 0, active_products: 0, categories: 0, active_categories: 0, views_today: 0, views_total: 0 });
  const [preview, setPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const cardsRef = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const today = new Date().toISOString().split("T")[0];
    const [
      { count: products },
      { count: active_products },
      { count: categories },
      { count: active_categories },
      { count: views_total },
      { count: views_today },
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("page_views").select("*", { count: "exact", head: true }),
      supabase.from("page_views").select("*", { count: "exact", head: true }).gte("viewed_at", `${today}T00:00:00`),
    ]);
    setStats({ products, active_products, categories, active_categories, views_total, views_today });
  }

  useEffect(() => {
    if (!cardsRef.current) return;
    gsap.fromTo(
      cardsRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out" }
    );
  }, [stats.products]);

  const cards = [
    { label: "Visitas hoy", value: stats.views_today ?? 0, icon: Users, sub: `${stats.views_total ?? 0} totales` },
    { label: "Productos activos", value: stats.active_products ?? 0, icon: Package, sub: `${stats.products ?? 0} totales` },
    { label: "Categorías activas", value: stats.active_categories ?? 0, icon: Tag, sub: `${stats.categories ?? 0} totales` },
    {
      label: "Cobertura",
      value: stats.products ? `${Math.round(((stats.active_products ?? 0) / stats.products) * 100)}%` : "0%",
      icon: TrendingUp,
      sub: "del menú activo"
    },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primary }}>Dashboard</h1>
          <p className="mt-1 text-zinc-400">Resumen de tu carta digital</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="flex items-center gap-1.5 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-400 transition hover:text-white"
          >
            <RefreshCw size={13} /> Actualizar
          </button>
          <button
            onClick={() => setPreview((v) => !v)}
            className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-black transition hover:opacity-80"
            style={{ backgroundColor: primary }}
          >
            <Eye size={13} />
            {preview ? "Cerrar preview" : "Vista previa"}
          </button>
        </div>
      </motion.div>

      <div ref={cardsRef} className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, sub }) => (
          <div key={label} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">{label}</p>
              <Icon size={17} style={{ color: primary }} />
            </div>
            <p className="mt-3 text-3xl font-black" style={{ color: primary }}>{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{sub}</p>
          </div>
        ))}
      </div>

      {/* Vista previa iframe */}
      {preview && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 overflow-hidden rounded-2xl border border-zinc-800"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-2">
            <span className="text-xs text-zinc-400">Vista previa del menú</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewKey((k) => k + 1)}
                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-white transition"
              >
                <RefreshCw size={11} /> Recargar
              </button>
              <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs hover:opacity-70 transition" style={{ color: primary }}>
                <ExternalLink size={11} /> Abrir
              </a>
            </div>
          </div>
          <iframe
            key={previewKey}
            src="/"
            className="h-[600px] w-full border-0"
            title="Vista previa del menú"
          />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5"
      >
        <h2 className="font-semibold text-white">Accesos rápidos</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: "Agregar producto", href: "/admin/productos" },
            { label: "Nueva categoría", href: "/admin/categorias" },
            { label: "Configuración", href: "/admin/configuracion" },
            { label: "Promociones", href: "/admin/promociones" },
          ].map(({ label, href }) => (
            <a key={href} href={href}
              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 transition hover:text-white hover:border-zinc-500">
              {label}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
