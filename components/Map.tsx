"use client";

import { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type { Restroom, RestroomCategory } from "./types";
import RatingWidget from "./RatingWidget";
import { TILE_STYLES, type TileStyle } from "@/lib/tileStyles";
export type { TileStyle } from "@/lib/tileStyles";
export { TILE_STYLES };

// Fix Leaflet default icon path broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

/** Category → { color, emoji } for marker */
const CAT_STYLE: Record<RestroomCategory, { color: string; emoji: string }> = {
  public:       { color: "#0D9488", emoji: "🚻" },
  mrt:          { color: "#0891b2", emoji: "🚇" },
  convenience:  { color: "#f97316", emoji: "🏪" },
  cafe:         { color: "#84cc16", emoji: "☕" },
  fastfood:     { color: "#ef4444", emoji: "🍔" },
  department:   { color: "#ec4899", emoji: "🏬" },
};

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Pulsing blue "you are here" marker */
function makeUserIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        <div class="user-loc-pulse" style="
          position:absolute;
          inset:0;
          border-radius:50%;
          background:#3b82f6;
          opacity:0.6;
        "></div>
        <div style="
          position:absolute;
          width:16px;height:16px;
          border-radius:50%;
          background:#2563eb;
          border:3px solid #fff;
          box-shadow:0 2px 8px rgba(37,99,235,0.6);
        "></div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

/** Pin marker coloured by category; amber when in nearIds */
function makeMarkerIcon(category: RestroomCategory, isNear: boolean) {
  const { color, emoji } = CAT_STYLE[category] ?? CAT_STYLE.public;
  const bg = isNear ? "#f59e0b" : color;
  const size = 38;
  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:${size}px;
        height:${size}px;
        background:${bg};
        border:3px solid #fff;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 10px rgba(0,0,0,0.35);
        display:flex;
        align-items:center;
        justify-content:center;
      ">
        <span style="
          transform:rotate(45deg);
          font-size:17px;
          line-height:1;
          display:block;
          margin-top:2px;
          margin-left:2px;
        ">${emoji}</span>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -(size + 4)],
  });
}

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

interface MapProps {
  restrooms: Restroom[];
  nearIds: Set<string>;
  userLat: number | null;
  userLng: number | null;
  tileStyle: TileStyle;
}

export default function Map({ restrooms, nearIds, userLat, userLng, tileStyle }: MapProps) {
  const tile = TILE_STYLES[tileStyle] ?? TILE_STYLES.voyager;
  const isDark = !!tile.dark;
  return (
    <MapContainer
      center={[23.6978, 120.9605]}
      zoom={8}
      className={`w-full h-full${isDark ? " map-dark" : ""}`}
      zoomControl={true}
    >
      <TileLayer
        key={tileStyle}
        url={tile.url}
        attribution={tile.attribution}
        maxZoom={19}
      />

      {restrooms.map((r) => {
        const isNear = nearIds.has(r.id);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
        const reportUrl = `https://docs.google.com/forms/d/e/1FAIpQLSf_placeholder/viewform`;
        const catStyle = CAT_STYLE[r.category] ?? CAT_STYLE.public;

        return (
          <Marker
            key={r.id}
            position={[r.lat, r.lng]}
            icon={makeMarkerIcon(r.category, isNear)}
          >
            <Popup maxWidth={300} minWidth={240}>
              <div style={{ fontFamily: "Arial, sans-serif", padding: "2px 0" }}>

                {/* Title row */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <strong style={{ fontSize: 15 }}>{r.name}</strong>
                  {r.brand && (
                    <span style={{ background: "#f3f4f6", color: "#374151", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 99 }}>
                      {catStyle.emoji} {r.brand}
                    </span>
                  )}
                  {isNear && (
                    <span style={{ background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 99 }}>
                      ⭐ 最近
                    </span>
                  )}
                  {r.distance !== undefined && (
                    <span style={{ background: "#ccfbf1", color: "#115e59", fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 99 }}>
                      📏 {formatDist(r.distance)}
                    </span>
                  )}
                </div>

                {/* Location */}
                {r.district && (
                  <p style={{ color: "#6b7280", fontSize: 12, margin: "0 0 2px" }}>📍 {r.district}{r.address ? `・${r.address}` : ""}</p>
                )}

                {/* Hours */}
                <p style={{ fontSize: 13, margin: "4px 0 6px" }}>🕐 {r.hours}</p>

                {/* Feature badges */}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {r.accessible && (
                    <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: 12, padding: "2px 8px", borderRadius: 99, fontWeight: 500 }}>
                      ♿ 無障礙
                    </span>
                  )}
                  {r.babyChange && (
                    <span style={{ background: "#fce7f3", color: "#9d174d", fontSize: 12, padding: "2px 8px", borderRadius: 99, fontWeight: 500 }}>
                      👶 親子
                    </span>
                  )}
                  {r.is24h && (
                    <span style={{ background: "#d1fae5", color: "#065f46", fontSize: 12, padding: "2px 8px", borderRadius: 99, fontWeight: 500 }}>
                      🕐 24h
                    </span>
                  )}
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      background: catStyle.color,
                      color: "#fff",
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "7px 14px",
                      borderRadius: 8,
                      textDecoration: "none",
                    }}
                  >
                    🗺 導航
                  </a>
                  <a
                    href={reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-block",
                      background: "#f3f4f6",
                      color: "#374151",
                      fontSize: 13,
                      fontWeight: 700,
                      padding: "7px 14px",
                      borderRadius: 8,
                      textDecoration: "none",
                    }}
                  >
                    ⚠ 回報
                  </a>
                </div>

                {/* Rating widget */}
                <RatingWidget
                  restroomId={r.id}
                  initialAggregate={
                    r.avgRating !== undefined && r.ratingCount !== undefined
                      ? { avgRating: r.avgRating, ratingCount: r.ratingCount }
                      : null
                  }
                />
              </div>
            </Popup>
          </Marker>
        );
      })}

      {userLat !== null && userLng !== null && (
        <>
          <FlyTo lat={userLat} lng={userLng} />
          <Marker position={[userLat, userLng]} icon={makeUserIcon()}>
            <Popup>
              <div style={{ fontFamily: "Arial, sans-serif", textAlign: "center", padding: "4px 0" }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>📍</div>
                <strong style={{ fontSize: 14 }}>你在這裡</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#6b7280" }}>
                  {userLat.toFixed(5)}, {userLng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        </>
      )}
    </MapContainer>
  );
}
