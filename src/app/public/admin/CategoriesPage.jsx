import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabaseClient";
import { Plus, Trash2, CheckCircle, ImagePlus, Pencil, Check, X, GripVertical } from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

function SortableCategoryItem({ category, primary, editing, setEditing, saveEdit, uploadBanner, toggleCategory, deleteCategory, productCount }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <button {...attributes} {...listeners} className="cursor-grab text-zinc-600 hover:text-zinc-400 active:cursor-grabbing flex-shrink-0">
          <GripVertical size={18} />
        </button>

        {category.banner_url && (
          <img src={category.banner_url} alt={category.name} className="h-10 w-16 rounded-lg object-cover flex-shrink-0" />
        )}

        <div>
          {editing?.id === category.id ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") saveEdit(category.id); if (e.key === "Escape") setEditing(null); }}
                className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-sm text-white outline-none"
              />
              <button onClick={() => saveEdit(category.id)} className="text-green-400 hover:text-green-300 transition"><Check size={16} /></button>
              <button onClick={() => setEditing(null)} className="text-zinc-500 hover:text-zinc-300 transition"><X size={16} /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white">{category.name}</h3>
              <button onClick={() => setEditing({ id: category.id, name: category.name })} className="text-zinc-600 hover:text-zinc-300 transition">
                <Pencil size={13} />
              </button>
            </div>
          )}
          <div className="mt-0.5 flex items-center gap-3">
            <p className={`text-xs ${category.active ? "text-green-400" : "text-red-400"}`}>
              {category.active ? "Activa" : "Desactivada"}
            </p>
            <p className="text-xs text-zinc-600">{productCount} producto{productCount !== 1 ? "s" : ""}</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <label className="cursor-pointer rounded-lg p-2 transition hover:opacity-70" style={{ color: primary }} title="Subir banner">
          <ImagePlus size={15} />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadBanner(category.id, e.target.files[0])} />
        </label>
        <button
          onClick={() => toggleCategory(category.id, category.active)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition"
          style={category.active
            ? { backgroundColor: "rgba(239,68,68,0.15)", color: "#f87171" }
            : { backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }
          }
        >
          {category.active ? "Desactivar" : "Activar"}
        </button>
        <button onClick={() => deleteCategory(category.id, category.name)} className="rounded-lg bg-red-500/20 p-2 text-red-400 hover:bg-red-500/30 transition">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const { primary } = useOutletContext() || { primary: "#c89b4f" };
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [toast, setToast] = useState(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    const [{ data: cats }, { data: prods }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("id, category_id"),
    ]);
    setCategories(cats || []);
    // Cuenta productos por categoría
    const counts = {};
    (prods || []).forEach((p) => {
      counts[p.category_id] = (counts[p.category_id] || 0) + 1;
    });
    setProductCounts(counts);
  }

  async function handleDragEnd(event) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);
    await Promise.all(reordered.map((c, i) =>
      supabase.from("categories").update({ sort_order: i }).eq("id", c.id)
    ));
    setToast("Orden guardado");
  }

  async function saveEdit(id) {
    if (!editing?.name?.trim()) return;
    await supabase.from("categories").update({ name: editing.name }).eq("id", id);
    setEditing(null);
    await loadAll();
    setToast("Nombre actualizado");
  }

  async function createCategory(e) {
    e.preventDefault();
    if (!name.trim()) return;
    await supabase.from("categories").insert({ name, active: true, sort_order: categories.length + 1 });
    setName("");
    await loadAll();
    setToast("Categoría creada");
  }

  async function uploadBanner(id, file) {
    const ext = file.name.split(".").pop();
    const fileName = `banner-${id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("products").upload(fileName, file, { upsert: true });
    if (error) { setToast("Error subiendo banner"); return; }
    const { data } = supabase.storage.from("products").getPublicUrl(fileName);
    await supabase.from("categories").update({ banner_url: data.publicUrl }).eq("id", id);
    await loadAll();
    setToast("Banner actualizado");
  }

  async function deleteCategory(id, catName) {
    if (!confirm(`¿Eliminar "${catName}"? Los productos quedarán sin categoría.`)) return;
    await supabase.from("categories").delete().eq("id", id);
    await loadAll();
    setToast("Categoría eliminada");
  }

  async function toggleCategory(id, active) {
    await supabase.from("categories").update({ active: !active }).eq("id", id);
    await loadAll();
    setToast(active ? "Categoría desactivada" : "Categoría activada");
  }

  const filtered = search.trim()
    ? categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: primary }}>Categorías</h1>
          <p className="mt-1 text-zinc-400">{categories.length} categorías · arrastrá para reordenar</p>
        </div>
      </motion.div>

      <form onSubmit={createCategory} className="mt-6 flex gap-3">
        <input
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-white outline-none focus:border-zinc-600"
          placeholder="Ej: Mojitos"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button className="flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-black transition hover:opacity-80" style={{ backgroundColor: primary }}>
          <Plus size={18} /> Crear
        </button>
      </form>

      {/* Búsqueda */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar categoría..."
        className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-white outline-none focus:border-zinc-600"
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filtered.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-6 grid gap-3">
            {filtered.map((category) => (
              <SortableCategoryItem
                key={category.id}
                category={category}
                primary={primary}
                editing={editing}
                setEditing={setEditing}
                saveEdit={saveEdit}
                uploadBanner={uploadBanner}
                toggleCategory={toggleCategory}
                deleteCategory={deleteCategory}
                productCount={productCounts[category.id] || 0}
              />
            ))}
            {filtered.length === 0 && (
              <p className="py-8 text-center text-sm text-zinc-600">No se encontraron categorías.</p>
            )}
          </div>
        </SortableContext>
      </DndContext>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  );
}
