import { NextResponse } from "next/server";
import type { Restroom, RestroomCategory } from "@/components/types";

const FALLBACK_RESTROOMS: Restroom[] = [
  // ── 公廁 ────────────────────────────────────────────────
  {
    id: "f1", category: "public",
    name: "台北車站公共廁所",
    address: "中正區北平西路3號", district: "中正區",
    lat: 25.0478, lng: 121.5171, hours: "06:00-22:00",
    accessible: true, babyChange: true, is24h: false,
  },
  {
    id: "f2", category: "public",
    name: "大安森林公園廁所",
    address: "大安區新生南路二段1號", district: "大安區",
    lat: 25.0297, lng: 121.5353, hours: "全天開放",
    accessible: true, babyChange: false, is24h: true,
  },
  {
    id: "f3", category: "public",
    name: "士林夜市公廁",
    address: "士林區基河路101號", district: "士林區",
    lat: 25.0877, lng: 121.5239, hours: "10:00-02:00",
    accessible: false, babyChange: false, is24h: false,
  },
  {
    id: "f4", category: "public",
    name: "象山親山步道廁所",
    address: "信義區信義路五段150巷", district: "信義區",
    lat: 25.0274, lng: 121.5774, hours: "全天開放",
    accessible: false, babyChange: false, is24h: true,
  },
  {
    id: "f5", category: "public",
    name: "松山文創園區廁所",
    address: "信義區光復南路133號", district: "信義區",
    lat: 25.0438, lng: 121.5602, hours: "09:00-22:00",
    accessible: true, babyChange: true, is24h: false,
  },
  {
    id: "f7", category: "public",
    name: "龍山寺公廁",
    address: "萬華區廣州街211號", district: "萬華區",
    lat: 25.0373, lng: 121.4998, hours: "全天開放",
    accessible: true, babyChange: true, is24h: true,
  },
  {
    id: "f8", category: "public",
    name: "內湖科技園區公廁",
    address: "內湖區瑞光路513巷", district: "內湖區",
    lat: 25.0807, lng: 121.5800, hours: "08:00-20:00",
    accessible: true, babyChange: false, is24h: false,
  },
  {
    id: "f9", category: "public",
    name: "文山木柵公廁",
    address: "文山區木柵路一段46號", district: "文山區",
    lat: 24.9978, lng: 121.5609, hours: "全天開放",
    accessible: false, babyChange: false, is24h: true,
  },
  {
    id: "f10", category: "public",
    name: "北投溫泉公廁",
    address: "北投區中山路6號", district: "北投區",
    lat: 25.1367, lng: 121.5060, hours: "06:00-22:00",
    accessible: true, babyChange: true, is24h: false,
  },

  // ── 捷運站 MRT ──────────────────────────────────────────
  {
    id: "m1", category: "mrt", brand: "台北捷運",
    name: "中山站廁所（台北捷運）",
    address: "中山區南京西路16號", district: "中山區",
    lat: 25.0524, lng: 121.5218, hours: "06:00-24:00",
    accessible: true, babyChange: false, is24h: false,
  },
  {
    id: "m2", category: "mrt", brand: "台北捷運",
    name: "台北101/世貿站廁所（台北捷運）",
    address: "信義區市府路45號", district: "信義區",
    lat: 25.0338, lng: 121.5645, hours: "06:00-24:00",
    accessible: true, babyChange: true, is24h: false,
  },
  {
    id: "m3", category: "mrt", brand: "台北捷運",
    name: "西門站廁所（台北捷運）",
    address: "萬華區漢中街", district: "萬華區",
    lat: 25.0423, lng: 121.5082, hours: "06:00-24:00",
    accessible: true, babyChange: false, is24h: false,
  },
  {
    id: "m4", category: "mrt", brand: "台北捷運",
    name: "大安站廁所（台北捷運）",
    address: "大安區復興南路一段", district: "大安區",
    lat: 25.0330, lng: 121.5438, hours: "06:00-24:00",
    accessible: true, babyChange: false, is24h: false,
  },
  {
    id: "m5", category: "mrt", brand: "台北捷運",
    name: "士林站廁所（台北捷運）",
    address: "士林區中正路", district: "士林區",
    lat: 25.0935, lng: 121.5261, hours: "06:00-24:00",
    accessible: true, babyChange: false, is24h: false,
  },

  // ── 便利商店 Convenience ─────────────────────────────────
  {
    id: "c1", category: "convenience", brand: "7-ELEVEN",
    name: "7-ELEVEN 信義門市",
    address: "信義區松壽路9號", district: "信義區",
    lat: 25.0365, lng: 121.5674, hours: "全天開放",
    accessible: false, babyChange: false, is24h: true,
  },
  {
    id: "c2", category: "convenience", brand: "FamilyMart",
    name: "全家 忠孝敦化門市",
    address: "大安區忠孝東路四段181號", district: "大安區",
    lat: 25.0416, lng: 121.5503, hours: "全天開放",
    accessible: false, babyChange: false, is24h: true,
  },
  {
    id: "c3", category: "convenience", brand: "7-ELEVEN",
    name: "7-ELEVEN 西門門市",
    address: "萬華區漢中街74號", district: "萬華區",
    lat: 25.0427, lng: 121.5064, hours: "全天開放",
    accessible: false, babyChange: false, is24h: true,
  },
  {
    id: "c4", category: "convenience", brand: "OK mart",
    name: "OK超商 中山北路門市",
    address: "中山區中山北路二段72號", district: "中山區",
    lat: 25.0571, lng: 121.5237, hours: "全天開放",
    accessible: false, babyChange: false, is24h: true,
  },
  {
    id: "c5", category: "convenience", brand: "Hi-Life",
    name: "萊爾富 南京東路門市",
    address: "中山區南京東路二段98號", district: "中山區",
    lat: 25.0524, lng: 121.5320, hours: "全天開放",
    accessible: false, babyChange: false, is24h: true,
  },

  // ── 咖啡廳 Café ──────────────────────────────────────────
  {
    id: "cf1", category: "cafe", brand: "Starbucks",
    name: "星巴克 信義旗艦店",
    address: "信義區松高路11號", district: "信義區",
    lat: 25.0358, lng: 121.5673, hours: "07:00-22:00",
    accessible: true, babyChange: false, is24h: false,
  },
  {
    id: "cf2", category: "cafe", brand: "Starbucks",
    name: "星巴克 台大店",
    address: "大安區羅斯福路三段316號", district: "大安區",
    lat: 25.0176, lng: 121.5341, hours: "07:00-22:30",
    accessible: false, babyChange: false, is24h: false,
  },
  {
    id: "cf3", category: "cafe", brand: "路易莎",
    name: "路易莎咖啡 忠孝新生店",
    address: "大安區忠孝東路三段249號", district: "大安區",
    lat: 25.0426, lng: 121.5378, hours: "07:00-22:00",
    accessible: false, babyChange: false, is24h: false,
  },
  {
    id: "cf4", category: "cafe", brand: "cama café",
    name: "cama café 西門店",
    address: "萬華區峨眉街52號", district: "萬華區",
    lat: 25.0443, lng: 121.5066, hours: "08:00-21:00",
    accessible: false, babyChange: false, is24h: false,
  },
  {
    id: "cf5", category: "cafe", brand: "Starbucks",
    name: "星巴克 中山旗艦店",
    address: "中山區中山北路二段50號", district: "中山區",
    lat: 25.0579, lng: 121.5234, hours: "07:00-22:30",
    accessible: true, babyChange: false, is24h: false,
  },

  // ── 速食店 Fast Food ─────────────────────────────────────
  {
    id: "ff1", category: "fastfood", brand: "McDonald's",
    name: "麥當勞 台北101店",
    address: "信義區市府路45號", district: "信義區",
    lat: 25.0340, lng: 121.5649, hours: "全天開放",
    accessible: true, babyChange: true, is24h: true,
  },
  {
    id: "ff2", category: "fastfood", brand: "McDonald's",
    name: "麥當勞 西門旗艦店",
    address: "萬華區漢中街116號", district: "萬華區",
    lat: 25.0432, lng: 121.5063, hours: "全天開放",
    accessible: true, babyChange: false, is24h: true,
  },
  {
    id: "ff3", category: "fastfood", brand: "KFC",
    name: "肯德基 忠孝店",
    address: "大安區忠孝東路四段170號", district: "大安區",
    lat: 25.0415, lng: 121.5490, hours: "10:00-22:00",
    accessible: false, babyChange: false, is24h: false,
  },
  {
    id: "ff4", category: "fastfood", brand: "Burger King",
    name: "漢堡王 士林店",
    address: "士林區中正路251號", district: "士林區",
    lat: 25.0892, lng: 121.5248, hours: "10:00-23:00",
    accessible: false, babyChange: false, is24h: false,
  },
  {
    id: "ff5", category: "fastfood", brand: "MOS Burger",
    name: "摩斯漢堡 內湖店",
    address: "內湖區成功路四段48號", district: "內湖區",
    lat: 25.0677, lng: 121.5795, hours: "07:00-22:00",
    accessible: false, babyChange: false, is24h: false,
  },

  // ── 百貨公司 Department Stores ───────────────────────────
  {
    id: "d1", category: "department", brand: "SOGO",
    name: "太平洋SOGO百貨 忠孝館",
    address: "大安區忠孝東路四段45號", district: "大安區",
    lat: 25.0416, lng: 121.5459, hours: "11:00-21:30",
    accessible: true, babyChange: true, is24h: false,
  },
  {
    id: "d2", category: "department", brand: "新光三越",
    name: "新光三越 信義新天地A8館",
    address: "信義區松高路19號", district: "信義區",
    lat: 25.0362, lng: 121.5667, hours: "11:00-21:30",
    accessible: true, babyChange: true, is24h: false,
  },
  {
    id: "d3", category: "department", brand: "微風廣場",
    name: "微風廣場",
    address: "松山區復興南路一段39號", district: "松山區",
    lat: 25.0466, lng: 121.5469, hours: "11:00-21:30",
    accessible: true, babyChange: true, is24h: false,
  },
  {
    id: "d4", category: "department", brand: "台北101",
    name: "台北101購物中心",
    address: "信義區市府路45號", district: "信義區",
    lat: 25.0337, lng: 121.5645, hours: "11:00-21:30",
    accessible: true, babyChange: true, is24h: false,
  },
  {
    id: "d5", category: "department", brand: "遠東百貨",
    name: "遠東百貨 板橋店",
    address: "板橋區縣民大道二段8號", district: "板橋區",
    lat: 24.9997, lng: 121.4616, hours: "11:00-21:30",
    accessible: true, babyChange: false, is24h: false,
  },
];

