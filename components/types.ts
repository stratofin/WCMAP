export type RestroomCategory =
  | "public"        // 公廁
  | "convenience"   // 便利商店
  | "cafe"          // 咖啡廳
  | "fastfood"      // 速食店
  | "mrt"           // 捷運站
  | "department";   // 百貨公司

export interface Restroom {
  id: string;
  name: string;
  address: string;
  district: string;
  lat: number;
  lng: number;
  hours: string;
  accessible: boolean;
  babyChange: boolean;
  is24h: boolean;
  category: RestroomCategory;
  brand?: string;        // e.g. "7-ELEVEN", "McDonald's"
  distance?: number;     // km, added at runtime
  avgRating?: number;    // 1–5, from Firestore
  ratingCount?: number;
}

export interface Filters {
  accessible: boolean;
  babyChange: boolean;
  is24h: boolean;
  search: string;
  category: RestroomCategory | "all";
}
