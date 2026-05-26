import { NextResponse } from "next/server";
import type { Restroom } from "@/components/types";

const FALLBACK_RESTROOMS: Restroom[] = [
  {
    id: "f1",
    name: "台北車站公共廁所",
    address: "中正區北平西路3號",
    district: "中正區",
    lat: 25.0478,
    lng: 121.5171,
    hours: "06:00-22:00",
    accessible: true,
    babyChange: true,
    is24h: false,
  },
  {
    id: "f2",
    name: "大安森林公園廁所",
    address: "大安區新生南路二段1號",
    district: "大安區",
    lat: 25.0297,
    lng: 121.5353,
    hours: "全天開放",
    accessible: true,
    babyChange: false,
    is24h: true,
  },
  {
    id: "f3",
    name: "士林夜市公廁",
    address: "士林區基河路101號",
    district: "士林區",
    lat: 25.0877,
    lng: 121.5239,
    hours: "10:00-02:00",
    accessible: false,
    babyChange: false,
    is24h: false,
  },
  {
    id: "f4",
    name: "象山親山步道廁所",
    address: "信義區信義路五段150巷",
    district: "信義區",
    lat: 25.0274,
    lng: 121.5774,
    hours: "全天開放",
    accessible: false,
    babyChange: false,
    is24h: true,
  },
  {
    id: "f5",
    name: "松山文創園區廁所",
    address: "信義區光復南路133號",
    district: "信義區",
    lat: 25.0438,
    lng: 121.5602,
    hours: "09:00-22:00",
    accessible: true,
    babyChange: true,
    is24h: false,
  },
  {
    id: "f6",
    name: "中山捷運站廁所",
    address: "中山區南京西路16號",
    district: "中山區",
    lat: 25.0524,
    lng: 121.5218,
    hours: "06:00-24:00",
    accessible: true,
    babyChange: false,
    is24h: false,
  },
  {
    id: "f7",
    name: "龍山寺公廁",
    address: "萬華區廣州街211號",
    district: "萬華區",
    lat: 25.0373,
    lng: 121.4998,
    hours: "全天開放",
    accessible: true,
    babyChange: true,
    is24h: true,
  },
  {
    id: "f8",
    name: "內湖科技園區公廁",
    address: "內湖區瑞光路513巷",
    district: "內湖區",
    lat: 25.0807,
    lng: 121.5800,
    hours: "08:00-20:00",
    accessible: true,
    babyChange: false,
    is24h: false,
  },
  {
    id: "f9",
    name: "文山木柵公廁",
    address: "文山區木柵路一段46號",
    district: "文山區",
    lat: 24.9978,
    lng: 121.5609,
    hours: "全天開放",
    accessible: false,
    babyChange: false,
    is24h: true,
  },
  {
    id: "f10",
    name: "北投溫泉公廁",
    address: "北投區中山路6號",
    district: "北投區",
    lat: 25.1367,
    lng: 121.5060,
    hours: "06:00-22:00",
    accessible: true,
    babyChange: true,
    is24h: false,
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

        const restrooms = records
          .map((r, i) => parseApiRecord(r, i))
          .filter((r): r is Restroom => r !== null);

        if (restrooms.length > 0) {
          return NextResponse.json({ restrooms, source: "api" });
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
