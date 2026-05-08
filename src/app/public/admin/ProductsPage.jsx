import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { supabase } from "../../../lib/supabaseClient";
import { Plus, Trash2, ImagePlus, CheckCircle, ChevronDown, FlaskConical } from "lucide-react";

function VariantsPanel({ product, primary, onToast }) {
  const [variants, setVariants] = useState([]);
  const [form, setForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadVariants(); }, [product.id]);

  async function loadVariants() {
    const { data } = await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", product.id)
      .order("sort_order");
    setVariants(data || []);
  }

  async function addVariant(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("product_variants").insert({
      product_id: product.id,
      name: form.name,
      price_500: product.price_500 || 0,
      price_1000: product.price_1000 || 0,
      sort_order: variants.length,
    });
    setSaving(false);
    if (error) { onToast("Error: " + error.message); return; }
    setForm({ name: "" });
    await loadVariants();
    onToast("Sabor agregado");
  }

  async function deleteVariant(id) {
    if (!confirm("¿Eliminar este sabor?")) return;
    await supabase.from("product_variants").delete().eq("id", id);
    await loadVariants();
    onToast("Sabor eliminado");
  }

  return (
    <div className="mb-4 ml-4 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <FlaskConical size={13} style={{ color: primary }} /> Sabores · precio base heredado del producto
      </p>

      <form onSubmit={addVariant} className="mb-3 flex gap-2">
        <input
          value={form.name}
          onChange={(e) => setForm({ name: e.target.value })}
          placeholder="Ej: Frutilla, Maracuyá, Menta..."
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm outline-none focus:border-zinc-500"
        />
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-bold text-black transition hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          <Plus size={13} />
          {saving ? "..." : "Agregar"}
        </button>
      </form>

      {variants.length === 0 ? (
        <p className="text-xs text-zinc-600 italic">Sin sabores aún</p>
      ) : (
        <div className="space-y-1">
          {variants.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: `${primary}10` }}>
              <span className="text-sm font-medium capitalize" style={{ color: primary }}>{v.name}</span>
              <button onClick={() => deleteVariant(v.id)} className="text-red-400 hover:text-red-300 transition">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

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

export default function ProductsPage() {
  const { primary } = useOutletContext() || { primary: "#c89b4f" };
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState(null);
  const [openVariants, setOpenVariants] = useState(null);
  const listRef = useRef(null);
  const formRef = useRef(null);

  const [form, setForm] = useState({
    category_id: "", name: "", description: "", price_500: "", price_1000: "",
  });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("*, categories(name)").order("sort_order"),
    ]);
    setCategories(cats || []);
    setProducts(prods || []);
  }

  useEffect(() => {
    if (!listRef.current || products.length === 0) return;
    gsap.fromTo(
      listRef.current.children,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, stagger: 0.07, duration: 0.4, ease: "power2.out" }
    );
  }, [products.length]);

  async function uploadImage(file) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("products").upload(fileName, file);
      if (error) throw error;
      const { data } = supabase.storage.from("products").getPublicUrl(fileName);
      return data.publicUrl;
    } catch (err) {
      console.error(err);
      setToast("Error subiendo imagen");
      return "";
    } finally {
      setUploading(false);
    }
  }

  async function createProduct(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category_id) {
      setToast("Completá nombre y categoría");
      return;
    }

    const fileInput = formRef.current.querySelector('input[type="file"]');
    let imageUrl = "";
    if (fileInput?.files?.[0]) imageUrl = await uploadImage(fileInput.files[0]);

    const { error } = await supabase.from("products").insert({
      category_id: form.category_id,
      name: form.name,
      description: form.description,
      price_500: Number(form.price_500 || 0),
      price_1000: Number(form.price_1000 || 0),
      image_url: imageUrl,
      active: true,
      sort_order: products.length + 1,
    });

    if (error) { setToast("Error creando producto"); return; }

    setForm({ category_id: "", name: "", description: "", price_500: "", price_1000: "" });
    if (fileInput) fileInput.value = "";
    await loadData();
    setToast("Producto creado");
  }

  async function deleteProduct(id, productName) {
    if (!confirm(`¿Eliminar "${productName}"?`)) return;
    await supabase.from("products").delete().eq("id", id);
    await loadData();
    setToast("Producto eliminado");
  }

  async function toggleProduct(id, active) {
    await supabase.from("products").update({ active: !active }).eq("id", id);
    await loadData();
    setToast(active ? "Producto desactivado" : "Producto activado");
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold" style={{ color: primary }}>Productos</h1>
        <p className="mt-1 text-zinc-400">Administra los tragos de la carta</p>
      </motion.div>

      <form ref={formRef} onSubmit={createProduct} className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
            value={form.category_id}
            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
          >
            <option value="">Selecciona categoría *</option>
            {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>

          <input
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
            placeholder="Nombre del trago *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>

        <textarea
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
          placeholder="Descripción / ingredientes"
          rows="2"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <input className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none" placeholder="Precio 500ml" type="number" value={form.price_500} onChange={(e) => setForm({ ...form, price_500: e.target.value })} />
          <input className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none" placeholder="Precio 1 litro" type="number" value={form.price_1000} onChange={(e) => setForm({ ...form, price_1000: e.target.value })} />
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-zinc-300 transition hover:opacity-80" style={{ borderColor: `${primary}66` }}>
          <ImagePlus size={22} style={{ color: primary }} />
          <span>Subir imagen del trago</span>
          <input type="file" accept="image/*" className="hidden" />
        </label>

        <button
          disabled={uploading}
          className="flex w-fit items-center gap-2 rounded-xl px-5 py-3 font-bold text-black transition hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          <Plus size={18} />
          {uploading ? "Subiendo..." : "Crear producto"}
        </button>
      </form>

      <div ref={listRef} className="mt-8 grid gap-4">
        {products.map((product) => (
          <div key={product.id}>
          <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-20 w-20 rounded-xl object-cover" />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-800 text-xs text-zinc-500">Sin img</div>
              )}
              <div>
                <p className="text-sm" style={{ color: primary }}>{product.categories?.name || "Sin categoría"}</p>
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="mt-1 text-sm text-zinc-400">{product.description}</p>
                <div className="mt-2 flex gap-4 text-sm text-zinc-300">
                  {product.price_500 > 0 && <span>500ml: ${Number(product.price_500).toLocaleString("es-CL")}</span>}
                  {product.price_1000 > 0 && <span>1L: ${Number(product.price_1000).toLocaleString("es-CL")}</span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setOpenVariants(openVariants === product.id ? null : product.id)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition"
                style={{ backgroundColor: `${primary}18`, color: primary }}
              >
                <FlaskConical size={14} />
                Sabores
                <ChevronDown size={13} className="transition-transform" style={{ transform: openVariants === product.id ? "rotate(180deg)" : "rotate(0)" }} />
              </button>
              <button
                onClick={() => toggleProduct(product.id, product.active)}
                className="rounded-lg px-3 py-2 text-sm font-medium transition"
                style={product.active
                  ? { backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }
                  : { backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }
                }
              >
                {product.active ? "Desactivar" : "Activar"}
              </button>
              <button
                onClick={() => deleteProduct(product.id, product.name)}
                className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {openVariants === product.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <VariantsPanel product={product} primary={primary} onToast={setToast} />
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
