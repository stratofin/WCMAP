export type Lang = "zh" | "en";

export const t = {
  zh: {
    // App
    appName: "台北公廁地圖",
    appSub: "Taipei WC Map",

    // Header / BottomBar buttons
    myLocation: "我的位置",
    located: "已定位",
    nearby: "附近廁所",
    nearestN: (n: number) => `最近 ${n} 間`,
    filter: "篩選",
    close: "關閉",
    locating: "定位中",

    // Language toggle
    langToggle: "EN",

    // Sidebar
    searchPlaceholder: "搜尋名稱、地址、行政區...",
    filterTitle: "篩選條件",
    accessible: "無障礙廁所",
    babyChange: "親子廁所",
    is24h: "24 小時開放",
    categoryTitle: "地點類型",
    catAll: "全部",
    catPublic: "公廁",
    catConvenience: "便利商店",
    catCafe: "咖啡廳",
    catFastFood: "速食店",
    catMrt: "捷運站",
    catDepartment: "百貨公司",
    showingN: (n: number, total: number) => `顯示 ${n} / ${total} 間`,
    clearFilters: "清除篩選",

    // Map popup
    navigate: "導航",
    report: "回報問題",
    accessibleBadge: "♿ 無障礙",
    babyBadge: "🍼 親子",
    tfBadge: "🕐 24h",
    youAreHere: "📍 你在這裡",
    distanceM: (m: number) => `${m} 公尺`,
    distanceKm: (km: string) => `${km} 公里`,
    ratingLabel: "評分",
    ratingsCount: (n: number) => `(${n} 則評價)`,
    writeComment: "留下評語...",
    submitRating: "送出評分",
    thankYou: "感謝回饋！",
    loginToRate: "請登入後評分",

    // Loading
    mapLoading: "地圖載入中...",
    dataLoading: "載入台北公廁資料...",
    fallbackBadge: "⚠ 示範資料（API暫時無法連線）",

    // Geo errors
    geoNotSupported: "此瀏覽器不支援定位功能",
    geoFailed: "定位失敗，請確認已允許位置權限",

    // Map tile toggle
    simplifiedMap: "簡化圖",
    standardMap: "標準圖",
    toSimplified: "切換為簡化地圖",
    toStandard: "切換回詳細地圖",

    // Hours
    open24h: "24小時",
    hours: "開放時間",
  },

  en: {
    // App
    appName: "Taipei WC Map",
    appSub: "台北公廁地圖",

    // Header / BottomBar buttons
    myLocation: "My Location",
    located: "Located",
    nearby: "Nearby WC",
    nearestN: (n: number) => `Nearest ${n}`,
    filter: "Filter",
    close: "Close",
    locating: "Locating",

    // Language toggle
    langToggle: "中",

    // Sidebar
    searchPlaceholder: "Search name, address, district...",
    filterTitle: "Filters",
    accessible: "Accessible",
    babyChange: "Baby Change",
    is24h: "Open 24h",
    categoryTitle: "Place Type",
    catAll: "All",
    catPublic: "Public WC",
    catConvenience: "Convenience Store",
    catCafe: "Café",
    catFastFood: "Fast Food",
    catMrt: "MRT Station",
    catDepartment: "Department Store",
    showingN: (n: number, total: number) => `Showing ${n} of ${total}`,
    clearFilters: "Clear Filters",

    // Map popup
    navigate: "Navigate",
    report: "Report Issue",
    accessibleBadge: "♿ Accessible",
    babyBadge: "🍼 Baby Change",
    tfBadge: "🕐 24h",
    youAreHere: "📍 You are here",
    distanceM: (m: number) => `${m} m`,
    distanceKm: (km: string) => `${km} km`,
    ratingLabel: "Rating",
    ratingsCount: (n: number) => `(${n} reviews)`,
    writeComment: "Write a comment...",
    submitRating: "Submit",
    thankYou: "Thank you!",
    loginToRate: "Sign in to rate",

    // Loading
    mapLoading: "Loading map...",
    dataLoading: "Loading Taipei WC data...",
    fallbackBadge: "⚠ Demo data (API unavailable)",

    // Geo errors
    geoNotSupported: "Geolocation not supported",
    geoFailed: "Location failed. Please allow location access.",

    // Map tile toggle
    simplifiedMap: "Simple",
    standardMap: "Standard",
    toSimplified: "Switch to simple map",
    toStandard: "Switch to standard map",

    // Hours
    open24h: "24 Hours",
    hours: "Hours",
  },
} as const;

// Looser type so both zh and en satisfy it
export type Translations = {
  [K in keyof typeof t.zh]: (typeof t.zh)[K] extends (...args: infer A) => string
    ? (...args: A) => string
    : string;
};
