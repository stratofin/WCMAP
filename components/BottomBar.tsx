"use client";

import { useLang } from "@/lib/LanguageContext";

interface BottomBarProps {
  fontScale: number;
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
  // Filter
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function BottomBar({
  fontScale,
  onMyLocation,
  locatingMe,
  locationActive,
  onClearLocation,
  onNearMe,
  locatingNear,
  nearCount,
  onClearNear,
  onToggleSidebar,
  sidebarOpen,
}: BottomBarProps) {
  const { tr } = useLang();

  // Derived sizes — scale up both the bar height and font sizes
  const barHeight = Math.round(64 * fontScale);
  const emojiSize = Math.round(22 * fontScale);
  const labelSize = Math.round(10 * fontScale);

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1002,
        background: "#111827",
        borderTop: "1px solid #1f2937",
        display: "flex",
        alignItems: "stretch",
        height: barHeight,
        paddingBottom: "env(safe-area-inset-bottom)", // iOS notch support
        boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
        transition: "height 0.15s ease",
      }}
    >
      {/* ① 我的位置 / My Location */}
      {locationActive ? (
        <ActiveChip
          emoji="📍"
          label={tr.located}
          dotColor="#60a5fa"
          bg="#1d4ed8"
          onClear={onClearLocation}
          emojiSize={emojiSize}
          labelSize={labelSize}
        />
      ) : (
        <BarButton
          emoji={locatingMe ? "⏳" : "📍"}
          label={tr.myLocation}
          onClick={onMyLocation}
          disabled={locatingMe}
          active={false}
          emojiSize={emojiSize}
          labelSize={labelSize}
        />
      )}

      <Divider />

      {/* ② 附近廁所 / Nearby */}
      {nearCount > 0 ? (
        <ActiveChip
          emoji="🚻"
          label={tr.nearestN(nearCount)}
          dotColor="#6ee7b7"
          bg="#065f46"
          onClear={onClearNear}
          emojiSize={emojiSize}
          labelSize={labelSize}
        />
      ) : (
        <BarButton
          emoji={locatingNear ? "⏳" : "🚻"}
          label={tr.nearby}
          onClick={onNearMe}
          disabled={locatingNear}
          active={false}
          accentColor="#0D9488"
          emojiSize={emojiSize}
          labelSize={labelSize}
        />
      )}

      <Divider />

      {/* ③ 篩選 / Filter */}
      <BarButton
        emoji={sidebarOpen ? "✕" : "☰"}
        label={sidebarOpen ? tr.close : tr.filter}
        onClick={onToggleSidebar}
        disabled={false}
        active={sidebarOpen}
        accentColor="#0f766e"
        emojiSize={emojiSize}
        labelSize={labelSize}
      />
    </nav>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function BarButton({
  emoji,
  label,
  onClick,
  disabled,
  active,
  accentColor = "#1d4ed8",
  emojiSize = 22,
  labelSize = 10,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
  disabled: boolean;
  active: boolean;
  accentColor?: string;
  emojiSize?: number;
  labelSize?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        background: active ? accentColor : "transparent",
        border: "none",
        color: active ? "#fff" : "#d1d5db",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        padding: "8px 4px",
        transition: "background 0.2s",
        WebkitTapHighlightColor: "transparent",
        touchAction: "manipulation",
      }}
    >
      <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{emoji}</span>
      <span style={{ fontSize: labelSize, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
    </button>
  );
}

function ActiveChip({
  emoji,
  label,
  dotColor,
  bg,
  onClear,
  emojiSize = 19,
  labelSize = 10,
}: {
  emoji: string;
  label: string;
  dotColor: string;
  bg: string;
  onClear: () => void;
  emojiSize?: number;
  labelSize?: number;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        background: bg,
        padding: "6px 4px",
        position: "relative",
      }}
    >
      {/* Pulsing dot */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
        <span
          style={{
            display: "inline-block",
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}44`,
            animation: "pulse 1.5s infinite",
          }}
        />
        <span style={{ fontSize: emojiSize, lineHeight: 1 }}>{emoji}</span>
      </div>
      <span style={{ fontSize: labelSize, fontWeight: 700, color: "#fff", letterSpacing: 0.3 }}>{label}</span>
      {/* Clear button — top-right corner */}
      <button
        onClick={onClear}
        style={{
          position: "absolute",
          top: 4,
          right: 6,
          background: "rgba(255,255,255,0.2)",
          border: "none",
          borderRadius: "50%",
          width: 18,
          height: 18,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "#fff",
          fontSize: 11,
          fontWeight: 900,
          lineHeight: 1,
          padding: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: 1,
        background: "#1f2937",
        alignSelf: "stretch",
        margin: "10px 0",
      }}
    />
  );
}
