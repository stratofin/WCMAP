import { NextResponse } from "next/server";
import type { Restroom, RestroomCategory } from "@/components/types";

// ─────────────────────────────────────────────────────────────────
// 1. OpenStreetMap Overpass API (best coverage, free, no key)
// ─────────────────────────────────────────────────────────────────
// Multiple mirrors — tried in order until one succeeds
const OVERPASS_MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.ru/api/interpreter",
];
// Timeout 8s per mirror to stay within Vercel's 10s function limit
const OVERPASS_TIMEOUT_MS = 8000;
// Fetch all amenity=toilets + buildings/venues tagged toilets=yes in Taiwan
const OVERPASS_QUERY = `[out:json][bbox:21.5,118,26.5,122.5][timeout:7];
(
  node[amenity=toilets];
  way[amenity=toilets];
  node[toilets=yes][amenity];
);
out center;`;

interface OsmElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function osmToRestroom(el: OsmElement, i: number): Restroom | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (!lat || !lng) return null;
  if (lat < 21.5 || lat > 26.5 || lng < 118 || lng > 122.5) return null;

  const tags = el.tags ?? {};
  const is24h = tags.opening_hours === "24/7" ||
                tags.opening_hours === "Mo-Su 00:00-24:00";

  // Derive category from OSM tags
  let category: RestroomCategory = "public";
  const amenity = tags.amenity ?? "";
  const shop    = tags.shop    ?? "";
  if (shop === "convenience")                                       category = "convenience";
  else if (amenity === "cafe" || shop === "coffee")                 category = "cafe";
  else if (amenity === "fast_food" || amenity === "food_court")     category = "fastfood";
  else if (amenity === "subway_entrance" || tags.subway === "yes" ||
           tags.railway === "station" || tags.station === "subway") category = "mrt";
  else if (shop === "department_store" || shop === "mall")          category = "department";

  const name =
    tags["name:zh"] || tags.name || tags["name:en"] ||
    (category === "public" ? "公共廁所" : "廁所");

  const addrStreet = tags["addr:street"] ?? "";
  const addrHno    = tags["addr:housenumber"] ?? "";
  const addrFull   = tags["addr:full"] ?? "";
  const address    = addrFull || (addrStreet ? `${addrStreet} ${addrHno}`.trim() : "");

  const district =
    tags["addr:city"] || tags["addr:district"] ||
    tags["addr:county"] || tags["addr:state"] || "";

  return {
    id:         `osm-${el.id}`,
    name,
    address,
    district,
    lat,
    lng,
    hours:      tags.opening_hours || (is24h ? "24小時" : "資訊未提供"),
    accessible: tags.wheelchair === "yes" || tags.wheelchair === "designated",
    babyChange: tags.changing_table === "yes",
    is24h,
    category,
  };
}

