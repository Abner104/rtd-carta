export default function SkeletonMenu({ bg = "#080808" }) {
  const pulse = {
    animation: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
    backgroundColor: "#ffffff10",
    borderRadius: 8,
  };

  return (
    <main className="min-h-screen" style={{ backgroundColor: bg }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      <div className="flex min-h-screen">
        {/* Sidebar desktop skeleton */}
        <aside className="hidden w-64 flex-col gap-4 p-8 lg:flex" style={{ borderRight: "1px solid #ffffff10" }}>
          <div style={{ ...pulse, width: 80, height: 80, borderRadius: "50%", margin: "0 auto" }} />
          <div style={{ ...pulse, width: 120, height: 14, margin: "8px auto" }} />
          <div style={{ ...pulse, width: 80, height: 10, margin: "0 auto 24px" }} />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{ ...pulse, height: 38, width: "100%" }} />
          ))}
        </aside>

        {/* Contenido skeleton */}
        <section className="flex-1 px-4 pb-20 pt-40 sm:px-8 lg:px-16 lg:pt-12">
          {/* Título sección */}
          <div style={{ ...pulse, width: 40, height: 2, marginBottom: 12 }} />
          <div style={{ ...pulse, width: 220, height: 48, marginBottom: 12 }} />
          <div style={{ ...pulse, width: 40, height: 2, marginBottom: 32 }} />

          {/* Productos */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-4 border-b py-5" style={{ borderColor: "#ffffff08" }}>
              <div style={{ ...pulse, width: 64, height: 64, flexShrink: 0, borderRadius: 12 }} />
              <div className="flex flex-1 flex-col gap-2">
                <div style={{ ...pulse, width: `${40 + i * 10}%`, height: 18 }} />
                <div style={{ ...pulse, width: "70%", height: 12 }} />
                <div style={{ ...pulse, width: "50%", height: 12 }} />
              </div>
              <div className="flex flex-col items-end gap-1">
                <div style={{ ...pulse, width: 80, height: 18 }} />
                <div style={{ ...pulse, width: 60, height: 12 }} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
