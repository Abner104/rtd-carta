import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { supabase } from "../../../lib/supabaseClient";
import { Plus, Trash2, ImagePlus, CheckCircle, ChevronDown, FlaskConical, GripVertical, Pencil, X, Copy, Search } from "lucide-react";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableProductItem({ product, primary, openVariants, setOpenVariants, openPrices, setOpenPrices, toggleProduct, deleteProduct, setToast, loadData, onEdit, onDuplicate }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style}>
      <div className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-4">
          {/* Handle drag */}
          <button {...attributes} {...listeners} className="flex-shrink-0 cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing mt-1">
            <GripVertical size={18} />
          </button>
          {product.image_url
            ? <img src={product.image_url} alt={product.name} className="h-20 w-20 rounded-xl object-cover" />
            : <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-zinc-800 text-xs text-zinc-500">Sin img</div>
          }
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", color: "#d4d4d8" }}
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            onClick={() => onDuplicate(product)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition"
            style={{ backgroundColor: "rgba(255,255,255,0.04)", color: "#a1a1aa" }}
            title="Duplicar producto"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={() => setOpenVariants(openVariants === product.id ? null : product.id)}
            className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition"
            style={{ backgroundColor: `${primary}18`, color: primary }}
          >
            <FlaskConical size={14} />
            Sabores
            <ChevronDown size={13} style={{ transform: openVariants === product.id ? "rotate(180deg)" : "rotate(0)" }} />
          </button>
          <select
            value={product.badge || ""}
            onChange={async (e) => {
              await supabase.from("products").update({ badge: e.target.value || null }).eq("id", product.id);
              await loadData();
              setToast("Badge actualizado");
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-2 text-xs text-white outline-none"
          >
            <option value="">Sin badge</option>
            <option value="nuevo">✨ Nuevo</option>
            <option value="popular">🔥 Popular</option>
          </select>
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
        {openPrices === product.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <PricesPanel product={product} primary={primary} onToast={setToast} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openVariants === product.id && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <VariantsPanel product={product} primary={primary} onToast={setToast} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

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

function PricesPanel({ product, primary, onToast }) {
  const [prices, setPrices] = useState([]);
  const [form, setForm] = useState({ label: "", price: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadPrices(); }, [product.id]);

  async function loadPrices() {
    const { data } = await supabase.from("product_prices").select("*").eq("product_id", product.id).order("sort_order");
    setPrices(data || []);
  }

  async function addPrice(e) {
    e.preventDefault();
    if (!form.label.trim() || !form.price) return;
    setSaving(true);
    const { error } = await supabase.from("product_prices").insert({
      product_id: product.id,
      label: form.label,
      price: Number(form.price),
      sort_order: prices.length,
    });
    setSaving(false);
    if (error) { onToast("Error: " + error.message); return; }
    setForm({ label: "", price: "" });
    await loadPrices();
    onToast("Precio agregado");
  }

  async function deletePrice(id) {
    if (!confirm("¿Eliminar este precio?")) return;
    await supabase.from("product_prices").delete().eq("id", id);
    await loadPrices();
    onToast("Precio eliminado");
  }

  return (
    <div className="mb-2 ml-4 rounded-xl border border-zinc-700 bg-zinc-950 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        <span style={{ color: primary }}>$</span> Precios personalizados
        <span className="normal-case text-zinc-600 font-normal">· ej: Copa, Botella, 300ml...</span>
      </p>

      <form onSubmit={addPrice} className="mb-3 flex gap-2">
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          placeholder="Etiqueta (ej: Copa)"
          className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
        />
        <input
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="Precio"
          type="number" min="0"
          className="w-28 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
        />
        <button
          type="submit" disabled={saving}
          className="flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-bold text-black transition hover:opacity-80 disabled:opacity-50"
          style={{ backgroundColor: primary }}
        >
          <Plus size={13} />
          {saving ? "..." : "Agregar"}
        </button>
      </form>

      {prices.length === 0 ? (
        <p className="text-xs italic text-zinc-600">Sin precios personalizados. Se usarán los de 500ml / 1L.</p>
      ) : (
        <div className="space-y-1">
          {prices.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ backgroundColor: `${primary}10` }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium" style={{ color: primary }}>{p.label}</span>
                <span className="text-sm text-zinc-300">${Number(p.price).toLocaleString("es-CL")}</span>
              </div>
              <button onClick={() => deletePrice(p.id)} className="text-red-400 hover:text-red-300 transition">
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
  const [openPrices, setOpenPrices] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [editPrices, setEditPrices] = useState([]);
  const [search, setSearch] = useState("");

  async function openEditModal(product) {
    const { data } = await supabase.from("product_prices").select("*").eq("product_id", product.id).order("sort_order");
    setEditPrices(data?.length > 0 ? data : [{ label: "", price: "" }]);
    setEditProduct(product);
  }

  const listRef = useRef(null);
  const formRef = useRef(null);

  async function saveEditProduct(e) {
    e.preventDefault();
    const { id, name, description, price_500, price_1000, category_id, image_url } = editProduct;

    let finalImageUrl = image_url;

    // Si hay archivo nuevo, subirlo
    const fileInput = e.target.querySelector('input[type="file"]');
    if (fileInput?.files?.[0]) {
      finalImageUrl = await uploadImage(fileInput.files[0]);
    }

    const { error } = await supabase.from("products").update({
      name, description,
      price_500: Number(price_500 || 0),
      price_1000: Number(price_1000 || 0),
      category_id,
      image_url: finalImageUrl,
    }).eq("id", id);
    if (error) { setToast("Error al guardar"); return; }

    // Actualizar precios: borrar los viejos y reinsertar
    await supabase.from("product_prices").delete().eq("product_id", id);
    const validPrices = editPrices.filter((p) => p.label?.trim() && p.price);
    if (validPrices.length > 0) {
      await supabase.from("product_prices").insert(
        validPrices.map((p, i) => ({
          product_id: id,
          label: p.label,
          price: Number(p.price),
          sort_order: i,
        }))
      );
    }

    setEditProduct(null);
    setEditPrices([]);
    await loadData();
    setToast("Producto actualizado");
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = products.findIndex((p) => p.id === active.id);
    const newIndex = products.findIndex((p) => p.id === over.id);
    const reordered = arrayMove(products, oldIndex, newIndex);
    setProducts(reordered);
    // Actualiza sort_order en Supabase
    await Promise.all(reordered.map((p, i) =>
      supabase.from("products").update({ sort_order: i }).eq("id", p.id)
    ));
    setToast("Orden guardado");
  }

  const [form, setForm] = useState({
    category_id: "", name: "", description: "",
  });
  const [formPrices, setFormPrices] = useState([{ label: "", price: "" }]);

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

    const { data: newProduct, error } = await supabase.from("products").insert({
      category_id: form.category_id,
      name: form.name,
      description: form.description,
      image_url: imageUrl,
      active: true,
      sort_order: products.length + 1,
    }).select().single();

    if (error) { setToast("Error creando producto"); return; }

    // Guardar precios personalizados si tienen label y precio
    const validPrices = formPrices.filter((p) => p.label.trim() && p.price);
    if (validPrices.length > 0) {
      await supabase.from("product_prices").insert(
        validPrices.map((p, i) => ({
          product_id: newProduct.id,
          label: p.label,
          price: Number(p.price),
          sort_order: i,
        }))
      );
    }

    setForm({ category_id: "", name: "", description: "" });
    setFormPrices([{ label: "", price: "" }]);
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

  async function duplicateProduct(product) {
    const { id, categories, created_at, ...rest } = product;
    await supabase.from("products").insert({
      ...rest,
      name: `${product.name} (copia)`,
      sort_order: products.length + 1,
    });
    await loadData();
    setToast(`"${product.name}" duplicado`);
  }

  async function toggleProduct(id, active) {
    await supabase.from("products").update({ active: !active }).eq("id", id);
    await loadData();
    setToast(active ? "Producto desactivado" : "Producto activado");
  }

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primary }}>Productos</h1>
          <p className="mt-1 text-zinc-400">{products.length} productos en total</p>
        </div>
      </motion.div>

      <form ref={formRef} onSubmit={createProduct} className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Categoría *</label>
            <select
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Seleccioná una categoría</option>
              {categories.map((cat) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nombre *</label>
            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none"
              placeholder="Ej: Mojito Tradicional"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Descripción / ingredientes</label>
          <textarea
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-white outline-none"
            placeholder="Ej: Ron, menta, limón, azúcar y soda"
            rows="2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Precios personalizados */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-400">Precios</label>
          <div className="grid gap-2">
            {formPrices.map((fp, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={fp.label}
                  onChange={(e) => { const n = [...formPrices]; n[i].label = e.target.value; setFormPrices(n); }}
                  placeholder="Etiqueta (ej: 500ml, Copa, 1 Litro)"
                  className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none"
                />
                <input
                  value={fp.price}
                  onChange={(e) => { const n = [...formPrices]; n[i].price = e.target.value; setFormPrices(n); }}
                  placeholder="Precio"
                  type="number" min="0"
                  className="w-32 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none"
                />
                {formPrices.length > 1 && (
                  <button type="button" onClick={() => setFormPrices(formPrices.filter((_, j) => j !== i))}
                    className="rounded-xl bg-red-500/20 px-3 text-red-400 hover:bg-red-500/30 transition">
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setFormPrices([...formPrices, { label: "", price: "" }])}
              className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-2 text-xs text-zinc-500 transition hover:text-zinc-300"
            >
              <Plus size={13} /> Agregar precio
            </button>
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-4 text-zinc-300 transition hover:opacity-80" style={{ borderColor: `${primary}44` }}>
          <ImagePlus size={20} style={{ color: primary }} />
          <span className="text-sm">Subir imagen del trago</span>
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

      {/* Búsqueda */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5">
        <Search size={14} className="flex-shrink-0 text-zinc-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 bg-transparent text-sm text-white outline-none placeholder-zinc-600"
        />
        {search && <button onClick={() => setSearch("")} className="text-zinc-600 hover:text-zinc-300 transition"><X size={13} /></button>}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <div ref={listRef} className="mt-4 grid gap-4">
            {products.filter((p) => !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())).map((product) => (
              <SortableProductItem
                key={product.id}
                product={product}
                primary={primary}
                openVariants={openVariants}
                setOpenVariants={setOpenVariants}
                openPrices={openPrices}
                setOpenPrices={setOpenPrices}
                toggleProduct={toggleProduct}
                deleteProduct={deleteProduct}
                setToast={setToast}
                loadData={loadData}
                onEdit={openEditModal}
                onDuplicate={duplicateProduct}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Modal edición producto */}
      <AnimatePresence>
        {editProduct && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70" onClick={() => setEditProduct(null)} />
            <motion.div
              initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
              className="fixed bottom-0 left-0 right-0 z-50 max-h-[90vh] overflow-y-auto rounded-t-2xl border-t border-zinc-700 bg-zinc-900 p-6 shadow-2xl sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-screen sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border"
            >
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-bold text-white">Editar producto</h3>
                <button onClick={() => setEditProduct(null)} className="text-zinc-500 hover:text-white transition"><X size={18} /></button>
              </div>

              <form onSubmit={saveEditProduct} className="grid gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Categoría</label>
                  <select
                    value={editProduct.category_id || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, category_id: e.target.value })}
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                  >
                    <option value="">Sin categoría</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Nombre *</label>
                  <input
                    value={editProduct.name || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    required
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Descripción / ingredientes</label>
                  <textarea
                    value={editProduct.description || ""}
                    onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                    rows="2"
                    className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Precio 500ml</label>
                    <input
                      value={editProduct.price_500 ?? ""}
                      onChange={(e) => setEditProduct({ ...editProduct, price_500: e.target.value })}
                      type="number" min="0"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-zinc-400">Precio 1 litro</label>
                    <input
                      value={editProduct.price_1000 ?? ""}
                      onChange={(e) => setEditProduct({ ...editProduct, price_1000: e.target.value })}
                      type="number" min="0"
                      className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Precios */}
                <div>
                  <label className="mb-2 block text-xs font-medium text-zinc-400">Precios</label>
                  <div className="grid gap-2">
                    {editPrices.map((ep, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          value={ep.label || ""}
                          onChange={(e) => { const n = [...editPrices]; n[i] = { ...n[i], label: e.target.value }; setEditPrices(n); }}
                          placeholder="Etiqueta (ej: Copa, 500ml)"
                          className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none"
                        />
                        <input
                          value={ep.price || ""}
                          onChange={(e) => { const n = [...editPrices]; n[i] = { ...n[i], price: e.target.value }; setEditPrices(n); }}
                          placeholder="Precio"
                          type="number" min="0"
                          className="w-28 rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2.5 text-sm text-white outline-none"
                        />
                        {editPrices.length > 1 && (
                          <button type="button" onClick={() => setEditPrices(editPrices.filter((_, j) => j !== i))}
                            className="rounded-xl bg-red-500/20 px-3 text-red-400 hover:bg-red-500/30 transition">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button"
                      onClick={() => setEditPrices([...editPrices, { label: "", price: "" }])}
                      className="flex items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-2 text-xs text-zinc-500 transition hover:text-zinc-300">
                      <Plus size={13} /> Agregar precio
                    </button>
                  </div>
                </div>

                {/* Imagen */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-zinc-400">Imagen</label>
                  <div className="flex items-center gap-3">
                    {editProduct.image_url ? (
                      <img src={editProduct.image_url} alt="img" className="h-14 w-14 flex-shrink-0 rounded-xl object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-600">
                        <ImagePlus size={20} />
                      </div>
                    )}
                    <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-zinc-700 px-4 py-3 text-sm text-zinc-400 transition hover:border-zinc-500 hover:text-zinc-200"
                      style={{ borderColor: `${primary}44` }}>
                      <ImagePlus size={16} style={{ color: primary }} />
                      {editProduct.image_url ? "Cambiar imagen" : "Subir imagen"}
                      <input type="file" accept="image/*" className="hidden" />
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button type="submit"
                    className="flex-1 rounded-xl py-2.5 font-bold text-black transition hover:opacity-80"
                    style={{ backgroundColor: primary }}>
                    Guardar cambios
                  </button>
                  <button type="button" onClick={() => setEditProduct(null)}
                    className="flex-1 rounded-xl border border-zinc-700 py-2.5 text-sm text-zinc-400 transition hover:text-white">
                    Cancelar
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
