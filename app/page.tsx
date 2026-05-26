"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import type { Restroom, Filters } from "@/components/types";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import BottomBar from "@/components/BottomBar";

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

export default function Home() {
  const [allRestrooms, setAllRestrooms] = useState<Restroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<"api" | "fallback">("fallback");
  const [filters, setFilters] = useState<Filters>({
    accessible: false,
    babyChange: false,
    is24h: false,
    search: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [simplified, setSimplified] = useState(false);   // map tile style
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
    if (filters.accessible && !r.accessible) return false;
    if (filters.babyChange && !r.babyChange) return false;
    if (filters.is24h && !r.is24h) return false;
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !r.name.toLowerCase().includes(q) &&
        !r.district.toLowerCase().includes(q) &&
        !r.address.toLowerCase().includes(q)
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
      setGeoError("此瀏覽器不支援定位功能");
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
        setGeoError(err.message || "定位失敗，請確認已允許位置權限");
        setLocatingMe(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  /** Show location AND highlight the 5 nearest restrooms */
  const handleNearMe = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError("此瀏覽器不支援定位功能");
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
        setGeoError(err.message || "定位失敗，請確認已允許位置權限");
        setLocatingNear(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [allRestrooms]);

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
        {loading ? (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
            <div style={{ textAlign: "center", color: "#6b7280" }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🚻</div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>載入台北公廁資料...</p>
            </div>
          </div>
        ) : (
          <Map
            restrooms={displayRestrooms}
            nearIds={nearIds}
            userLat={userLat}
            userLng={userLng}
            simplified={simplified}
          />
        )}

        {/* ── Floating map style toggle (top-left) ── */}
        {!loading && (
          <div style={{
            position: "absolute",
            top: 100,
            left: 10,
            zIndex: 900,
            display: "flex",
            flexDirection: "column",
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "0 1px 5px rgba(0,0,0,0.35)",
            border: "2px solid rgba(0,0,0,0.18)",
          }}>
            <button
              onClick={() => setSimplified(s => !s)}
              title={simplified ? "切換回詳細地圖" : "切換為簡化地圖"}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: simplified ? "#0D9488" : "#fff",
                color: simplified ? "#fff" : "#333",
                border: "none",
                padding: "8px 10px",
                fontSize: 18,
                cursor: "pointer",
                lineHeight: 1,
                gap: 2,
                minWidth: 46,
                touchAction: "manipulation",
              }}
            >
              🗺
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.2 }}>
                {simplified ? "標準圖" : "簡化圖"}
              </span>
            </button>
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
            ⚠ 示範資料（API暫時無法連線）
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
