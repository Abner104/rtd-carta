import { useEffect, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../lib/supabaseClient";
import { Save, ImagePlus, CheckCircle, QrCode, Download, FileText } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { jsPDF } from "jspdf";

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
  const [qrModal, setQrModal] = useState(null); // dataUrl para mostrar en modal
  const qrRef = useRef(null);
  const menuUrl = window.location.origin + "/";

  function downloadPDF() {
    const qrCanvas = qrRef.current?.querySelector("canvas");
    if (!qrCanvas) return;

    const dataUrl = qrCanvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Fondo negro
    pdf.setFillColor(10, 10, 10);
    pdf.rect(0, 0, pageW, pageH, "F");

    // Título
    pdf.setTextColor(primary);
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    pdf.text(settings.business_name || "RTD COCKTAILS", pageW / 2, 40, { align: "center" });

    // Subtítulo
    pdf.setFontSize(11);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Escaneá para ver la carta digital", pageW / 2, 50, { align: "center" });

    // QR centrado
    const qrSize = 100;
    const qrX = (pageW - qrSize) / 2;
    pdf.addImage(dataUrl, "PNG", qrX, 65, qrSize, qrSize);

    // URL
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.text(menuUrl, pageW / 2, 175, { align: "center" });

    // Marco decorativo
    const r = (hex) => parseInt(hex.slice(1, 3), 16);
    const g = (hex) => parseInt(hex.slice(3, 5), 16);
    const b = (hex) => parseInt(hex.slice(5, 7), 16);
    pdf.setDrawColor(r(primary), g(primary), b(primary));
    pdf.setLineWidth(0.5);
    pdf.roundedRect(15, 25, pageW - 30, 160, 5, 5);

    pdf.save("qr-carta.pdf");
  }

  function downloadQR() {
    // Crea canvas final con marco decorativo
    const qrCanvas = qrRef.current?.querySelector("canvas");
    if (!qrCanvas) return;

    const pad = 32;
    const footerH = 56;
    const size = qrCanvas.width;
    const total = size + pad * 2;

    const out = document.createElement("canvas");
    out.width = total;
    out.height = total + footerH;
    const ctx = out.getContext("2d");

    // Fondo oscuro
    ctx.fillStyle = "#0a0a0a";
    ctx.roundRect(0, 0, out.width, out.height, 20);
    ctx.fill();

    // Borde decorativo
    ctx.strokeStyle = primary + "66";
    ctx.lineWidth = 1.5;
    ctx.roundRect(6, 6, out.width - 12, out.height - 12, 16);
    ctx.stroke();

    // Esquinas estilo cóctel
    const corner = 18;
    ctx.strokeStyle = primary;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    [[8, 8], [out.width - 8, 8], [8, out.height - 8], [out.width - 8, out.height - 8]].forEach(([x, y]) => {
      const dx = x < out.width / 2 ? 1 : -1;
      const dy = y < out.height / 2 ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(x + dx * corner, y); ctx.lineTo(x, y); ctx.lineTo(x, y + dy * corner); ctx.stroke();
    });

    // QR
    ctx.drawImage(qrCanvas, pad, pad);

    // Footer
    ctx.fillStyle = primary + "22";
    ctx.fillRect(0, total, out.width, footerH);
    ctx.fillStyle = primary;
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(settings.business_name || "RTD COCKTAILS", out.width / 2, total + 22);
    ctx.fillStyle = "#ffffff66";
    ctx.font = "10px sans-serif";
    ctx.fillText("Escaneá para ver la carta", out.width / 2, total + 40);

    const dataUrl = out.toDataURL("image/png");
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Muestra modal con la imagen para que el usuario la guarde con presión larga
      setQrModal(dataUrl);
    } else {
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = "qr-cocktail.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  }
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

      {/* QR del menú */}
      <div className="mt-10 max-w-xs">
        <h2 className="mb-1 flex items-center gap-2 font-semibold text-white">
          <QrCode size={18} style={{ color: primary }} />
          QR del menú
        </h2>
        <p className="mb-4 text-xs text-zinc-400">Escanealo para abrir la carta digital</p>

        {/* Card estilo cóctel */}
        <div
          ref={qrRef}
          className="relative overflow-hidden rounded-2xl p-6"
          style={{ backgroundColor: "#0a0a0a", border: `1px solid ${primary}44` }}
        >
          {/* Esquinas decorativas */}
          {[
            "top-3 left-3 border-t-2 border-l-2 rounded-tl-lg",
            "top-3 right-3 border-t-2 border-r-2 rounded-tr-lg",
            "bottom-3 left-3 border-b-2 border-l-2 rounded-bl-lg",
            "bottom-3 right-3 border-b-2 border-r-2 rounded-br-lg",
          ].map((cls, i) => (
            <div key={i} className={`absolute h-5 w-5 ${cls}`} style={{ borderColor: primary }} />
          ))}

          {/* QR con colores del tema */}
          <div className="flex justify-center">
            <QRCodeCanvas
              value={menuUrl}
              size={180}
              bgColor="#0a0a0a"
              fgColor={primary}
              level="H"
              imageSettings={settings.logo_url ? {
                src: settings.logo_url,
                height: 36,
                width: 36,
                excavate: true,
              } : undefined}
            />
          </div>

          {/* Footer */}
          <div className="mt-4 border-t pt-4 text-center" style={{ borderColor: `${primary}22` }}>
            <p className="text-sm font-bold uppercase tracking-widest" style={{ color: primary }}>
              {settings.business_name || "RTD COCKTAILS"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">Escaneá para ver la carta</p>
          </div>

          {/* Decoración de fondo */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-5" style={{ backgroundColor: primary }} />
          <div className="pointer-events-none absolute -left-8 -bottom-8 h-20 w-20 rounded-full opacity-5" style={{ backgroundColor: primary }} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={downloadQR}
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-black transition hover:opacity-80"
            style={{ backgroundColor: primary }}
          >
            <Download size={15} />
            Imagen
          </button>
          <button
            onClick={downloadPDF}
            className="flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-semibold transition hover:opacity-80"
            style={{ borderColor: primary, color: primary }}
          >
            <FileText size={15} />
            PDF
          </button>
        </div>
      </div>

      <AnimatePresence>
        {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      </AnimatePresence>

      {/* Modal QR mobile */}
      <AnimatePresence>
        {qrModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/80"
              onClick={() => setQrModal(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed inset-x-4 top-1/2 z-50 -translate-y-1/2 rounded-2xl bg-zinc-900 p-5 shadow-2xl"
            >
              <p className="mb-3 text-center text-sm font-semibold text-white">
                Mantenga presionada la imagen para guardarla
              </p>
              <img src={qrModal} alt="QR" className="w-full rounded-xl" />
              <button
                onClick={() => setQrModal(null)}
                className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-black transition hover:opacity-80"
                style={{ backgroundColor: primary }}
              >
                Cerrar
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}