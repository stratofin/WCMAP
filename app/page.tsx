"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import type { Restroom, Filters } from "@/components/types";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BottomBar from "@/components/BottomBar";
import { LanguageProvider, useLang } from "@/lib/LanguageContext";
import { TILE_STYLES, TILE_STYLE_ORDER, type TileStyle } from "@/lib/tileStyles";

const Map = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-center text-gray-500">
        <div className="text-4xl mb-2">🗺</div>
        <p className="text-sm">地圖載入中...</p>
      </div>
    </div>
  ),
});

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function HomeInner() {
  const { tr } = useLang();
  const [allRestrooms, setAllRestrooms] = useState<Restroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"api" | "fallback">("fallback");
  const [filters, setFilters] = useState<Filters>({
    accessible: false,
    babyChange: false,
    is24h: false,
    search: "",
    category: "all",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tileStyle, setTileStyle] = useState<TileStyle>("voyager");  // default: beautiful colour map
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);       // auto-detected
  const [fontScale, setFontScale] = useState(1);         // UI text scale: 0.8–1.6
  const scaleUp = () => setFontScale(s => Math.min(1.6, parseFloat((s + 0.1).toFixed(1))));
  const scaleDown = () => setFontScale(s => Math.max(0.8, parseFloat((s - 0.1).toFixed(1))));
  const [locatingMe, setLocatingMe] = useState(false);
  const [locatingNear, setLocatingNear] = useState(false);
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [nearIds, setNearIds] = useState<Set<string>>(new Set());
  const [geoError, setGeoError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/restrooms")
      .then((r) => r.json())
      .then(({ restrooms, source }) => {
        setAllRestrooms(restrooms);
        setDataSource(source);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Auto-detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const filtered = allRestrooms.filter((r) => {
    if (filters.category !== "all" && r.category !== filters.category) return false;
    if (filters.accessible && !r.accessible) return false;
    if (filters.babyChange && !r.babyChange) return false;
    if (filters.is24h && !r.is24h) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !r.name.toLowerCase().includes(q) &&
        !r.district.toLowerCase().includes(q) &&
        !r.address.toLowerCase().includes(q) &&
        !(r.brand?.toLowerCase().includes(q) ?? false)
      )
        return false;
    }
    return true;
  });

  // Attach distances if geolocation active
  const displayRestrooms =
    userLat !== null && userLng !== null
      ? filtered.map((r) => ({
          ...r,
          distance: haversineKm(userLat!, userLng!, r.lat, r.lng),
        }))
      : filtered;

  /** Just show my location on the map — no restroom highlighting */
  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(tr.geoNotSupported);
      return;
    }
    setLocatingMe(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        setLocatingMe(false);
      },
      (err) => {
        setGeoError(err.message || tr.geoFailed);
        setLocatingMe(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [tr]);

  /** Show location AND highlight the 5 nearest restrooms */
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError(tr.geoNotSupported);
      return;
    }
    setLocatingNear(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLat(lat);
        setUserLng(lng);

        const sorted = allRestrooms
          .map((r) => ({ ...r, distance: haversineKm(lat, lng, r.lat, r.lng) }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, 5);

        setNearIds(new Set(sorted.map((r) => r.id)));
        setLocatingNear(false);
        setSidebarOpen(false);
      },
      (err) => {
        setGeoError(err.message || tr.geoFailed);
        setLocatingNear(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [allRestrooms, tr]);

  const clearLocation = () => {
    setUserLat(null);
    setUserLng(null);
  };

  const clearNear = () => {
    setNearIds(new Set());
    setUserLat(null);
    setUserLng(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Header
        isMobile={isMobile}
        fontScale={fontScale}
        onScaleUp={scaleUp}
        onScaleDown={scaleDown}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((o) => !o)}
        onMyLocation={handleMyLocation}
        locatingMe={locatingMe}
        locationActive={userLat !== null}
        onClearLocation={clearLocation}
        onNearMe={handleNearMe}
        locatingNear={locatingNear}
        nearCount={nearIds.size}
        onClearNear={clearNear}
      />

      {/* Map fills remaining height — add bottom padding on mobile for BottomBar */}
      <main style={{
        flex: 1,
        position: "relative",
        overflow: "hidden",
        paddingBottom: isMobile ? Math.round(64 * fontScale) : 0,
      }}>
        {!loading && (
          <Map
            restrooms={displayRestrooms}
            nearIds={nearIds}
            userLat={userLat}
            userLng={userLng}
            tileStyle={tileStyle}
          />
        )}

        {/* ── Floating map style picker (top-left) ── */}
        {!loading && (
          <div style={{
            position: "absolute",
            top: 10,
            left: 10,
            zIndex: 900,
          }}>
            {/* Toggle button */}
            <button
              onClick={() => setStylePickerOpen(o => !o)}
              title="切換地圖風格"
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: stylePickerOpen ? "#111827" : "rgba(255,255,255,0.95)",
                color: stylePickerOpen ? "#fff" : "#111827",
                border: "2px solid rgba(0,0,0,0.18)",
                borderRadius: 10,
                padding: "7px 10px",
                fontSize: 20,
                cursor: "pointer",
                lineHeight: 1,
                gap: 2,
                minWidth: 50,
                boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                touchAction: "manipulation",
                WebkitTapHighlightColor: "transparent",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {TILE_STYLES[tileStyle].emoji}
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, marginTop: 2 }}>
                地圖風格
              </span>
            </button>

            {/* Style picker panel */}
            {stylePickerOpen && (
              <div style={{
                position: "absolute",
                top: "calc(100% + 6px)",
                left: 0,
                background: "rgba(17,24,39,0.96)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                padding: 10,
                boxShadow: "0 8px 32px rgba(0,0,0,0.45)",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                minWidth: 140,
              }}>
                <p style={{ margin: "0 0 6px", fontSize: 10, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  地圖風格
                </p>
                {TILE_STYLE_ORDER.map((style) => {
                  const s = TILE_STYLES[style];
                  const active = tileStyle === style;
                  return (
                    <button
                      key={style}
                      onClick={() => { setTileStyle(style); setStylePickerOpen(false); }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: `1.5px solid ${active ? "#0D9488" : "transparent"}`,
                        background: active ? "rgba(13,148,136,0.18)" : "rgba(255,255,255,0.06)",
                        color: active ? "#5eead4" : "#e5e7eb",
                        cursor: "pointer",
                        width: "100%",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: active ? 700 : 400,
                        transition: "all 0.12s",
                        WebkitTapHighlightColor: "transparent",
                      }}
                    >
                      <span style={{ fontSize: 18, lineHeight: 1 }}>{s.emoji}</span>
                      <div>
                        <div style={{ lineHeight: 1.2 }}>{s.label}</div>
                        <div style={{ fontSize: 10, color: active ? "#99f6e4" : "#6b7280", lineHeight: 1.2 }}>{s.labelEn}</div>
                      </div>
                      {active && (
                        <span style={{ marginLeft: "auto", fontSize: 14, color: "#0D9488" }}>✓</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Dim backdrop when sidebar open */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.25)",
              zIndex: 999,
            }}
          />
        )}

        {/* Invisible backdrop to close style picker */}
        {stylePickerOpen && (
          <div
            onClick={() => setStylePickerOpen(false)}
            style={{ position: "absolute", inset: 0, zIndex: 890 }}
          />
        )}

        {/* Geo error toast */}
        {geoError && (
          <div style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 1100,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#991b1b",
            fontSize: 13,
            padding: "8px 16px",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            whiteSpace: "nowrap",
          }}>
            ⚠ {geoError}
            <button onClick={() => setGeoError(null)} style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, color: "#991b1b", padding: 0 }}>×</button>
          </div>
        )}

        {/* Map loading overlay uses translated string */}
        {loading && (
          <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
            <div style={{ textAlign: "center", color: "#6b7280" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🚻</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>{tr.dataLoading}</p>
            </div>
          </div>
        )}

        {/* Data source badge — raise above BottomBar on mobile */}
        {!loading && dataSource === "fallback" && (
          <div style={{
            position: "absolute",
            bottom: isMobile ? Math.round(76 * fontScale) : 28,
            left: 12,
            zIndex: 900,
            background: "#fffbeb",
            border: "1px solid #fcd34d",
            color: "#92400e",
            fontSize: 11,
            padding: "4px 10px",
            borderRadius: 6,
            boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
          }}>
            {tr.fallbackBadge}
          </div>
        )}
      </main>

      {/* Sidebar — fixed, outside main so overflow:hidden doesn't clip it */}
      <Sidebar
        open={sidebarOpen}
        filters={filters}
        onChange={setFilters}
        total={allRestrooms.length}
        filtered={filtered.length}
        mobileView={isMobile}
      />

      {/* Mobile bottom navigation bar */}
      {isMobile && (
        <BottomBar
          fontScale={fontScale}
          onMyLocation={handleMyLocation}
          locatingMe={locatingMe}
          locationActive={userLat !== null}
          onClearLocation={clearLocation}
          onNearMe={handleNearMe}
          locatingNear={locatingNear}
          nearCount={nearIds.size}
          onClearNear={clearNear}
          onToggleSidebar={() => setSidebarOpen((o) => !o)}
          sidebarOpen={sidebarOpen}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <LanguageProvider>
      <HomeInner />
    </LanguageProvider>
  );
}
