"use client";

import { useLang } from "@/lib/LanguageContext";

interface HeaderProps {
  isMobile: boolean;
  fontScale: number;
  onScaleUp: () => void;
  onScaleDown: () => void;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  // My Location
  onMyLocation: () => void;
  locatingMe: boolean;
  locationActive: boolean;
  onClearLocation: () => void;
  // Near Me
  onNearMe: () => void;
  locatingNear: boolean;
  nearCount: number;
  onClearNear: () => void;
}

export default function Header({
  isMobile,
  fontScale,
  onScaleUp,
  onScaleDown,
  sidebarOpen,
  onToggleSidebar,
  onMyLocation,
  locatingMe,
  locationActive,
  onClearLocation,
  onNearMe,
  locatingNear,
  nearCount,
  onClearNear,
}: HeaderProps) {
  const { lang, setLang, tr } = useLang();

  // Derived sizes — applied to desktop buttons AND mobile header
  const btnFont  = Math.round(13 * fontScale);  // main button label
  const chipFont = Math.round(12 * fontScale);  // active-state chip label
  const btnPadV  = Math.round(6  * fontScale);  // vertical padding
  const btnPadH  = Math.round(11 * fontScale);  // horizontal padding
  const headerH  = isMobile
    ? Math.round(50 * fontScale)
    : Math.round(56 * fontScale);

  const toggleLang = () => setLang(lang === "zh" ? "en" : "zh");

  return (
    <header
      style={{
        flexShrink: 0,
        height: headerH,
        background: "#111827",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 14px" : "0 12px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.35)",
        zIndex: 1001,
        position: "relative",
        gap: 8,
        transition: "height 0.15s ease",
      }}
    >
      {/* Logo + ▲▼ scale controls + 中/EN toggle */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: isMobile ? 22 : 24 }}>🚻</span>
        <div>
          <h1 style={{ margin: 0, fontSize: isMobile ? 15 : 16, fontWeight: 800, lineHeight: 1.2, whiteSpace: "nowrap" }}>
            {tr.appName}
          </h1>
          <p style={{ margin: 0, fontSize: 10, color: "#9ca3af", lineHeight: 1.2 }}>{tr.appSub}</p>
        </div>

        {/* ▲▼ scaler — visible on both mobile and desktop */}
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginLeft: 4 }}>
          <ScaleBtn onClick={onScaleUp}  disabled={fontScale >= 1.6} label="▲" title="放大按鈕文字" />
          <ScaleBtn onClick={onScaleDown} disabled={fontScale <= 0.8} label="▼" title="縮小按鈕文字" />
        </div>

        {/* 中/EN language toggle — always visible */}
        <button
          onClick={toggleLang}
          title={lang === "zh" ? "Switch to English" : "切換為中文"}
          style={{
            background: "#374151",
            color: "#e5e7eb",
            border: "1px solid #4b5563",
            borderRadius: 6,
            padding: "3px 8px",
            fontSize: Math.round(11 * fontScale),
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: 0.5,
            lineHeight: 1.4,
            transition: "background 0.15s",
            whiteSpace: "nowrap",
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
        >
          {tr.langToggle}
        </button>
      </div>

      {/* Desktop action buttons — scaled with fontScale */}
      {!isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>

          {/* ① 我的位置 / My Location */}
          {locationActive ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#1d4ed8", color: "#fff",
              fontSize: chipFont, fontWeight: 700,
              padding: `${btnPadV - 1}px ${btnPadH}px`, borderRadius: 8,
              whiteSpace: "nowrap",
            }}>
              <span style={{
                display: "inline-block", width: 8, height: 8,
                borderRadius: "50%", background: "#60a5fa",
                boxShadow: "0 0 0 2px rgba(96,165,250,0.4)",
              }} />
              {tr.located}
              <button onClick={onClearLocation} title="清除定位"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#93c5fd", fontSize: Math.round(15 * fontScale), fontWeight: 900, padding: 0, lineHeight: 1 }}
              >×</button>
            </div>
          ) : (
            <button onClick={onMyLocation} disabled={locatingMe} title={tr.myLocation}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: locatingMe ? "#374151" : "#1d4ed8",
                color: "#fff", border: "none", borderRadius: 8,
                padding: `${btnPadV}px ${btnPadH}px`,
                fontSize: btnFont, fontWeight: 700,
                cursor: locatingMe ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", opacity: locatingMe ? 0.7 : 1,
                transition: "font-size 0.15s, padding 0.15s",
              }}
            >
              {locatingMe ? "⏳" : "📍"} {tr.myLocation}
            </button>
          )}

          {/* ② 附近廁所 / Nearby */}
          {nearCount > 0 ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 5,
              background: "#065f46", color: "#6ee7b7",
              fontSize: chipFont, fontWeight: 700,
              padding: `${btnPadV - 1}px ${btnPadH}px`, borderRadius: 8,
              whiteSpace: "nowrap",
            }}>
              ⭐ {tr.nearestN(nearCount)}
              <button onClick={onClearNear} title="清除附近廁所"
                style={{ background: "none", border: "none", cursor: "pointer", color: "#6ee7b7", fontSize: Math.round(15 * fontScale), fontWeight: 900, padding: 0, lineHeight: 1 }}
              >×</button>
            </div>
          ) : (
            <button onClick={onNearMe} disabled={locatingNear} title={tr.nearby}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                background: locatingNear ? "#374151" : "#0D9488",
                color: "#fff", border: "none", borderRadius: 8,
                padding: `${btnPadV}px ${btnPadH}px`,
                fontSize: btnFont, fontWeight: 700,
                cursor: locatingNear ? "not-allowed" : "pointer",
                whiteSpace: "nowrap", opacity: locatingNear ? 0.7 : 1,
                transition: "font-size 0.15s, padding 0.15s",
              }}
            >
              {locatingNear ? "⏳" : "🚻"} {tr.nearby}
            </button>
          )}

          {/* ③ 篩選 / Filter */}
          <button onClick={onToggleSidebar}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              background: sidebarOpen ? "#0f766e" : "#374151",
              color: "#fff", border: "none", borderRadius: 8,
              padding: `${btnPadV}px ${btnPadH}px`,
              fontSize: btnFont, fontWeight: 700,
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "font-size 0.15s, padding 0.15s",
            }}
            aria-label="Toggle filter sidebar"
          >
            {sidebarOpen ? `✕ ${tr.close}` : `☰ ${tr.filter}`}
          </button>
        </div>
      )}
    </header>
  );
}

/* ── Scaler button ─────────────────────────────────────────── */
function ScaleBtn({
  onClick, disabled, label, title,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  title: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        width: 26, height: 22,
        background: disabled ? "#1f2937" : "#374151",
        color: disabled ? "#4b5563" : "#e5e7eb",
        border: "none", borderRadius: 4,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: 12, fontWeight: 900, lineHeight: 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
      }}
    >{label}</button>
  );
}
