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
  distance?: number; // km, set when geolocation is active
}

export interface Filters {
  accessible: boolean;
  babyChange: boolean;
  is24h: boolean;
  search: string;
}
