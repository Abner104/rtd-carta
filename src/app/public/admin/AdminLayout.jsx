import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { LayoutDashboard, Tag, Package, Settings, ExternalLink, Menu, X, LogOut, Megaphone } from "lucide-react";
import { gsap } from "gsap";
import { AnimatePresence, motion } from "framer-motion";
import BartenderLoader from "../../../components/menu/BartenderLoader";

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/categorias", label: "Categorías", icon: Tag },
  { to: "/admin/productos", label: "Productos", icon: Package },
  { to: "/admin/promociones", label: "Promociones", icon: Megaphone },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings },
];

function getCachedColors() {
  try {
    return {
      primary_color: localStorage.getItem("rtd_primary") || "#c89b4f",
      background_color: localStorage.getItem("rtd_bg") || "#080808",
    };
  } catch {
    return { primary_color: "#c89b4f", background_color: "#080808" };
  }
}

export default function AdminLayout() {
  const cached = getCachedColors();
  const [settings, setSettings] = useState({ logo_url: null, business_name: "RTD Admin", ...cached });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin/login");
  }

  useEffect(() => {
    supabase.from("settings").select("logo_url, business_name, primary_color, background_color").limit(1).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setSettings(s => ({ ...s, ...data }));
          if (data.primary_color) localStorage.setItem("rtd_primary", data.primary_color);
          if (data.background_color) localStorage.setItem("rtd_bg", data.background_color);
        }
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!sidebarRef.current) return;
    gsap.fromTo(
      sidebarRef.current.querySelectorAll("a, button"),
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: "power2.out" }
    );
  }, []);

  // Cierra el menú mobile al navegar
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const primary = settings.primary_color || "#c89b4f";

  function isActive(item) {
    return item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to);
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-3 mb-10">
        {settings.logo_url && (
          <img src={settings.logo_url} alt="Logo" className="h-9 w-9 rounded-full object-cover" />
        )}
        <h1 className="text-lg font-bold truncate" style={{ color: primary }}>{settings.business_name}</h1>
      </div>

      <nav className="flex-1 space-y-1">
        {NAV.map(({ to, label, icon: Icon, exact }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all"
            style={isActive({ to, exact })
              ? { backgroundColor: `${primary}22`, color: primary, borderLeft: `3px solid ${primary}` }
              : { color: "#a1a1aa", paddingLeft: "19px" }
            }
          >
            <Icon size={17} />
            {label}
          </Link>
        ))}
      </nav>

      <a
        href="/"
        target="_blank"
        rel="noreferrer"
        className="mt-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition hover:opacity-80"
        style={{ borderColor: `${primary}44`, color: primary }}
      >
        <ExternalLink size={15} />
        Ver menú
      </a>

      <button
        onClick={handleLogout}
        className="mt-2 flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-zinc-500 transition hover:text-red-400"
      >
        <LogOut size={15} />
        Cerrar sesión
      </button>
    </>
  );

  if (!loaded) return <BartenderLoader primary={settings.primary_color} bg={settings.background_color} text="Cargando panel" />;

  return (
    <div className="flex min-h-screen bg-zinc-950 text-white">

      {/* Sidebar desktop */}
      <aside ref={sidebarRef} className="hidden w-60 flex-col border-r border-zinc-800 p-5 lg:flex">
        <SidebarContent />
      </aside>

      {/* Topbar mobile */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 lg:hidden">
        <div className="flex items-center gap-2">
          {settings.logo_url && <img src={settings.logo_url} alt="Logo" className="h-7 w-7 rounded-full object-cover" />}
          <span className="text-sm font-bold" style={{ color: primary }}>{settings.business_name}</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-1 text-zinc-400">
          <Menu size={22} />
        </button>
      </div>

      {/* Drawer mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 p-5 lg:hidden"
            >
              <button onClick={() => setMobileOpen(false)} className="mb-4 self-end p-1 text-zinc-400">
                <X size={20} />
              </button>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenido */}
      <main className="flex-1 overflow-auto p-4 pt-16 sm:p-6 sm:pt-20 lg:p-8 lg:pt-8">
        <Outlet context={{ primary }} />
      </main>
    </div>
  );
}
