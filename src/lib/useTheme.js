import { useEffect, useState } from "react";

export function useTheme(primaryColor = "#c89b4f") {
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("rtd_theme") !== "light"; }
    catch { return true; }
  });

  const bg = dark ? "#080808" : "#f5f0eb";
  const surface = dark ? "#111111" : "#ffffff";
  const border = dark ? `${primaryColor}22` : `${primaryColor}44`;
  const text = dark ? "#ffffff" : "#111111";
  const textMuted = dark ? "#71717a" : "#6b7280";

  useEffect(() => {
    localStorage.setItem("rtd_theme", dark ? "dark" : "light");
    // Actualiza también el cache de colores
    localStorage.setItem("rtd_bg", bg);
  }, [dark, bg]);

  function toggle() { setDark((d) => !d); }

  return { dark, toggle, bg, surface, border, text, textMuted };
}
