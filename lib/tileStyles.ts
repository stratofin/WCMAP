export type TileStyle = "standard" | "voyager" | "dark" | "minimal";

export interface TileDef {
  label: string;
  labelEn: string;
  emoji: string;
  url: string;
  attribution: string;
  dark?: boolean;
}

export const TILE_STYLES: Record<TileStyle, TileDef> = {
  standard: {
    label: "標準",
    labelEn: "Standard",
    emoji: "🗺",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  voyager: {
    label: "彩色",
    labelEn: "Colour",
    emoji: "🎨",
    // CARTO Voyager — Google-Maps-like, vibrant colours, modern labels
    url: "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
  dark: {
    label: "暗色",
    labelEn: "Dark",
    emoji: "🌙",
    // CARTO Dark Matter — sleek dark mode
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    dark: true,
  },
  minimal: {
    label: "簡潔",
    labelEn: "Minimal",
    emoji: "⬜",
    // CARTO Positron — ultra-clean white background
    url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export const TILE_STYLE_ORDER: TileStyle[] = ["voyager", "minimal", "dark", "standard"];
