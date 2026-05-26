# 台北公廁地圖 WC Map — 專案說明

## 專案簡介
台北市公共廁所查詢網頁應用程式。使用 Next.js 14 + Leaflet.js 建構，可在地圖上顯示台北各區廁所位置、支援定位與路線導航。

## 專案路徑
```
/Users/macintosh/Documents/Claude/Projects/WCMAP/wc-map/
```

## 啟動方式
```bash
cd /Users/macintosh/Documents/Claude/Projects/WCMAP/wc-map
npm run dev
# → http://localhost:3000
```

> Node.js 安裝於 `/usr/local/bin/node`（v26），需在指令前加 `export PATH="/usr/local/bin:$PATH"`

## 技術堆疊
| 項目 | 版本／說明 |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| 地圖 | Leaflet 1.9.4 + react-leaflet 4.2 |
| 樣式 | Tailwind CSS 3.4（所有互動元件改用 inline style 確保穩定） |
| 語言 | TypeScript 5 |
| 資料 | 台北市政府開放資料 API（無法連線時自動切換 10 筆示範資料）|

## 檔案結構
```
wc-map/
├── app/
│   ├── layout.tsx          # Root layout（含 Leaflet CSS import）
│   ├── page.tsx            # 主頁面：狀態管理、版面配置
│   ├── globals.css         # Tailwind + 脈衝動畫 CSS
│   └── api/restrooms/
│       └── route.ts        # 伺服器端 API proxy（含 fallback 資料）
└── components/
    ├── types.ts            # Restroom、Filters 型別定義
    ├── Map.tsx             # Leaflet 地圖（dynamic import，SSR:false）
    ├── Header.tsx          # 頂部導覽列
    └── Sidebar.tsx         # 篩選面板（支援桌機右側 / 手機底部兩種模式）
```

## 已實作功能
- **全螢幕地圖**：OpenStreetMap 標準圖 / CartoDB Positron 簡化圖（可切換）
- **🚻 廁所標記**：大型水滴形圖釘，點擊開啟 popup
- **Popup 內容**：名稱、地址、開放時間、無障礙/親子/24h 標籤、導航按鈕、回報按鈕
- **📍 我的位置**：GPS 定位，地圖出現脈衝藍點
- **🚻 附近廁所**：定位後找最近 5 間，標記變金色，顯示距離
- **篩選面板**：♿ 無障礙 / 👶 親子 / 🕐 24h 切換開關 + 文字搜尋
- **地圖左上角控制鈕**：
  - 🗺 簡化圖 / 標準圖（底圖切換）
  - 📱 手機版 / 💻 電腦版（版面配置：右側面板 ↔ 底部抽屜）

## 資料來源
```
https://data.taipei/api/v1/dataset/37231d8b-584c-4873-a3d2-df8aca79f509?scope=resourceAquire
```
- Fallback：`app/api/restrooms/route.ts` 內 10 筆涵蓋各行政區的示範資料

## 待辦 / 可延伸
- [ ] 串接真實 Taipei Open Data API（目前返回空陣列，待確認欄位名稱）
- [ ] 廁所列表側邊欄（依距離排序）
- [ ] 離線 PWA 支援
- [ ] 多語言（英文、日文）
- [ ] 回報問題接真實 Google Form

## 重要注意事項
- **Tailwind 動態 class 問題**：所有需要 JS 狀態控制的動畫／位移，一律改用 inline `style` + JS transform，避免 Tailwind purge 移除動態 class
- **Leaflet SSR**：Map.tsx 必須透過 `dynamic(..., { ssr: false })` 載入，否則 SSR 時找不到 `window`
- **next.config**：Next.js 14 不支援 `.ts` 格式，使用 `next.config.mjs`
