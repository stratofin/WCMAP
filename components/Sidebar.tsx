"use client";

import type { Filters, RestroomCategory } from "./types";
import { useLang } from "@/lib/LanguageContext";

interface SidebarProps {
  open: boolean;
  filters: Filters;
  onChange: (f: Filters) => void;
  total: number;
  filtered: number;
  mobileView: boolean;
}

const CATEGORY_ICONS: Record<RestroomCategory | "all", string> = {
  all:          "🗺",
  public:       "🚻",
  convenience:  "🏪",
  cafe:         "☕",
  fastfood:     "🍔",
  mrt:          "🚇",
  department:   "🏬",
};

export default function Sidebar({ open, filters, onChange, total, filtered, mobileView }: SidebarProps) {
  const { tr } = useLang();
  const toggle = (key: keyof Omit<Filters, "search" | "category">) =>
    onChange({ ...filters, [key]: !filters[key] });

  const CAT_LABELS: Record<RestroomCategory | "all", string> = {
    all:         tr.catAll,
    public:      tr.catPublic,
    convenience: tr.catConvenience,
    cafe:        tr.catCafe,
    fastfood:    tr.catFastFood,
    mrt:         tr.catMrt,
    department:  tr.catDepartment,
  };

  /* ── Mobile: bottom sheet ── */
  const mobileStyle: React.CSSProperties = {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: "auto",
    maxHeight: "80vh",
    width: "100%",
    zIndex: 1000,
    background: "#fff",
    boxShadow: "0 -4px 24px rgba(0,0,0,0.18)",
    borderRadius: "18px 18px 0 0",
    overflowY: "auto",
    transform: open ? "translateY(0)" : "translateY(110%)",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
  };

  /* ── Desktop: right panel ── */
  const desktopStyle: React.CSSProperties = {
    position: "fixed",
    top: 56,
    right: 0,
    bottom: 0,
    width: 288,
    zIndex: 1000,
    background: "#fff",
    boxShadow: "-4px 0 24px rgba(0,0,0,0.15)",
    overflowY: "auto",
    transform: open ? "translateX(0)" : "translateX(100%)",
    transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
  };

  const cats: (RestroomCategory | "all")[] = ["all", "public", "mrt", "convenience", "cafe", "fastfood", "department"];

  return (
    <aside style={mobileView ? mobileStyle : desktopStyle}>
      {/* Mobile drag handle */}
      {mobileView && (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: "#d1d5db" }} />
        </div>
      )}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16, height: "100%", boxSizing: "border-box" }}>

        {/* Count */}
        <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
          {tr.showingN(filtered, total)}
        </p>

        {/* Search */}
        <input
          type="search"
          placeholder={"🔍 " + tr.searchPlaceholder}
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          style={{
            width: "100%",
            border: "1.5px solid #d1d5db",
            borderRadius: 10,
            padding: "9px 12px",
            fontSize: 14,
            outline: "none",
            boxSizing: "border-box",
          }}
        />

        {/* ── Category picker ── */}
        <div>
          <h2 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {tr.categoryTitle}
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {cats.map((cat) => {
              const active = filters.category === cat;
              return (
                <button
                  key={cat}
                  onClick={() => onChange({ ...filters, category: cat })}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "5px 10px",
                    borderRadius: 20,
                    border: `1.5px solid ${active ? "#0D9488" : "#d1d5db"}`,
                    background: active ? "#0D9488" : "#fff",
                    color: active ? "#fff" : "#374151",
                    fontSize: 12,
                    fontWeight: active ? 700 : 400,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  {CAT_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div>
          <h2 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {tr.filterTitle}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <FilterToggle
              label={`♿ ${tr.accessible}`}
              checked={filters.accessible}
              onChange={() => toggle("accessible")}
            />
            <FilterToggle
              label={`👶 ${tr.babyChange}`}
              checked={filters.babyChange}
              onChange={() => toggle("babyChange")}
            />
            <FilterToggle
              label={`🕐 ${tr.is24h}`}
              checked={filters.is24h}
              onChange={() => toggle("is24h")}
            />
          </div>
        </div>

        {/* Legend */}
        <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: 12 }}>
          <h2 style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            圖例 / Legend
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <LegendItem color="#0D9488" label={`🚻 ${tr.catPublic}`} />
            <LegendItem color="#8b5cf6" label={`🚇 ${tr.catMrt}`} />
            <LegendItem color="#f97316" label={`🏪 ${tr.catConvenience}`} />
            <LegendItem color="#84cc16" label={`☕ ${tr.catCafe}`} />
            <LegendItem color="#ef4444" label={`🍔 ${tr.catFastFood}`} />
            <LegendItem color="#ec4899" label={`🏬 ${tr.catDepartment}`} />
            <LegendItem color="#f59e0b" label="⭐ Near Me" />
            <LegendItem color="#3b82f6" label="📍 You" />
          </div>
        </div>

        {/* Footer */}
        <p style={{ marginTop: "auto", fontSize: 11, color: "#9ca3af" }}>
          資料來源：台北市政府開放資料平台
        </p>
      </div>
    </aside>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      onClick={onChange}
      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", userSelect: "none" }}
    >
      {/* Track */}
      <div
        style={{
          position: "relative",
          width: 42,
          height: 24,
          borderRadius: 99,
          background: checked ? "#0D9488" : "#d1d5db",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        {/* Thumb */}
        <div
          style={{
            position: "absolute",
            top: 3,
            left: checked ? 21 : 3,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
            transition: "left 0.2s",
          }}
        />
      </div>
      <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
    </label>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: color,
        border: "2px solid #fff",
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 12, color: "#6b7280" }}>{label}</span>
    </div>
  );
}
