# 🚻 台北公廁地圖 — Taipei WC Map

台北市公共廁所查詢地圖，手機優先設計，支援 PWA 安裝。

## 功能特色

- 📍 **定位功能** — 顯示目前位置，一鍵找最近 5 間廁所
- 🔍 **搜尋 & 篩選** — 依名稱、行政區、無障礙、親子廁所、24h 篩選
- 🗺 **地圖風格切換** — 標準圖 / 簡化圖
- 📱 **手機優先設計** — 底部導航列，單手操作友善
- 🏠 **可安裝到手機桌面**（PWA）
- 資料來源：[台北市政府開放資料平台](https://data.taipei)

---

## 本機開發

```bash
cd wc-map
npm install
npm run dev
```

開啟 [http://localhost:3000](http://localhost:3000)

---

## 部署到 Vercel

### 方法一：GitHub 自動部署（推薦）

1. **把專案推上 GitHub**
   ```bash
   git init
   git add .
   git commit -m "init: 台北公廁地圖"
   git remote add origin https://github.com/你的帳號/wc-map.git
   git push -u origin main
   ```

2. **連接 Vercel**
   - 前往 [vercel.com](https://vercel.com) → **Add New Project**
   - 選擇剛剛的 GitHub repo
   - Framework 自動偵測為 **Next.js**，直接按 **Deploy** ✅

3. **之後每次 `git push` 自動重新部署**

### 方法二：Vercel CLI

```bash
npm i -g vercel
vercel
```

### 部署注意事項

| 項目 | 說明 |
|------|------|
| ✅ 設定檔 | 不需要 `vercel.json`，Next.js 原生支援 |
| ✅ API | `/api/restrooms` 自動成為 Serverless Function |
| ✅ HTTPS | 自動啟用（定位與 PWA 都需要 HTTPS）|
| ⚠️ 資料 API | 台北市開放資料偶爾不穩，App 有備用示範資料 |

### 手機安裝（PWA）

部署完成後，用手機瀏覽網址：
- **iOS Safari** → 分享 → 加入主畫面
- **Android Chrome** → 選單 → 安裝應用程式

---

## 技術架構

| 項目 | 技術 |
|------|------|
| Framework | Next.js 14 (App Router) |
| 語言 | TypeScript |
| 地圖 | Leaflet + React-Leaflet |
| 樣式 | Tailwind CSS + Inline styles |
| 資料 | 台北市開放資料 API |
| 部署 | Vercel |

## 專案結構

```
wc-map/
├── app/
│   ├── page.tsx              # 主頁面（含手機/桌機版面邏輯）
│   ├── layout.tsx            # PWA meta tags + viewport
│   └── api/restrooms/        # 公廁資料 API Route
├── components/
│   ├── Header.tsx            # 頂部列（桌機版含操作按鈕）
│   ├── BottomBar.tsx         # 手機版底部導航列
│   ├── Sidebar.tsx           # 篩選側欄 / 手機底部抽屜
│   ├── Map.tsx               # Leaflet 地圖元件
│   └── types.ts              # TypeScript 型別定義
└── public/
    ├── manifest.json         # PWA manifest
    ├── icon-192.png          # App 圖示
    └── icon-512.png
```