async function fetchOverpass(): Promise<Restroom[]> {
  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const res = await fetch(mirror, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(OVERPASS_QUERY)}`,
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
      });
      if (!res.ok) continue;
      const json = await res.json() as { elements?: OsmElement[] };
      const results = (json.elements ?? [])
        .map((el, i) => osmToRestroom(el, i))
        .filter((r): r is Restroom => r !== null);
      if (results.length > 10) {
        console.log(`[WCMap OSM] ${results.length} nodes from ${mirror}`);
        return results;
      }
    } catch (e) {
      console.warn(`[WCMap OSM] mirror ${mirror} failed:`, (e as Error).message);
    }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────
// 2. Taiwan Ministry of Environment (環保部 data.moenv.gov.tw)
// ─────────────────────────────────────────────────────────────────
const MOENV_URLS = [
  "https://data.moenv.gov.tw/api/v2/ep0043?limit=2000&offset=0",
  "https://data.moenv.gov.tw/api/v2/ep0043?limit=1000",
  // fallback with common public key used in open data demos
  "https://data.moenv.gov.tw/api/v2/ep0043?api_key=e8dd42e6-9b8b-43f8-991e-b3dee723a52a&limit=2000",
];

async function fetchMoenv(): Promise<Restroom[]> {
  for (const url of MOENV_URLS) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const records: Record<string, string>[] =
        json?.records ?? json?.result?.records ?? json?.data ?? [];
      if (records.length === 0) continue;
      const results = records
        .map((r, i) => parseGovRecord(r, i, "moenv"))
        .filter((r): r is Restroom => r !== null);
      if (results.length > 20) {
        console.log(`[WCMap MOENV] ${results.length} records`);
        return results;
      }
    } catch { /* try next */ }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────
// 3. City open data APIs (original set)
// ─────────────────────────────────────────────────────────────────
const CITY_APIS = [
  "https://data.gov.tw/api/v2/rest/datastore/301000000A-000454-001?limit=2000",
  "https://data.taipei/api/v1/dataset/37231d8b-584c-4873-a3d2-df8aca79f509?scope=resourceAquire",
  "https://data.taipei/opendata/datalist/apiAccess?scope=resourceAquire&rid=37231d8b-584c-4873-a3d2-df8aca79f509",
  "https://data.ntpc.gov.tw/api/datasets/C3C3AB21-4A61-4B57-8C47-BF5B7DE8F4CA/json?size=1000",
  "https://data.kcg.gov.tw/api/action/datastore_search?resource_id=7ab3d3e7-c5f8-46f5-98c8-e50ac4f96e3a&limit=1000",
  "https://opendata.taichung.gov.tw/api/v1/rest/datastore/9d9a3450-8e1e-4c44-8ac9-75bb9855d570?limit=1000",
  "https://data.tainan.gov.tw/api/action/datastore_search?resource_id=public-toilet&limit=500",
];

async function fetchCityApis(): Promise<Restroom[]> {
  const all: Restroom[] = [];
  await Promise.allSettled(
    CITY_APIS.map(async (url) => {
      try {
        const res = await fetch(url, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return;
        const json = await res.json();
        const records: Record<string, string>[] =
          json?.result?.results ?? json?.result?.records ??
          json?.data?.results ?? json?.records ??
          (Array.isArray(json) ? json : []);
        if (records.length === 0) return;
        const results = records
          .map((r, i) => parseGovRecord(r, i, "city"))
          .filter((r): r is Restroom => r !== null);
        if (results.length > 5) {
          console.log(`[WCMap City] ${results.length} from ${url}`);
          all.push(...results);
        }
      } catch { /* skip */ }
    })
  );
  return all;
}

// ─────────────────────────────────────────────────────────────────
// 4. FamilyMart convenience store API (廁所開放)
// ─────────────────────────────────────────────────────────────────
async function fetchFamilyMart(): Promise<Restroom[]> {
  const urls = [
    "https://api.fami.com.tw/famiService.ashx?method=get_all_store_info",
    "https://api.fami.com.tw/famiService.ashx?method=all_store",
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const stores: Record<string, string>[] =
        json?.data ?? json?.stores ?? (Array.isArray(json) ? json : []);
      if (stores.length === 0) continue;
      const results = stores
        .map((s, i): Restroom | null => {
          const lat = parseFloat(s.py || s.lat || s.latitude || "");
          const lng = parseFloat(s.px || s.lng || s.longitude || "");
          if (isNaN(lat) || isNaN(lng)) return null;
          if (lat < 21.5 || lat > 26.5 || lng < 118 || lng > 122.5) return null;
          return {
            id:        `fami-${s.STORE_NO || s.storeNo || i}`,
            name:      `全家便利商店 ${s.STORE_NAME || s.storeName || ""}`.trim(),
            address:   s.ADDRESS || s.address || "",
            district:  s.AREA || s.county || "",
            lat,
            lng,
            hours:     "全天開放",
            accessible: false,
            babyChange: false,
            is24h:     true,
            category:  "convenience" as RestroomCategory,
            brand:     "FamilyMart",
          };
        })
        .filter((r): r is Restroom => r !== null);
      if (results.length > 100) {
        console.log(`[WCMap FamilyMart] ${results.length} stores`);
        return results;
      }
    } catch { /* skip */ }
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────
// Shared gov-record parser (handles many field naming conventions)
// ─────────────────────────────────────────────────────────────────
function parseGovRecord(
  record: Record<string, string>,
  index: number,
  prefix: string
): Restroom | null {
  const lat = parseFloat(
    record["緯度"] || record["lat"] || record["Latitude"] ||
    record["latitude"] || record["y"] || record["Y"] || ""
  );
  const lng = parseFloat(
    record["經度"] || record["lng"] || record["Longitude"] ||
    record["longitude"] || record["x"] || record["X"] || ""
  );
  if (isNaN(lat) || isNaN(lng)) return null;
  if (lat < 21.5 || lat > 26.5 || lng < 118 || lng > 122.5) return null;

  const hours = record["開放時間"] || record["營業時間"] || record["OpenTime"] || "";
  const accRaw = record["無障礙設施"] || record["殘障廁所"] || record["Accessible"] || "";
  const babyRaw = record["親子廁所"] || record["育嬰設施"] || record["BabyChange"] || "";
  const accessible = accRaw !== "" && accRaw !== "無" && accRaw !== "否" && accRaw !== "0";
  const babyChange = babyRaw !== "" && babyRaw !== "無" && babyRaw !== "否" && babyRaw !== "0";
  const is24h = hours.includes("24") || hours === "全天開放" || hours === "全天";

  return {
    id:       record["廁所編號"] || record["sn"] || record["id"] || `${prefix}-${index}`,
    name:     record["廁所名稱"] || record["名稱"] || record["Name"] || record["name"] || `公廁 ${index + 1}`,
    address:  record["地址"] || record["廁所地址"] || record["Address"] || record["address"] || "",
    district: record["行政區"] || record["city"] || record["County"] || record["county"] || "",
    lat,
    lng,
    hours:    hours || "資訊未提供",
    accessible,
    babyChange,
    is24h,
    category: "public" as RestroomCategory,
  };
}

// ─────────────────────────────────────────────────────────────────
// Fallback curated dataset (19 counties, all venue types)
// ─────────────────────────────────────────────────────────────────
const FALLBACK_RESTROOMS: Restroom[] = [
  // ══ 台北市 Taipei ══════════════════════════════════════════
  { id: "tp1",  category: "public",      name: "台北車站公廁",         address: "中正區北平西路3號",       district: "台北市中正區", lat: 25.0478, lng: 121.5171, hours: "06:00-22:00", accessible: true,  babyChange: true,  is24h: false },
  { id: "tp2",  category: "public",      name: "大安森林公園廁所",      address: "大安區新生南路二段1號",   district: "台北市大安區", lat: 25.0297, lng: 121.5353, hours: "全天開放",    accessible: true,  babyChange: false, is24h: true  },
  { id: "tp3",  category: "public",      name: "士林夜市公廁",          address: "士林區基河路101號",       district: "台北市士林區", lat: 25.0877, lng: 121.5239, hours: "10:00-02:00", accessible: false, babyChange: false, is24h: false },
  { id: "tp4",  category: "public",      name: "龍山寺公廁",            address: "萬華區廣州街211號",       district: "台北市萬華區", lat: 25.0373, lng: 121.4998, hours: "全天開放",    accessible: true,  babyChange: true,  is24h: true  },
  { id: "tp5",  category: "public",      name: "象山步道廁所",          address: "信義區信義路五段150巷",   district: "台北市信義區", lat: 25.0274, lng: 121.5774, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "tp6",  category: "public",      name: "北投溫泉公廁",          address: "北投區中山路6號",         district: "台北市北投區", lat: 25.1367, lng: 121.5060, hours: "06:00-22:00", accessible: true,  babyChange: true,  is24h: false },
  { id: "tp7",  category: "mrt",  brand: "台北捷運", name: "西門站廁所",  address: "萬華區漢中街",          district: "台北市萬華區", lat: 25.0423, lng: 121.5082, hours: "06:00-24:00", accessible: true,  babyChange: false, is24h: false },
  { id: "tp8",  category: "mrt",  brand: "台北捷運", name: "中山站廁所",  address: "中山區南京西路16號",    district: "台北市中山區", lat: 25.0524, lng: 121.5218, hours: "06:00-24:00", accessible: true,  babyChange: false, is24h: false },
  { id: "tp9",  category: "department", brand: "台北101", name: "台北101廁所", address: "信義區市府路45號", district: "台北市信義區", lat: 25.0337, lng: 121.5645, hours: "11:00-21:30", accessible: true,  babyChange: true,  is24h: false },
  { id: "tp10", category: "fastfood",   brand: "McDonald's", name: "麥當勞 西門旗艦店", address: "萬華區漢中街116號", district: "台北市萬華區", lat: 25.0432, lng: 121.5063, hours: "全天開放", accessible: true, babyChange: false, is24h: true },
  { id: "tp11", category: "cafe",       brand: "Starbucks",  name: "星巴克 信義旗艦店", address: "信義區松高路11號",  district: "台北市信義區", lat: 25.0358, lng: 121.5673, hours: "07:00-22:00", accessible: true, babyChange: false, is24h: false },
  { id: "tp12", category: "convenience",brand: "7-ELEVEN",   name: "7-ELEVEN 信義門市", address: "信義區松壽路9號",   district: "台北市信義區", lat: 25.0365, lng: 121.5674, hours: "全天開放", accessible: false, babyChange: false, is24h: true },

  // ══ 新北市 New Taipei ══════════════════════════════════════
  { id: "nt1", category: "public",      name: "板橋車站公廁",     address: "板橋區縣民大道一段1號",   district: "新北市板橋區", lat: 25.0143, lng: 121.4638, hours: "06:00-22:00", accessible: true,  babyChange: true,  is24h: false },
  { id: "nt2", category: "public",      name: "淡水老街公廁",     address: "淡水區中正路68號",        district: "新北市淡水區", lat: 25.1730, lng: 121.4384, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "nt3", category: "public",      name: "九份老街公廁",     address: "瑞芳區基山街",            district: "新北市瑞芳區", lat: 25.1091, lng: 121.8443, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "nt4", category: "public",      name: "三峽老街公廁",     address: "三峽區民權街",            district: "新北市三峽區", lat: 24.9348, lng: 121.3703, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "nt5", category: "mrt",  brand: "新北捷運", name: "新店區公所站廁所", address: "新店區北新路三段", district: "新北市新店區", lat: 24.9726, lng: 121.5415, hours: "06:00-24:00", accessible: true, babyChange: false, is24h: false },
  { id: "nt6", category: "department",  brand: "新光三越", name: "新光三越 新莊店", address: "新莊區化成路235號", district: "新北市新莊區", lat: 25.0367, lng: 121.4451, hours: "11:00-21:30", accessible: true, babyChange: true, is24h: false },
  { id: "nt7", category: "fastfood",    brand: "McDonald's", name: "麥當勞 板橋文化店", address: "板橋區文化路一段188號", district: "新北市板橋區", lat: 25.0106, lng: 121.4590, hours: "全天開放", accessible: false, babyChange: false, is24h: true },

  // ══ 桃園市 Taoyuan ═════════════════════════════════════════
  { id: "ty1", category: "public",      name: "桃園火車站廁所",   address: "桃園區中正路1號",    district: "桃園市桃園區", lat: 24.9892, lng: 121.3127, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "ty2", category: "public",      name: "中壢車站公廁",     address: "中壢區站前路1號",    district: "桃園市中壢區", lat: 24.9537, lng: 121.2254, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "ty3", category: "public",      name: "大溪老街公廁",     address: "大溪區和平路",       district: "桃園市大溪區", lat: 24.8850, lng: 121.2881, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "ty4", category: "mrt",  brand: "桃園捷運", name: "桃園高鐵站廁所", address: "中壢區高鐵北路一段6號", district: "桃園市中壢區", lat: 24.9777, lng: 121.2164, hours: "06:00-24:00", accessible: true, babyChange: true, is24h: false },

  // ══ 新竹 Hsinchu ═══════════════════════════════════════════
  { id: "hc1", category: "public", name: "新竹火車站公廁",   address: "新竹市東區中山路1號", district: "新竹市東區",   lat: 24.8018, lng: 120.9718, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "hc2", category: "public", name: "城隍廟公廁",       address: "新竹市北區中山路75號",district: "新竹市北區",   lat: 24.8073, lng: 120.9663, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "hc3", category: "public", name: "內灣老街公廁",     address: "橫山鄉內灣村內灣街", district: "新竹縣橫山鄉", lat: 24.6284, lng: 121.1691, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 台中市 Taichung ════════════════════════════════════════
  { id: "tc1",  category: "public",      name: "台中車站公廁",       address: "中區建國路172號",          district: "台中市中區",   lat: 24.1381, lng: 120.6868, hours: "06:00-22:00", accessible: true,  babyChange: true,  is24h: false },
  { id: "tc2",  category: "public",      name: "逢甲夜市公廁",       address: "西屯區逢甲路",             district: "台中市西屯區", lat: 24.1794, lng: 120.6471, hours: "16:00-02:00", accessible: false, babyChange: false, is24h: false },
  { id: "tc3",  category: "public",      name: "台中公園廁所",       address: "北區公園路37號",           district: "台中市北區",   lat: 24.1492, lng: 120.6823, hours: "全天開放",    accessible: true,  babyChange: false, is24h: true  },
  { id: "tc4",  category: "public",      name: "高美濕地公廁",       address: "清水區高美野生動物保護區", district: "台中市清水區", lat: 24.3105, lng: 120.5392, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "tc5",  category: "mrt",  brand: "台中捷運", name: "台中捷運高鐵台中站", address: "烏日區站區路5號", district: "台中市烏日區", lat: 24.0669, lng: 120.6845, hours: "06:00-24:00", accessible: true, babyChange: true, is24h: false },
  { id: "tc6",  category: "department",  brand: "新光三越", name: "新光三越 台中中港店", address: "西屯區台灣大道三段301號", district: "台中市西屯區", lat: 24.1639, lng: 120.6450, hours: "11:00-21:30", accessible: true, babyChange: true, is24h: false },

  // ══ 彰化 Changhua ══════════════════════════════════════════
  { id: "ch1", category: "public", name: "彰化車站公廁",     address: "彰化市站前路2號",   district: "彰化縣彰化市", lat: 24.0806, lng: 120.5376, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "ch2", category: "public", name: "彰化八卦山大佛廁所",address: "彰化市彰化縣定古蹟",district: "彰化縣彰化市", lat: 24.0836, lng: 120.5537, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 雲林 Yunlin ════════════════════════════════════════════
  { id: "yl1", category: "public", name: "斗六火車站公廁",   address: "斗六市中山路10號",   district: "雲林縣斗六市", lat: 23.7097, lng: 120.5441, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "yl2", category: "public", name: "北港朝天宮公廁",   address: "北港鎮中山路178號",  district: "雲林縣北港鎮", lat: 23.5735, lng: 120.3010, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 嘉義 Chiayi ════════════════════════════════════════════
  { id: "cy1", category: "public", name: "嘉義車站公廁",       address: "嘉義市西區中山路528號",        district: "嘉義市西區",   lat: 23.4793, lng: 120.4513, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "cy2", category: "public", name: "阿里山國家森林遊樂區廁所", address: "番路鄉阿里山鄉中正村10號", district: "嘉義縣阿里山鄉", lat: 23.5096, lng: 120.8041, hours: "全天開放", accessible: false, babyChange: false, is24h: true },
  { id: "cy3", category: "public", name: "文化路夜市公廁",     address: "嘉義市東區文化路",             district: "嘉義市東區",   lat: 23.4810, lng: 120.4521, hours: "17:00-01:00", accessible: false, babyChange: false, is24h: false },

  // ══ 台南市 Tainan ══════════════════════════════════════════
  { id: "tn1", category: "public",     name: "台南火車站公廁",   address: "東區成功路4號",         district: "台南市東區",   lat: 22.9972, lng: 120.2120, hours: "06:00-22:00", accessible: true,  babyChange: true,  is24h: false },
  { id: "tn2", category: "public",     name: "赤崁樓公廁",       address: "中西區民族路二段212號", district: "台南市中西區", lat: 22.9962, lng: 120.2030, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "tn3", category: "public",     name: "安平古堡公廁",     address: "安平區國勝路82號",      district: "台南市安平區", lat: 22.9907, lng: 120.1606, hours: "全天開放",    accessible: true,  babyChange: false, is24h: true  },
  { id: "tn4", category: "public",     name: "花園夜市公廁",     address: "北區海安路三段",        district: "台南市北區",   lat: 23.0303, lng: 120.2009, hours: "週四六日 17:00-01:00", accessible: false, babyChange: false, is24h: false },
  { id: "tn5", category: "mrt", brand: "台鐵", name: "台南高鐵站廁所", address: "歸仁區高鐵路二段88號", district: "台南市歸仁區", lat: 22.9290, lng: 120.2624, hours: "06:00-22:30", accessible: true, babyChange: true, is24h: false },
  { id: "tn6", category: "department", brand: "新光三越", name: "新光三越 台南西門店", address: "中西區西門路一段658號", district: "台南市中西區", lat: 22.9985, lng: 120.2013, hours: "11:00-21:30", accessible: true, babyChange: true, is24h: false },

  // ══ 高雄市 Kaohsiung ═══════════════════════════════════════
  { id: "ks1",  category: "public",      name: "高雄火車站公廁",  address: "三民區建國二路318號",   district: "高雄市三民區", lat: 22.6396, lng: 120.3016, hours: "06:00-22:00", accessible: true,  babyChange: true,  is24h: false },
  { id: "ks2",  category: "public",      name: "六合夜市公廁",    address: "新興區六合二路",        district: "高雄市新興區", lat: 22.6299, lng: 120.3054, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "ks3",  category: "public",      name: "駁二藝術特區廁所",address: "鹽埕區大勇路1號",       district: "高雄市鹽埕區", lat: 22.6247, lng: 120.2803, hours: "10:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "ks4",  category: "public",      name: "旗津渡輪碼頭公廁",address: "旗津區廟前路24號",      district: "高雄市旗津區", lat: 22.6103, lng: 120.2673, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "ks5",  category: "public",      name: "西子灣公廁",      address: "鼓山區蓮海路",          district: "高雄市鼓山區", lat: 22.6297, lng: 120.2597, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "ks6",  category: "mrt", brand: "高雄捷運", name: "美麗島站廁所", address: "新興區中山一路115號", district: "高雄市新興區", lat: 22.6271, lng: 120.3012, hours: "06:00-24:00", accessible: true, babyChange: true, is24h: false },
  { id: "ks7",  category: "mrt", brand: "高雄捷運", name: "高雄車站廁所", address: "三民區建國二路318號",  district: "高雄市三民區", lat: 22.6397, lng: 120.3019, hours: "06:00-24:00", accessible: true, babyChange: false, is24h: false },
  { id: "ks8",  category: "department",  brand: "漢神巨蛋", name: "漢神巨蛋廁所", address: "左營區博愛二路777號", district: "高雄市左營區", lat: 22.6834, lng: 120.2958, hours: "11:00-22:00", accessible: true, babyChange: true, is24h: false },
  { id: "ks9",  category: "fastfood",    brand: "McDonald's", name: "麥當勞 高雄火車站店", address: "三民區建國二路336號", district: "高雄市三民區", lat: 22.6393, lng: 120.3018, hours: "全天開放", accessible: false, babyChange: false, is24h: true },

  // ══ 屏東 Pingtung ══════════════════════════════════════════
  { id: "pt1", category: "public", name: "屏東火車站公廁", address: "屏東市自由路28號",    district: "屏東縣屏東市", lat: 22.6686, lng: 120.4877, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "pt2", category: "public", name: "墾丁大街公廁",   address: "恆春鎮墾丁路",        district: "屏東縣恆春鎮", lat: 21.9451, lng: 120.8097, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "pt3", category: "public", name: "海生館廁所",     address: "車城鄉後灣路2號",     district: "屏東縣車城鄉", lat: 21.9284, lng: 120.7433, hours: "09:00-18:00", accessible: true,  babyChange: true,  is24h: false },

  // ══ 宜蘭 Yilan ═════════════════════════════════════════════
  { id: "il1", category: "public", name: "宜蘭車站公廁",   address: "宜蘭市站前北路1號",  district: "宜蘭縣宜蘭市", lat: 24.7521, lng: 121.7534, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "il2", category: "public", name: "礁溪溫泉公廁",   address: "礁溪鄉礁溪路五段",   district: "宜蘭縣礁溪鄉", lat: 24.8266, lng: 121.7723, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "il3", category: "public", name: "羅東夜市公廁",   address: "羅東鎮興東路",       district: "宜蘭縣羅東鎮", lat: 24.6773, lng: 121.7707, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 花蓮 Hualien ═══════════════════════════════════════════
  { id: "hl1", category: "public", name: "花蓮車站公廁",     address: "花蓮市國聯一路100號",    district: "花蓮縣花蓮市", lat: 23.9912, lng: 121.6015, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "hl2", category: "public", name: "太魯閣國家公園廁所",address: "秀林鄉富世村富世291號", district: "花蓮縣秀林鄉", lat: 24.1586, lng: 121.6213, hours: "全天開放",    accessible: true,  babyChange: false, is24h: true  },
  { id: "hl3", category: "public", name: "七星潭公廁",       address: "新城鄉七星街181號",      district: "花蓮縣新城鄉", lat: 24.0555, lng: 121.6432, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 台東 Taitung ═══════════════════════════════════════════
  { id: "tt1", category: "public", name: "台東車站公廁",   address: "台東市博愛路275號",  district: "台東縣台東市", lat: 22.7528, lng: 121.1474, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "tt2", category: "public", name: "知本溫泉公廁",   address: "卑南鄉溫泉路",       district: "台東縣卑南鄉", lat: 22.6789, lng: 121.0052, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "tt3", category: "public", name: "三仙台公廁",     address: "成功鎮基翬路74號",   district: "台東縣成功鎮", lat: 23.1242, lng: 121.4171, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 基隆 Keelung ═══════════════════════════════════════════
  { id: "kl1", category: "public", name: "基隆火車站公廁", address: "仁愛區義一路1號",    district: "基隆市仁愛區", lat: 25.1310, lng: 121.7392, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "kl2", category: "public", name: "廟口夜市公廁",   address: "仁愛區仁三路27-2號", district: "基隆市仁愛區", lat: 25.1282, lng: 121.7405, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "kl3", category: "public", name: "和平島公廁",     address: "中正區平一路360號",  district: "基隆市中正區", lat: 25.1525, lng: 121.7744, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 苗栗 Miaoli ════════════════════════════════════════════
  { id: "ml1", category: "public", name: "苗栗火車站公廁", address: "苗栗市站前廣場1號",  district: "苗栗縣苗栗市", lat: 24.5634, lng: 120.8214, hours: "06:00-22:00", accessible: true,  babyChange: false, is24h: false },
  { id: "ml2", category: "public", name: "三義老街公廁",   address: "三義鄉中正路",       district: "苗栗縣三義鄉", lat: 24.3968, lng: 120.7572, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 南投 Nantou ════════════════════════════════════════════
  { id: "nt_1", category: "public", name: "日月潭向山廁所", address: "魚池鄉中山路599號",   district: "南投縣魚池鄉", lat: 23.8651, lng: 120.9173, hours: "全天開放",    accessible: true,  babyChange: false, is24h: true  },
  { id: "nt_2", category: "public", name: "清境農場公廁",   address: "仁愛鄉仁和路170號",   district: "南投縣仁愛鄉", lat: 24.0524, lng: 121.1640, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "nt_3", category: "public", name: "集集火車站廁所", address: "集集鎮民生路1號",     district: "南投縣集集鎮", lat: 23.8359, lng: 120.7898, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 澎湖 Penghu ════════════════════════════════════════════
  { id: "ph1", category: "public", name: "馬公漁港公廁",   address: "馬公市臨海路",   district: "澎湖縣馬公市", lat: 23.5608, lng: 119.5632, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "ph2", category: "public", name: "澎湖中央老街公廁",address: "馬公市中正路",   district: "澎湖縣馬公市", lat: 23.5661, lng: 119.5649, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },

  // ══ 金門 Kinmen ════════════════════════════════════════════
  { id: "km1", category: "public",      name: "金城老街公廁",    address: "金城鎮民族路",     district: "金門縣金城鎮", lat: 24.4335, lng: 118.3167, hours: "全天開放",    accessible: false, babyChange: false, is24h: true  },
  { id: "km2", category: "convenience", brand: "7-ELEVEN", name: "7-ELEVEN 金城門市", address: "金城鎮民族路58號", district: "金門縣金城鎮", lat: 24.4341, lng: 118.3172, hours: "全天開放", accessible: false, babyChange: false, is24h: true },
];

// ─────────────────────────────────────────────────────────────────
// Merge & deduplicate by ID
// ─────────────────────────────────────────────────────────────────
function mergeUnique(...arrays: Restroom[][]): Restroom[] {
  const seen = new Set<string>();
  const result: Restroom[] = [];
  for (const arr of arrays) {
    for (const r of arr) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        result.push(r);
      }
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────
export async function GET() {
  // Run all live sources in parallel
  const [osmResults, moenvResults, cityResults, famiResults] =
    await Promise.all([
      fetchOverpass(),
      fetchMoenv(),
      fetchCityApis(),
      fetchFamilyMart(),
    ]);

  const liveTotal = osmResults.length + moenvResults.length +
                    cityResults.length + famiResults.length;

  if (liveTotal > 20) {
    // Merge all live data + curated commercial fallback (for brands not in OSM)
    const commercialFallback = FALLBACK_RESTROOMS.filter(r => r.category !== "public");
    const merged = mergeUnique(
      osmResults,
      moenvResults,
      cityResults,
      famiResults,
      commercialFallback,
    );
    console.log(`[WCMap] Serving ${merged.length} total (OSM:${osmResults.length} MOENV:${moenvResults.length} City:${cityResults.length} Fami:${famiResults.length})`);
    return NextResponse.json({
      restrooms: merged,
      source: "api",
      count: merged.length,
      breakdown: {
        osm: osmResults.length,
        moenv: moenvResults.length,
        city: cityResults.length,
        familymart: famiResults.length,
      },
    });
  }

  // Everything failed — serve curated fallback
  console.warn("[WCMap] All APIs failed, using fallback");
  return NextResponse.json({
    restrooms: FALLBACK_RESTROOMS,
    source: "fallback",
    count: FALLBACK_RESTROOMS.length,
  });
}
