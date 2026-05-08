import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabaseClient";
import { Save, ImagePlus, CheckCircle } from "lucide-react";

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

export default function SettingsPage() {
  const { primary } = useOutletContext() || { primary: "#c89b4f" };
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState({
    business_name: "",
    description: "",
    instagram: "",
    whatsapp: "",
    happy_hour_title: "",
    happy_hour_time: "",
    happy_hour_description: "",
    logo_url: "",
    primary_color: "#c89b4f",
    background_color: "#080808",
  });

  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (data) {
      setSettings(data);
    }
  }

  async function uploadLogo(file) {
    try {
      setUploading(true);

      const fileExt = file.name.split(".").pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from("products")
        .upload(fileName, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("products")
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error(error);
      return "";
    } finally {
      setUploading(false);
    }
  }

  async function saveSettings(e) {
    e.preventDefault();

    const fileInput = e.target.querySelector('input[type="file"]');

    let logoUrl = settings.logo_url;

    if (fileInput?.files?.[0]) {
      logoUrl = await uploadLogo(fileInput.files[0]);
    }

    const { id, ...rest } = settings;
    const payload = { ...rest, logo_url: logoUrl };

    let error;
    if (id) {
      ({ error } = await supabase.from("settings").update(payload).eq("id", id));
    } else {
      ({ error } = await supabase.from("settings").insert(payload));
    }

    if (error) {
      console.error("Error guardando settings:", error);
      alert("Error: " + error.message);
      return;
    }

    setToast("Configuración guardada");
    loadSettings();
  }

  return (
    <main>
      <h1 className="text-3xl font-bold" style={{ color: primary }}>
        Configuración
      </h1>

      <p className="mt-1 text-zinc-400">
        Personaliza la carta digital
      </p>

      <form
        onSubmit={saveSettings}
        className="mt-8 grid gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6"
      >
        <input
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
          placeholder="Nombre del negocio"
          value={settings.business_name || ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              business_name: e.target.value,
            })
          }
        />

        <textarea
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
          placeholder="Descripción"
          rows="3"
          value={settings.description || ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              description: e.target.value,
            })
          }
        />

        <input
          className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
          placeholder="Instagram"
          value={settings.instagram || ""}
          onChange={(e) =>
            setSettings({
              ...settings,
              instagram: e.target.value,
            })
          }
        />

        <div className="grid gap-4 md:grid-cols-3">
          <input
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
            placeholder="Happy Hour título"
            value={settings.happy_hour_title || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                happy_hour_title: e.target.value,
              })
            }
          />

          <input
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
            placeholder="Horario"
            value={settings.happy_hour_time || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                happy_hour_time: e.target.value,
              })
            }
          />

          <input
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 outline-none"
            placeholder="Descripción HH"
            value={settings.happy_hour_description || ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                happy_hour_description:
                  e.target.value,
              })
            }
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Color principal
            </label>

            <input
              type="color"
              value={settings.primary_color || "#c89b4f"}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  primary_color: e.target.value,
                })
              }
              className="h-14 w-full rounded-xl border border-zinc-800 bg-zinc-950"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-zinc-400">
              Fondo
            </label>

            <input
              type="color"
              value={
                settings.background_color || "#080808"
              }
              onChange={(e) =>
                setSettings({
                  ...settings,
                  background_color: e.target.value,
                })
              }
              className="h-14 w-full rounded-xl border border-zinc-800 bg-zinc-950"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-[#c89b4f]/40 bg-zinc-950 px-4 py-4 text-zinc-300">
          <ImagePlus className="text-[#c89b4f]" size={22} />
          <span>Subir logo</span>
          <input type="file" accept="image/*" className="hidden" />
        </label>

        {settings.logo_url && (
          <img
            src={settings.logo_url}
            alt="Logo"
            className="h-28 w-28 rounded-full object-cover"
          />
        )}

        <button
          disabled={uploading}
          className="flex w-fit items-center gap-2 rounded-xl px-5 py-3 font-bold text-black disabled:opacity-50 transition hover:opacity-80"
          style={{ backgroundColor: primary }}
        >
          <Save size={18} />
          {uploading
            ? "Subiendo..."
            : "Guardar configuración"}
        </button>
      </form>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </main>
  );
}