// public/admin/ts/tweaks/appearance.ts
var ACCENTS = [
  { label: "Turuncu", value: "#f97316", contrast: "#ffffff" },
  { label: "Kehribar", value: "#f59e0b", contrast: "#241400" },
  { label: "K\u0131rm\u0131z\u0131", value: "#ef4444", contrast: "#ffffff" },
  { label: "Pembe", value: "#ec4899", contrast: "#ffffff" },
  { label: "Mor", value: "#a855f7", contrast: "#ffffff" },
  { label: "\u0130ndigo", value: "#6366f1", contrast: "#ffffff" },
  { label: "Mavi", value: "#3b82f6", contrast: "#ffffff" },
  { label: "Camg\xF6be\u011Fi", value: "#06b6d4", contrast: "#04222a" },
  { label: "Teal", value: "#14b8a6", contrast: "#04231f" },
  { label: "Ye\u015Fil", value: "#10b981", contrast: "#05251b" },
  { label: "Lime", value: "#84cc16", contrast: "#1a2400" },
  { label: "Arduvaz", value: "#64748b", contrast: "#ffffff" }
];
var FONTS = [
  { id: "Manrope", label: "Manrope", stack: '"Manrope", system-ui, sans-serif' },
  { id: "Inter", label: "Inter", stack: '"Inter", system-ui, sans-serif' },
  { id: "Plus Jakarta Sans", label: "Jakarta", stack: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { id: "Sistem", label: "Sistem", stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' }
];
var DEFAULTS = {
  theme: "dark",
  contrast: "normal",
  accent: "#f97316",
  glow: "on",
  tint: "off",
  font: "Manrope",
  uiScale: 100,
  weight: "normal",
  tracking: "normal",
  density: "comfortable",
  radius: "soft",
  cwidth: "full",
  cards: "elevated",
  shadows: "on",
  glass: "on",
  bg: "glow",
  focusring: "glow",
  tstripe: "off",
  thover: "on",
  tlines: "horizontal",
  motion: "full",
  underline: "off"
};
var ATTR = {
  contrast: "data-contrast",
  glow: "data-glow",
  tint: "data-tint",
  weight: "data-weight",
  tracking: "data-tracking",
  density: "data-density",
  radius: "data-radius",
  cwidth: "data-cwidth",
  cards: "data-cards",
  shadows: "data-shadows",
  glass: "data-glass",
  bg: "data-bg",
  focusring: "data-focusring",
  tstripe: "data-tstripe",
  thover: "data-thover",
  tlines: "data-tlines",
  motion: "data-motion",
  underline: "data-underline"
};
var STORAGE_KEY = "pdks_admin_appearance";
var OPTS = {
  theme: [{ val: "dark", label: "Koyu" }, { val: "light", label: "A\xE7\u0131k" }, { val: "auto", label: "Oto" }],
  contrast: [{ val: "normal", label: "Normal" }, { val: "high", label: "Y\xFCksek" }],
  glow: [{ val: "off", label: "Kapal\u0131" }, { val: "on", label: "Normal" }, { val: "strong", label: "G\xFC\xE7l\xFC" }],
  font: FONTS.map((f) => ({ val: f.id, label: f.label })),
  weight: [{ val: "light", label: "\u0130nce" }, { val: "normal", label: "Normal" }, { val: "bold", label: "Kal\u0131n" }],
  tracking: [{ val: "tight", label: "S\u0131k" }, { val: "normal", label: "Normal" }, { val: "wide", label: "Geni\u015F" }],
  density: [{ val: "comfortable", label: "Ferah" }, { val: "normal", label: "Normal" }, { val: "compact", label: "Kompakt" }],
  radius: [{ val: "soft", label: "Yumu\u015Fak" }, { val: "md", label: "Orta" }, { val: "sharp", label: "Keskin" }],
  cwidth: [{ val: "narrow", label: "Dar" }, { val: "normal", label: "Orta" }, { val: "wide", label: "Geni\u015F" }, { val: "full", label: "Tam" }],
  cards: [{ val: "elevated", label: "G\xF6lgeli" }, { val: "flat", label: "D\xFCz" }, { val: "outlined", label: "\xC7er\xE7eve" }],
  bg: [{ val: "none", label: "Yok" }, { val: "glow", label: "Parlama" }, { val: "glow-accent", label: "Renkli" }, { val: "grid", label: "Izgara" }, { val: "dots", label: "Nokta" }],
  focusring: [{ val: "glow", label: "Parlak" }, { val: "thin", label: "\u0130nce" }, { val: "off", label: "Kapal\u0131" }],
  tlines: [{ val: "horizontal", label: "Yatay" }, { val: "all", label: "T\xFCm\xFC" }, { val: "none", label: "Yok" }],
  motion: [{ val: "full", label: "Tam" }, { val: "reduced", label: "Azalt" }]
};
var current = loadFromStorage();
function loadFromStorage() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}
function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
  }
}
function resolveTheme(theme) {
  if (theme !== "auto") return theme;
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  return mql?.matches ? "dark" : "light";
}
function applyAppearance(state = current) {
  const html = document.documentElement;
  Object.keys(ATTR).forEach((key) => {
    const attr = ATTR[key];
    html.setAttribute(attr, String(state[key] ?? DEFAULTS[key]));
  });
  html.setAttribute("data-theme", resolveTheme(state.theme));
  html.style.setProperty("--ui-scale", String((Number(state.uiScale) || 100) / 100));
  const accent = ACCENTS.find((a) => a.value.toLowerCase() === String(state.accent).toLowerCase()) ?? ACCENTS[0];
  html.style.setProperty("--accent", accent.value);
  html.style.setProperty("--accent-contrast", accent.contrast);
  const font = FONTS.find((f) => f.id === state.font) ?? FONTS[0];
  html.style.setProperty("--font-sans", font.stack);
  html.style.setProperty("--font-num", font.stack);
}
function getAppearance() {
  return current;
}
function setAppearance(patch) {
  current = { ...current, ...patch };
  applyAppearance(current);
  persist();
}
function resetAppearance() {
  current = { ...DEFAULTS };
  applyAppearance(current);
  persist();
}
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (current.theme === "auto") applyAppearance(current);
  });
}

export {
  ACCENTS,
  OPTS,
  applyAppearance,
  getAppearance,
  setAppearance,
  resetAppearance
};
//# sourceMappingURL=chunk-QI5RVIRR.js.map