function parseApiRecord(record: Record<string, string>, index: number): Restroom | null {
  const lat = parseFloat(record["緯度"] || record["lat"] || "");
  const lng = parseFloat(record["經度"] || record["lng"] || "");
  if (isNaN(lat) || isNaN(lng)) return null;

  const hours = record["開放時間"] || record["營業時間"] || "";
  const accessible =
    (record["無障礙設施"] || record["殘障廁所"] || "") !== "" &&
    (record["無障礙設施"] || record["殘障廁所"] || "") !== "無" &&
    (record["無障礙設施"] || record["殘障廁所"] || "") !== "否";
  const babyChange =
    (record["親子廁所"] || record["育嬰設施"] || "") !== "" &&
    (record["親子廁所"] || record["育嬰設施"] || "") !== "無" &&
    (record["親子廁所"] || record["育嬰設施"] || "") !== "否";
  const is24h = hours.includes("24") || hours === "全天開放" || hours === "全天";

  return {
    id: record["廁所編號"] || `api-${index}`,
    name: record["廁所名稱"] || record["名稱"] || `公廁 ${index + 1}`,
    address: record["地址"] || record["廁所地址"] || "",
    district: record["行政區"] || "",
    lat,
    lng,
    hours: hours || "資訊未提供",
    accessible,
    babyChange,
    is24h,
    category: "public" as RestroomCategory,
  };
}

export async function GET() {
  try {
    const urls = [
      "https://data.taipei/api/v1/dataset/37231d8b-584c-4873-a3d2-df8aca79f509?scope=resourceAquire",
      "https://data.taipei/opendata/datalist/apiAccess?scope=resourceAquire&rid=37231d8b-584c-4873-a3d2-df8aca79f509",
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url, {
          next: { revalidate: 3600 },
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) continue;

        const json = await res.json();
        const records: Record<string, string>[] =
          json?.result?.results || json?.result?.records || json?.data?.results || [];

        if (records.length === 0) continue;

        const apiRestrooms = records
          .map((r, i) => parseApiRecord(r, i))
          .filter((r): r is Restroom => r !== null);

        if (apiRestrooms.length > 0) {
          // Merge API public restrooms with commercial venues from fallback
          const commercial = FALLBACK_RESTROOMS.filter(r => r.category !== "public");
          return NextResponse.json({ restrooms: [...apiRestrooms, ...commercial], source: "api" });
        }
      } catch {
        // try next URL
      }
    }
  } catch {
    // fall through to fallback
  }

  return NextResponse.json({ restrooms: FALLBACK_RESTROOMS, source: "fallback" });
}
