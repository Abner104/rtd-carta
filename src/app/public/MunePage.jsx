import { useEffect, useRef, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { Wine, Clock, AtSign, ChevronDown, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import BartenderLoader from "../../components/menu/BartenderLoader";

function ProductCard({ product, primary }) {
  const [open, setOpen] = useState(false);
  const [variants, setVariants] = useState(null);

  async function handleToggle() {
    if (!open && variants === null) {
      const { data } = await supabase
        .from("product_variants")
        .select("*")
        .eq("product_id", product.id)
        .order("sort_order");
      setVariants(data || []);
    }
    setOpen((v) => !v);
  }

  return (
    <div className="border-b" style={{ borderColor: `${primary}18` }}>
      <button onClick={handleToggle} className="flex w-full items-start gap-4 py-5 text-left sm:gap-5">
        <div
          className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105 sm:h-16 sm:w-16 md:h-20 md:w-20"
          style={{ backgroundColor: `${primary}15`, color: primary }}
        >
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            : <Wine size={26} />
          }
        </div>

        <div className="flex flex-1 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="pl-3 sm:pl-4" style={{ borderLeft: `2px solid ${primary}40` }}>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black uppercase tracking-[0.12em] sm:text-lg md:text-xl">{product.name}</h3>
              <ChevronDown size={15} className="flex-shrink-0 transition-transform duration-300" style={{ color: primary, transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
            </div>
            <p className="mt-1 text-xs text-zinc-400 sm:text-sm md:max-w-sm">{product.description}</p>
          </div>

          <div className="mt-2 flex gap-3 pl-3 sm:mt-0 sm:flex-col sm:items-end sm:gap-1 sm:pl-0">
            {product.price_500 > 0 && <p className="text-base font-bold sm:text-lg" style={{ color: primary }}>500ml · ${Number(product.price_500).toLocaleString("es-CL")}</p>}
            {product.price_1000 > 0 && <p className="text-xs text-zinc-400 sm:text-sm">1L · ${Number(product.price_1000).toLocaleString("es-CL")}</p>}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {open && variants && variants.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mb-4 ml-[4.5rem] grid grid-cols-2 gap-2 rounded-xl p-3 sm:grid-cols-3" style={{ backgroundColor: `${primary}0d` }}>
              {variants.map((v) => (
                <div key={v.id} className="flex flex-col gap-1 rounded-lg px-3 py-2" style={{ backgroundColor: `${primary}15` }}>
                  <span className="text-sm font-semibold capitalize" style={{ color: primary }}>{v.name}</span>
                  {v.price_500 > 0 && <span className="text-xs text-zinc-300">500ml · ${Number(v.price_500).toLocaleString("es-CL")}</span>}
                  {v.price_1000 > 0 && <span className="text-xs text-zinc-400">1L · ${Number(v.price_1000).toLocaleString("es-CL")}</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Lee colores cacheados del localStorage para el loading
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

export default function MenuPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Colores para el loader — usa cache si existe
  const [loaderColors] = useState(getCachedColors);

  const sidebarRef = useRef(null);
  const logoRef = useRef(null);
  const tabsRef = useRef(null);
  const sectionRefs = useRef({});
  const isScrollingRef = useRef(false);
  const scrollTimerRef = useRef(null);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: s }, { data: c }, { data: p }] = await Promise.all([
      supabase.from("settings").select("*").limit(1).maybeSingle(),
      supabase.from("categories").select("*").eq("active", true).order("sort_order"),
      supabase.from("products").select("*, categories(name)").eq("active", true).order("sort_order"),
    ]);
    setSettings(s || null);
    setCategories(c || []);
    setProducts(p || []);
    setActiveCategory(c?.[0]?.id || null);

    // Guarda colores en cache para el próximo loading
    if (s?.primary_color) localStorage.setItem("rtd_primary", s.primary_color);
    if (s?.background_color) localStorage.setItem("rtd_bg", s.background_color);

    setLoaded(true);
  }

  // GSAP entrada sidebar desktop
  useEffect(() => {
    if (!loaded) return;
    if (logoRef.current) {
      gsap.fromTo(logoRef.current,
        { scale: 0.5, opacity: 0, rotation: -10 },
        { scale: 1, opacity: 1, rotation: 0, duration: 0.7, ease: "back.out(1.7)" }
      );
    }
    if (sidebarRef.current) {
      gsap.fromTo(
        sidebarRef.current.querySelectorAll("nav button"),
        { x: -30, opacity: 0 },
        { x: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out", delay: 0.3 }
      );
    }
  }, [loaded]);

  // IntersectionObserver: detecta qué sección está en pantalla
  useEffect(() => {
    if (categories.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Ignorar mientras se está scrolleando por click
        if (isScrollingRef.current) return;

        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveCategory(visible[0].target.dataset.categoryId);
        }
      },
      { threshold: [0.1, 0.3, 0.5], rootMargin: "-80px 0px -50% 0px" }
    );

    categories.forEach((cat) => {
      const el = sectionRefs.current[cat.id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [categories, loaded]);

  // Scroll automático del tab activo al centro
  useEffect(() => {
    if (!tabsRef.current || !activeCategory) return;
    const activeBtn = tabsRef.current.querySelector(`[data-tab="${activeCategory}"]`);
    if (activeBtn) {
      const bar = tabsRef.current;
      const offset = activeBtn.offsetLeft - bar.offsetWidth / 2 + activeBtn.offsetWidth / 2;
      bar.scrollTo({ left: offset, behavior: "smooth" });
    }
  }, [activeCategory]);

  // Scroll suave al hacer click en tab — pausa el observer durante el scroll
  function scrollToCategory(catId) {
    setMenuOpen(false);
    setActiveCategory(catId); // fija el activo inmediatamente

    // Pausa el observer
    isScrollingRef.current = true;
    clearTimeout(scrollTimerRef.current);

    const el = sectionRefs.current[catId];
    if (el) {
      const topbarHeight = window.innerWidth < 1024 ? 110 : 24;
      const top = el.getBoundingClientRect().top + window.scrollY - topbarHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }

    // Reactiva el observer después de que termina el scroll (~800ms)
    scrollTimerRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 900);
  }

  const primary = settings?.primary_color || "#c89b4f";
  const bg = settings?.background_color || "#080808";

  const SidebarContent = () => (
    <>
      <div ref={logoRef} className="text-center">
        {settings?.logo_url
          ? <img src={settings.logo_url} alt={settings.business_name} className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />
          : <Wine className="mx-auto mb-3" size={44} style={{ color: primary }} />
        }
        <h1 className="text-xl font-black uppercase tracking-[0.15em] leading-tight">
          {settings?.business_name || "RTD COCKTAILS"}
        </h1>
        <p className="mt-1.5 text-[10px] tracking-[0.35em] uppercase" style={{ color: primary }}>
          Carta de tragos
        </p>
        <div className="mx-auto mt-4 h-px w-12 opacity-30" style={{ backgroundColor: primary }} />
      </div>

      <nav className="mt-8 space-y-1">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              className="flex w-full items-center gap-3 rounded-lg py-2.5 text-left text-xs font-semibold uppercase tracking-widest transition-all duration-200"
              style={
                isActive
                  ? { paddingLeft: "14px", backgroundColor: `${primary}18`, color: primary, borderLeft: `3px solid ${primary}` }
                  : { paddingLeft: "17px", color: "#71717a" }
              }
            >
              <Wine size={13} className="flex-shrink-0" />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </nav>

      {settings?.happy_hour_title && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="mt-auto rounded-2xl p-5 text-center"
          style={{ border: `1px solid ${primary}44` }}
        >
          <Clock className="mx-auto mb-2" size={18} style={{ color: primary }} />
          <h3 className="text-sm font-bold uppercase tracking-wider" style={{ color: primary }}>{settings.happy_hour_title}</h3>
          <p className="mt-1 text-sm">{settings.happy_hour_time}</p>
          <p className="mt-1 text-xs text-zinc-400">{settings.happy_hour_description}</p>
        </motion.div>
      )}

      {settings?.instagram && (
        <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noreferrer"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition hover:opacity-80"
          style={{ color: primary, border: `1px solid ${primary}33` }}
        >
          <AtSign size={15} />
          @{settings.instagram}
        </a>
      )}
    </>
  );

  if (!loaded) return <BartenderLoader primary={loaderColors.primary} bg={loaderColors.bg} />;

  return (
    <main className="min-h-screen text-white" style={{ backgroundColor: bg }}>
      <div className="flex min-h-screen">

        {/* Sidebar desktop — ancho fijo, sticky */}
        <aside
          ref={sidebarRef}
          className="hidden lg:flex flex-col flex-shrink-0 w-64 xl:w-72 p-8"
          style={{
            borderRight: `1px solid ${primary}22`,
            position: "sticky",
            top: 0,
            height: "100vh",
            overflowY: "auto",
          }}
        >
          <SidebarContent />
        </aside>

        {/* Topbar sticky mobile */}
        <div className="fixed left-0 right-0 top-0 z-30 lg:hidden" style={{ backgroundColor: bg, borderBottom: `1px solid ${primary}18` }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              {settings?.logo_url
                ? <img src={settings.logo_url} alt={settings.business_name} className="h-8 w-8 rounded-full object-cover" />
                : <Wine size={20} style={{ color: primary }} />
              }
              <span className="text-sm font-bold tracking-widest">{settings?.business_name || "RTD COCKTAILS"}</span>
            </div>
            <button onClick={() => setMenuOpen(true)} className="rounded-lg p-1.5" style={{ color: primary }}>
              <Menu size={22} />
            </button>
          </div>

          {/* Tabs de categorías con scroll */}
          <div className="relative">
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-6" style={{ background: `linear-gradient(to right, ${bg}, transparent)` }} />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-6" style={{ background: `linear-gradient(to left, ${bg}, transparent)` }} />
            <div ref={tabsRef} className="flex gap-2 overflow-x-auto px-4 pb-3" style={{ scrollbarWidth: "none" }}>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  data-tab={cat.id}
                  onClick={() => scrollToCategory(cat.id)}
                  className="whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all duration-200"
                  style={
                    activeCategory === cat.id
                      ? { backgroundColor: `${primary}22`, color: primary, border: `1px solid ${primary}` }
                      : { color: "#71717a", border: "1px solid #3f3f46" }
                  }
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Drawer hamburguesa */}
        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 lg:hidden"
                style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
                onClick={() => setMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 220 }}
                className="fixed left-0 top-0 bottom-0 z-50 flex w-72 flex-col p-8 lg:hidden"
                style={{ backgroundColor: bg, borderRight: `1px solid ${primary}22` }}
              >
                <button onClick={() => setMenuOpen(false)} className="mb-6 self-end p-1" style={{ color: primary }}>
                  <X size={22} />
                </button>
                <SidebarContent />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Contenido: todas las secciones */}
        <section className="min-w-0 flex-1 px-4 pb-20 pt-28 sm:px-8 sm:pt-32 lg:px-16 lg:pt-12 xl:px-24">
          {categories.map((cat) => {
            const catProducts = products.filter((p) => p.category_id === cat.id);
            return (
              <div
                key={cat.id}
                ref={(el) => { sectionRefs.current[cat.id] = el; }}
                data-category-id={cat.id}
                className="mb-14"
              >
                {/* Título sección */}
                <div className="mb-6">
                  <div className="h-px w-10" style={{ backgroundColor: primary }} />
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-widest sm:text-4xl lg:text-6xl">{cat.name}</h2>
                  <div className="mt-3 h-px w-10" style={{ backgroundColor: primary }} />
                </div>

                {/* Sin productos */}
                {catProducts.length === 0 && (
                  <div className="flex items-center gap-3 rounded-xl border px-5 py-6 text-zinc-500" style={{ borderColor: `${primary}18` }}>
                    <Wine size={20} style={{ color: `${primary}44` }} />
                    <p className="text-sm">Próximamente productos en esta categoría.</p>
                  </div>
                )}

                {/* Productos */}
                {catProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <ProductCard product={product} primary={primary} />
                  </motion.div>
                ))}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
