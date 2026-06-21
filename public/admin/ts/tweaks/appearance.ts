// Admin paneli "Görünüm" ayarları — admin-panel-preview/js/tweaks.js'in
// localStorage tabanlı TS portu (floating panel ve sidebar durumu hariç;
// kenar çubuğu zaten AdminLayout tarafından ayrı yönetiliyor).

export interface Accent { label: string; value: string; contrast: string; }
export interface FontDef { id: string; label: string; stack: string; }
export interface AppearanceState {
  theme: string; contrast: string;
  accent: string; glow: string; tint: string;
  font: string; uiScale: number; weight: string; tracking: string;
  density: string; radius: string; cwidth: string; cards: string;
  shadows: string; glass: string; bg: string; focusring: string;
  tstripe: string; thover: string; tlines: string;
  motion: string; underline: string;
}

export const ACCENTS: Accent[] = [
  { label: 'Turuncu',   value: '#f97316', contrast: '#ffffff' },
  { label: 'Kehribar',  value: '#f59e0b', contrast: '#241400' },
  { label: 'Kırmızı',   value: '#ef4444', contrast: '#ffffff' },
  { label: 'Pembe',     value: '#ec4899', contrast: '#ffffff' },
  { label: 'Mor',       value: '#a855f7', contrast: '#ffffff' },
  { label: 'İndigo',    value: '#6366f1', contrast: '#ffffff' },
  { label: 'Mavi',      value: '#3b82f6', contrast: '#ffffff' },
  { label: 'Camgöbeği', value: '#06b6d4', contrast: '#04222a' },
  { label: 'Teal',      value: '#14b8a6', contrast: '#04231f' },
  { label: 'Yeşil',     value: '#10b981', contrast: '#05251b' },
  { label: 'Lime',      value: '#84cc16', contrast: '#1a2400' },
  { label: 'Arduvaz',   value: '#64748b', contrast: '#ffffff' },
];

