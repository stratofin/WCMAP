"use client";

import type { Filters, RestroomCategory } from "./types";
import { useLang } from "@/lib/LanguageContext";

// ── Taiwan regions grouped by area ───────────────────────────────
const REGION_GROUPS = [
  {
    group: "北部 North",
    regions: ["台北市", "新北市", "基隆市", "桃園市", "新竹市", "新竹縣"],
  },
  {
    group: "中部 Central",
    regions: ["苗栗縣", "台中市", "彰化縣", "南投縣", "雲林縣"],
  },
  {
    group: "南部 South",
    regions: ["嘉義市", "嘉義縣", "台南市", "高雄市", "屏東縣"],
  },
  {
    group: "東部 East",
    regions: ["宜蘭縣", "花蓮縣", "台東縣"],
  },
  {
    group: "離島 Islands",
    regions: ["澎湖縣", "金門縣", "連江縣"],
  },
];

// Government / public color family
const GOV_COLOR = "#0D9488";
const MRT_COLOR = "#0891b2";
// Commercial colors
const COM_COLORS: Partial<Record<RestroomCategory, string>> = {
  convenience: "#f97316",
  cafe:        "#84cc16",
  fastfood:    "#ef4444",
  department:  "#ec4899",
};

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

  const govCats: (RestroomCategory | "all")[] = ["public", "mrt"];
  const comCats: RestroomCategory[] = ["convenience", "cafe", "fastfood", "department"];

  function CatButton({ cat, activeColor }: { cat: RestroomCategory | "all"; activeColor: string }) {
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
          border: `1.5px solid ${active ? activeColor : "#d1d5db"}`,
          background: active ? activeColor : "#fff",
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
  }

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

        {/* ── Region picker ── */}
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            📍 {tr.regionTitle}
          </h2>
          <select
            value={filters.region}
            onChange={(e) => onChange({ ...filters, region: e.target.value })}
            style={{
              width: "100%",
              border: `1.5px solid ${filters.region !== "all" ? "#0D9488" : "#d1d5db"}`,
              borderRadius: 10,
              padding: "8px 12px",
              fontSize: 14,
              background: filters.region !== "all" ? "#f0fdf9" : "#fff",
              color: "#111827",
              outline: "none",
              cursor: "pointer",
              appearance: "none",
              WebkitAppearance: "none",
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%236b7280' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 12px center",
              paddingRight: 32,
              boxSizing: "border-box",
            }}
          >
            <option value="all">{tr.regionAll}</option>
            {REGION_GROUPS.map((g) => (
              <optgroup key={g.group} label={g.group}>
                {g.regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* ── Category picker ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {tr.categoryTitle}
          </h2>

          {/* All */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <CatButton cat="all" activeColor={GOV_COLOR} />
          </div>

          {/* Government / Public group */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#0891b2", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 }}>
              🏛 {tr.govGroup}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              <CatButton cat="public" activeColor={GOV_COLOR} />
              <CatButton cat="mrt"    activeColor={MRT_COLOR} />
            </div>
          </div>

          {/* Commercial group */}
          <div>
            <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 4 }}>
              🏪 {tr.commercialGroup}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {comCats.map((cat) => (
                <CatButton key={cat} cat={cat} activeColor={COM_COLORS[cat] ?? "#374151"} />
              ))}
            </div>
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

          {/* Government group */}
          <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, color: "#0891b2", letterSpacing: "0.04em" }}>
            🏛 {tr.govGroup}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            <LegendItem color="#0D9488" label={`🚻 ${tr.catPublic}`} />
            <LegendItem color="#0891b2" label={`🚇 ${tr.catMrt}`} />
          </div>

          {/* Commercial group */}
          <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 600, color: "#9ca3af", letterSpacing: "0.04em" }}>
            🏪 {tr.commercialGroup}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            <LegendItem color="#f97316" label={`🏪 ${tr.catConvenience}`} />
            <LegendItem color="#84cc16" label={`☕ ${tr.catCafe}`} />
            <LegendItem color="#ef4444" label={`🍔 ${tr.catFastFood}`} />
            <LegendItem color="#ec4899" label={`🏬 ${tr.catDepartment}`} />
          </div>

          {/* Map markers */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <LegendItem color="#f59e0b" label="⭐ 附近 / Nearby" />
            <LegendItem color="#3b82f6" label="📍 你在這 / You" />
          </div>
        </div>

        {/* Footer */}
        <p style={{ marginTop: "auto", fontSize: 11, color: "#9ca3af" }}>
          資料來源：政府開放資料平台 data.gov.tw
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
