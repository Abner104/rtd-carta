import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { supabase } from "../../../lib/supabaseClient";
import { Package, Tag, Eye, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { primary } = useOutletContext() || { primary: "#c89b4f" };
  const [stats, setStats] = useState({ products: 0, categories: 0, active_products: 0, active_categories: 0 });
  const cardsRef = useRef(null);

  useEffect(() => {
    async function load() {
      const [{ count: products }, { count: active_products }, { count: categories }, { count: active_categories }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("products").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("categories").select("*", { count: "exact", head: true }).eq("active", true),
      ]);
      setStats({ products, active_products, categories, active_categories });
    }
    load();
  }, []);

  useEffect(() => {
    if (!cardsRef.current) return;
    gsap.fromTo(
      cardsRef.current.children,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power3.out" }
    );
  }, [stats]);

  const cards = [
    { label: "Productos totales", value: stats.products, icon: Package, sub: `${stats.active_products} activos` },
    { label: "Categorías totales", value: stats.categories, icon: Tag, sub: `${stats.active_categories} activas` },
    { label: "Productos activos", value: stats.active_products, icon: Eye, sub: "visibles en el menú" },
    { label: "Cobertura", value: stats.products ? `${Math.round((stats.active_products / stats.products) * 100)}%` : "0%", icon: TrendingUp, sub: "del menú activo" },
  ];

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <h1 className="text-3xl font-bold" style={{ color: primary }}>Dashboard</h1>
        <p className="mt-1 text-zinc-400">Resumen de tu carta digital</p>
      </motion.div>

      <div ref={cardsRef} className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, sub }) => (
          <div
            key={label}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-400">{label}</p>
              <Icon size={18} style={{ color: primary }} />
            </div>
            <p className="mt-3 text-3xl font-black" style={{ color: primary }}>{value}</p>
            <p className="mt-1 text-xs text-zinc-500">{sub}</p>
          </div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <h2 className="font-semibold text-white mb-1">Acceso rápido</h2>
        <p className="text-sm text-zinc-400">Usá el sidebar para gestionar categorías, productos y configuración. El botón <span style={{ color: primary }}>"Ver menú"</span> abre la carta pública.</p>
      </motion.div>
    </div>
  );
}
