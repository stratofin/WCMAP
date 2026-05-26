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
import type { Restroom } from "./types";

// Fix Leaflet default icon path broken by webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

function formatDist(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Pulsing blue "you are here" marker */
function makeUserIcon() {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        <!-- outer pulse ring -->
        <div class="user-loc-pulse" style="
          position:absolute;
          inset:0;
          border-radius:50%;
          background:#3b82f6;
          opacity:0.6;
        "></div>
        <!-- inner solid dot -->
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

/** Large, clearly visible WC pin marker */
function makeWCIcon(isNear: boolean) {
  const bg = isNear ? "#f59e0b" : "#0D9488";
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
          font-size:18px;
          line-height:1;
          display:block;
          margin-top:2px;
          margin-left:2px;
        ">🚻</span>
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
    map.flyTo([lat, lng], 15, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

const TILES = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  simple: {
    // CartoDB Positron — clean, minimal, great readability (like Google Maps light mode)
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

interface MapProps {
  restrooms: Restroom[];
  nearIds: Set<string>;
  userLat: number | null;
  userLng: number | null;
  simplified: boolean;
}

export default function Map({ restrooms, nearIds, userLat, userLng, simplified }: MapProps) {
  const tile = simplified ? TILES.simple : TILES.standard;
  return (
    <MapContainer
      center={[25.033, 121.5654]}
      zoom={14}
      className="w-full h-full"
      zoomControl={true}
    >
      {/* key forces tile layer remount when style changes */}
      <TileLayer
        key={simplified ? "simple" : "standard"}
        url={tile.url}
        attribution={tile.attribution}
        maxZoom={19}
      />

      {restrooms.map((r) => {
        const isNear = nearIds.has(r.id);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`;
        const reportUrl = `https://docs.google.com/forms/d/e/1FAIpQLSf_placeholder/viewform`;

        return (
          <Marker key={r.id} position={[r.lat, r.lng]} icon={makeWCIcon(isNear)}>
            <Popup maxWidth={300} minWidth={240}>
              {/* Popup uses plain inline styles — no Tailwind inside Leaflet popup */}
              <div style={{ fontFamily: "Arial, sans-serif", padding: "2px 0" }}>

                {/* Title row */}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 6 }}>
                  <strong style={{ fontSize: 15 }}>{r.name}</strong>
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
                      background: "#0D9488",
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