export const FONTS: FontDef[] = [
  { id: 'Manrope',           label: 'Manrope', stack: '"Manrope", system-ui, sans-serif' },
  { id: 'Inter',             label: 'Inter',   stack: '"Inter", system-ui, sans-serif' },
  { id: 'Plus Jakarta Sans', label: 'Jakarta', stack: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { id: 'Sistem',            label: 'Sistem',  stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' },
];

export const DEFAULTS: AppearanceState = {
  theme: 'dark', contrast: 'normal',
  accent: '#f97316', glow: 'on', tint: 'off',
  font: 'Manrope', uiScale: 100, weight: 'normal', tracking: 'normal',
  density: 'comfortable', radius: 'soft', cwidth: 'full', cards: 'elevated',
  shadows: 'on', glass: 'on', bg: 'glow', focusring: 'glow',
  tstripe: 'off', thover: 'on', tlines: 'horizontal',
  motion: 'full', underline: 'off',
};

const ATTR: Partial<Record<keyof AppearanceState, string>> = {
  contrast: 'data-contrast', glow: 'data-glow', tint: 'data-tint',
  weight: 'data-weight', tracking: 'data-tracking', density: 'data-density',
  radius: 'data-radius', cwidth: 'data-cwidth', cards: 'data-cards',
  shadows: 'data-shadows', glass: 'data-glass', bg: 'data-bg', focusring: 'data-focusring',
  tstripe: 'data-tstripe', thover: 'data-thover', tlines: 'data-tlines',
  motion: 'data-motion', underline: 'data-underline',
};

const STORAGE_KEY = 'pdks_admin_appearance';

export const TW_ONOFF = [
  { val: 'off', label: 'Kapalı' },
  { val: 'on', label: 'Açık' },
];

export const OPTS: Record<string, Array<{ val: string; label: string }>> = {
  theme:     [{ val: 'dark', label: 'Koyu' }, { val: 'light', label: 'Açık' }, { val: 'auto', label: 'Oto' }],
  contrast:  [{ val: 'normal', label: 'Normal' }, { val: 'high', label: 'Yüksek' }],
  glow:      [{ val: 'off', label: 'Kapalı' }, { val: 'on', label: 'Normal' }, { val: 'strong', label: 'Güçlü' }],
  font:      FONTS.map(f => ({ val: f.id, label: f.label })),
  weight:    [{ val: 'light', label: 'İnce' }, { val: 'normal', label: 'Normal' }, { val: 'bold', label: 'Kalın' }],
  tracking:  [{ val: 'tight', label: 'Sık' }, { val: 'normal', label: 'Normal' }, { val: 'wide', label: 'Geniş' }],
  density:   [{ val: 'comfortable', label: 'Ferah' }, { val: 'normal', label: 'Normal' }, { val: 'compact', label: 'Kompakt' }],
  radius:    [{ val: 'soft', label: 'Yumuşak' }, { val: 'md', label: 'Orta' }, { val: 'sharp', label: 'Keskin' }],
  cwidth:    [{ val: 'narrow', label: 'Dar' }, { val: 'normal', label: 'Orta' }, { val: 'wide', label: 'Geniş' }, { val: 'full', label: 'Tam' }],
  cards:     [{ val: 'elevated', label: 'Gölgeli' }, { val: 'flat', label: 'Düz' }, { val: 'outlined', label: 'Çerçeve' }],
  bg:        [{ val: 'none', label: 'Yok' }, { val: 'glow', label: 'Parlama' }, { val: 'glow-accent', label: 'Renkli' }, { val: 'grid', label: 'Izgara' }, { val: 'dots', label: 'Nokta' }],
  focusring: [{ val: 'glow', label: 'Parlak' }, { val: 'thin', label: 'İnce' }, { val: 'off', label: 'Kapalı' }],
  tlines:    [{ val: 'horizontal', label: 'Yatay' }, { val: 'all', label: 'Tümü' }, { val: 'none', label: 'Yok' }],
  motion:    [{ val: 'full', label: 'Tam' }, { val: 'reduced', label: 'Azalt' }],
};

let current: AppearanceState = loadFromStorage();

function loadFromStorage(): AppearanceState {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...DEFAULTS, ...raw };
  } catch {
    return { ...DEFAULTS };
  }
}

function persist(): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(current)); } catch { /* ignore */ }
}

function resolveTheme(theme: string): string {
  if (theme !== 'auto') return theme;
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
  return mql?.matches ? 'dark' : 'light';
}

export function applyAppearance(state: AppearanceState = current): void {
  const html = document.documentElement;

  (Object.keys(ATTR) as Array<keyof AppearanceState>).forEach((key) => {
    const attr = ATTR[key]!;
    html.setAttribute(attr, String(state[key] ?? DEFAULTS[key]));
  });
  html.setAttribute('data-theme', resolveTheme(state.theme));

  html.style.setProperty('--ui-scale', String((Number(state.uiScale) || 100) / 100));

  const accent = ACCENTS.find(a => a.value.toLowerCase() === String(state.accent).toLowerCase()) ?? ACCENTS[0];
  html.style.setProperty('--accent', accent.value);
  html.style.setProperty('--accent-contrast', accent.contrast);

  const font = FONTS.find(f => f.id === state.font) ?? FONTS[0];
  html.style.setProperty('--font-sans', font.stack);
  html.style.setProperty('--font-num', font.stack);
}

export function getAppearance(): AppearanceState {
  return current;
}

export function setAppearance(patch: Partial<AppearanceState>): void {
  current = { ...current, ...patch };
  applyAppearance(current);
  persist();
}

export function resetAppearance(): void {
  current = { ...DEFAULTS };
  applyAppearance(current);
  persist();
}

if (window.matchMedia) {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (current.theme === 'auto') applyAppearance(current);
  });
}
