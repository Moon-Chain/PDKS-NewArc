// ============================================================
// PDKS Admin — Görünüm & Tema motoru (KOKPİT sürümü)
// Aynı motor iki yerde kullanılır:
//   1) Araç çubuğundaki "Tweaks" paneli (curated, kompakt)
//   2) Şirket Ayarları > "Tema & Görünüm" (tam kokpit, 24 ayar)
// Değerler localStorage'da (pdks_appearance) saklanır; host Tweaks
// kullanıldığında ayrıca index.html'e de yazılır.
// ============================================================

const TW_ACCENTS = [
  { label: 'Turuncu',  value: '#f97316', contrast: '#ffffff' },
  { label: 'Kehribar', value: '#f59e0b', contrast: '#241400' },
  { label: 'Kırmızı',  value: '#ef4444', contrast: '#ffffff' },
  { label: 'Pembe',    value: '#ec4899', contrast: '#ffffff' },
  { label: 'Mor',      value: '#a855f7', contrast: '#ffffff' },
  { label: 'İndigo',   value: '#6366f1', contrast: '#ffffff' },
  { label: 'Mavi',     value: '#3b82f6', contrast: '#ffffff' },
  { label: 'Camgöbeği',value: '#06b6d4', contrast: '#04222a' },
  { label: 'Teal',     value: '#14b8a6', contrast: '#04231f' },
  { label: 'Yeşil',    value: '#10b981', contrast: '#05251b' },
  { label: 'Lime',     value: '#84cc16', contrast: '#1a2400' },
  { label: 'Arduvaz',  value: '#64748b', contrast: '#ffffff' },
];

const TW_FONTS = [
  { id: 'Manrope',           label: 'Manrope', stack: '"Manrope", system-ui, sans-serif' },
  { id: 'Inter',             label: 'Inter',   stack: '"Inter", system-ui, sans-serif' },
  { id: 'Plus Jakarta Sans', label: 'Jakarta', stack: '"Plus Jakarta Sans", system-ui, sans-serif' },
  { id: 'Sistem',            label: 'Sistem',  stack: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif' },
];

const TW_DEFAULTS = {
  // Tema & Kontrast
  theme: 'dark', contrast: 'normal',
  // Renk
  accent: '#f97316', glow: 'on', tint: 'off',
  // Tipografi
  font: 'Manrope', uiScale: 100, weight: 'normal', tracking: 'normal',
  // Düzen
  density: 'comfortable', radius: 'soft', sidebar: 'expanded', cwidth: 'full', cards: 'elevated',
  // Efektler
  shadows: 'on', glass: 'on', bg: 'glow', focusring: 'glow',
  // Tablolar
  tstripe: 'off', thover: 'on', tlines: 'horizontal',
  // Erişilebilirlik & Hareket
  motion: 'full', underline: 'off',
};

// data-* özniteliğiyle sürülen anahtarlar
const TW_ATTR = {
  theme: 'data-theme', contrast: 'data-contrast', glow: 'data-glow', tint: 'data-tint',
  weight: 'data-weight', tracking: 'data-tracking', density: 'data-density',
  radius: 'data-radius', cwidth: 'data-cwidth', cards: 'data-cards',
  shadows: 'data-shadows', glass: 'data-glass', bg: 'data-bg', focusring: 'data-focusring',
  tstripe: 'data-tstripe', thover: 'data-thover', tlines: 'data-tlines',
  motion: 'data-motion', underline: 'data-underline',
};

function twLoadLocal() {
  try { return JSON.parse(localStorage.getItem('pdks_appearance') || '{}') || {}; }
  catch (e) { return {}; }
}
function twPersist() {
  try { localStorage.setItem('pdks_appearance', JSON.stringify(twState)); } catch (e) {}
}

// Öncelik: varsayılan < host (window.TWEAKS) < cihazda kayıtlı (localStorage)
let twState = Object.assign({}, TW_DEFAULTS, window.TWEAKS || {}, twLoadLocal());

// Otomatik tema için sistem dinleyici
const _twMql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
function resolveTheme(t) { return t === 'auto' ? (_twMql && _twMql.matches ? 'dark' : 'light') : t; }
if (_twMql) _twMql.addEventListener('change', () => { if (twState.theme === 'auto') applyTweaks(twState); });

// ---- Uygula (canlı) ----
function applyTweaks(t) {
  const html = document.documentElement;

  // Tüm data-* anahtarları
  Object.keys(TW_ATTR).forEach(k => {
    if (k === 'theme') return;
    html.setAttribute(TW_ATTR[k], t[k] != null ? t[k] : TW_DEFAULTS[k]);
  });
  html.setAttribute('data-theme', resolveTheme(t.theme));

  // UI ölçeği
  html.style.setProperty('--ui-scale', String((Number(t.uiScale) || 100) / 100));

  // Vurgu rengi
  const acc = TW_ACCENTS.find(a => a.value.toLowerCase() === String(t.accent).toLowerCase()) || TW_ACCENTS[0];
  html.style.setProperty('--accent', acc.value);
  html.style.setProperty('--accent-contrast', acc.contrast);

  // Yazı tipi
  const f = TW_FONTS.find(x => x.id === t.font) || TW_FONTS[0];
  html.style.setProperty('--font-sans', f.stack);
  html.style.setProperty('--font-num', f.stack);

  // Kenar çubuğu durumu
  const shell = document.getElementById('admin-shell');
  if (shell && t.sidebar) {
    shell.setAttribute('data-sidebar', t.sidebar);
    const ico = document.getElementById('rail-icon');
    if (ico) ico.setAttribute('data-lucide', t.sidebar === 'collapsed' ? 'panel-left-open' : 'panel-left-close');
    if (window.lucide) window.lucide.createIcons();
  }
}

// İlk boyamadan önce uygula (flaş olmasın)
applyTweaks(twState);

// ---- Değer değiştir / sıfırla ----
function _applyPersist(patch) {
  Object.assign(twState, patch);
  applyTweaks(twState);
  twPersist();
  try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: patch }, '*'); } catch (e) {}
}
function setTweak(patch) { _applyPersist(patch); refreshAppearanceUI(); }
function setTweakLive(patch) { _applyPersist(patch); }   // slider — UI'yi yeniden kurma
function resetTweaks() {
  twState = Object.assign({}, TW_DEFAULTS);
  applyTweaks(twState);
  twPersist();
  try { window.parent.postMessage({ type: '__edit_mode_set_keys', edits: Object.assign({}, TW_DEFAULTS) }, '*'); } catch (e) {}
  refreshAppearanceUI();
}
window.setTweak = setTweak;
window.__tw = (key, val) => setTweak({ [key]: val });
window.__twReset = resetTweaks;
window.__twSlide = (key, val, unit, el) => {
  setTweakLive({ [key]: Number(val) });
  const lab = el && el.parentElement && el.parentElement.querySelector('.tw-slider-val');
  if (lab) lab.textContent = val + (unit || '');
};

// ---- Kontrol parçaları ----
function twSeg(key, options) {
  return '<div class="tweak-seg">' + options.map(o =>
    `<button class="${String(twState[key]) === String(o.val) ? 'active' : ''}" onclick="__tw('${key}','${o.val}')">${o.label}</button>`
  ).join('') + '</div>';
}
function twSwatches(limit) {
  const cur = String(twState.accent).toLowerCase();
  const list = limit ? TW_ACCENTS.slice(0, limit) : TW_ACCENTS;
  return '<div class="tweak-swatches">' + list.map(a =>
    `<button class="tweak-swatch ${cur === a.value.toLowerCase() ? 'active' : ''}" style="background:${a.value}" title="${a.label}" aria-label="${a.label}" onclick="__tw('accent','${a.value}')"></button>`
  ).join('') + '</div>';
}
function twToggle(key) {
  const on = twState[key] === 'on' || twState[key] === true;
  return `<button class="tw-toggle ${on ? 'on' : ''}" role="switch" aria-checked="${on}" onclick="__tw('${key}','${on ? 'off' : 'on'}')"><span class="tw-knob"></span></button>`;
}
function twSlider(key, min, max, step, unit) {
  const v = twState[key] != null ? twState[key] : TW_DEFAULTS[key];
  return `<div class="tw-slider">
    <input type="range" min="${min}" max="${max}" step="${step}" value="${v}"
           oninput="__twSlide('${key}', this.value, '${unit || ''}', this)" aria-label="${key}">
    <span class="tw-slider-val">${v}${unit || ''}</span>
  </div>`;
}

const TW_OPTS = {
  theme:     [{ val: 'dark', label: 'Koyu' }, { val: 'light', label: 'Açık' }, { val: 'auto', label: 'Oto' }],
  contrast:  [{ val: 'normal', label: 'Normal' }, { val: 'high', label: 'Yüksek' }],
  glow:      [{ val: 'off', label: 'Kapalı' }, { val: 'on', label: 'Normal' }, { val: 'strong', label: 'Güçlü' }],
  font:      TW_FONTS.map(f => ({ val: f.id, label: f.label })),
  weight:    [{ val: 'light', label: 'İnce' }, { val: 'normal', label: 'Normal' }, { val: 'bold', label: 'Kalın' }],
  tracking:  [{ val: 'tight', label: 'Sık' }, { val: 'normal', label: 'Normal' }, { val: 'wide', label: 'Geniş' }],
  density:   [{ val: 'comfortable', label: 'Ferah' }, { val: 'normal', label: 'Normal' }, { val: 'compact', label: 'Kompakt' }],
  radius:    [{ val: 'soft', label: 'Yumuşak' }, { val: 'md', label: 'Orta' }, { val: 'sharp', label: 'Keskin' }],
  sidebar:   [{ val: 'expanded', label: 'Geniş' }, { val: 'collapsed', label: 'Dar' }],
  cwidth:    [{ val: 'narrow', label: 'Dar' }, { val: 'normal', label: 'Orta' }, { val: 'wide', label: 'Geniş' }, { val: 'full', label: 'Tam' }],
  cards:     [{ val: 'elevated', label: 'Gölgeli' }, { val: 'flat', label: 'Düz' }, { val: 'outlined', label: 'Çerçeve' }],
  bg:        [{ val: 'none', label: 'Yok' }, { val: 'glow', label: 'Parlama' }, { val: 'glow-accent', label: 'Renkli' }, { val: 'grid', label: 'Izgara' }, { val: 'dots', label: 'Nokta' }],
  focusring: [{ val: 'glow', label: 'Parlak' }, { val: 'thin', label: 'İnce' }, { val: 'off', label: 'Kapalı' }],
  tlines:    [{ val: 'horizontal', label: 'Yatay' }, { val: 'all', label: 'Tümü' }, { val: 'none', label: 'Yok' }],
  motion:    [{ val: 'full', label: 'Tam' }, { val: 'reduced', label: 'Azalt' }],
};

// ============================================================
// 1) Floating Tweaks paneli — curated, kompakt
// ============================================================
function buildTweaksPanel() {
  const body = document.getElementById('tweaks-body');
  if (!body) return;
  const grp = (label, html) => `<div class="tweak-group"><span class="tweak-label">${label}</span>${html}</div>`;
  body.innerHTML =
    grp('Tema', twSeg('theme', TW_OPTS.theme)) +
    grp('Vurgu Rengi', twSwatches(8)) +
    grp('Yazı Tipi', twSeg('font', TW_OPTS.font)) +
    grp('Yoğunluk', twSeg('density', TW_OPTS.density)) +
    grp('Köşeler', twSeg('radius', TW_OPTS.radius)) +
    grp('Arka Plan', twSeg('bg', TW_OPTS.bg)) +
    grp('Kenar Çubuğu', twSeg('sidebar', TW_OPTS.sidebar)) +
    grp('Hareket', twSeg('motion', TW_OPTS.motion)) +
    `<div class="tweak-group"><button class="btn btn-ghost btn-sm" style="width:100%;justify-content:center" onclick="__twReset()">Varsayılana sıfırla</button></div>`;
}

// ============================================================
// 2) Ayarlar sayfası — TAM KOKPİT (eşit kartlar, önizlemeli)
// ============================================================
const TW_ONOFF = [{ val: 'off', label: 'Kapalı' }, { val: 'on', label: 'Açık' }];

// Her ayar için canlı mini önizleme
function ckPreview(key) {
  const ic = (typeof icon === 'function') ? icon : () => '';
  switch (key) {
    case 'theme':     return `<div class="pv-split"><i></i><b></b></div>`;
    case 'contrast':  return `<span class="pv-aa" style="-webkit-text-stroke:0.6px var(--text-primary)">Aa</span>`;
    case 'accent':    return `<span class="pv-chip" style="background:var(--accent)"></span>`;
    case 'glow':      return `<span class="pv-chip pv-chip-glow" style="background:var(--accent)"></span>`;
    case 'tint':      return `<span class="pv-card-mini tint"></span>`;
    case 'font':      return `<span class="pv-aa">Aa</span>`;
    case 'uiScale':   return `<span class="pv-aa">Aa</span>`;
    case 'weight':    return `<span class="pv-aa" style="font-weight:800">Aa</span>`;
    case 'tracking':  return `<span class="pv-track">ABC</span>`;
    case 'density':   return `<div class="pv-rows"><i></i><i></i><i></i></div>`;
    case 'radius':    return `<span class="pv-radius"></span>`;
    case 'sidebar':   return `<div class="pv-shell"><i></i><b></b></div>`;
    case 'cwidth':    return `<div class="pv-page"><i></i><i></i></div>`;
    case 'cards':     return `<span class="pv-card-mini sh"></span>`;
    case 'shadows':   return `<span class="pv-card-mini sh"></span>`;
    case 'glass':     return `<div class="pv-glass"><i></i></div>`;
    case 'bg':        return `<span class="pv-bg glow"></span>`;
    case 'focusring': return `<span class="pv-ring"></span>`;
    case 'tstripe':   return `<div class="pv-tbl"><i></i><i></i><i></i><i></i></div>`;
    case 'thover':    return `<div class="pv-tbl"><i></i><i class="hot"></i><i></i><i></i></div>`;
    case 'tlines':    return `<div class="pv-tbl grid"><i></i><i></i><i></i><i></i></div>`;
    case 'motion':    return `<span class="pv-motion">${ic('zap')}</span>`;
    case 'underline': return `<span class="pv-link">Bağlantı</span>`;
    default:          return '';
  }
}

function ckCardHTML(item) {
  return `<div class="ck-card">
    <div class="ck-card-top">
      <div class="ck-meta"><strong>${item.title}</strong><span>${item.desc}</span></div>
      <div class="ck-preview">${ckPreview(item.key)}</div>
    </div>
    <div class="ck-card-foot">${item.control}</div>
  </div>`;
}
function ckSectionHTML(iconName, title, count) {
  const ic = (typeof icon === 'function') ? icon : () => '';
  return `<div class="ck-section">
    <span class="ck-sec-ico">${ic(iconName)}</span>
    <strong>${title}</strong>
    <span class="ck-sec-count">${count} ayar</span>
  </div>`;
}

function appearanceControlsHTML() {
  const sections = [
    { icon: 'contrast', title: 'Tema & Kontrast', items: [
      { key: 'theme',    title: 'Tema',    desc: 'Koyu, açık veya otomatik', control: twSeg('theme', TW_OPTS.theme) },
      { key: 'contrast', title: 'Kontrast', desc: 'Kenarlık ve metin keskinliği', control: twSeg('contrast', TW_OPTS.contrast) },
    ]},
    { icon: 'palette', title: 'Renk', items: [
      { key: 'accent', title: 'Vurgu Rengi',     desc: '12 marka rengi', control: twSwatches() },
      { key: 'glow',   title: 'Vurgu Parlaması', desc: 'Buton ve öğelerde ışıma', control: twSeg('glow', TW_OPTS.glow) },
      { key: 'tint',   title: 'Yüzey Tonu',      desc: 'Kartları vurguyla boya', control: twSeg('tint', TW_ONOFF) },
    ]},
    { icon: 'type', title: 'Tipografi', items: [
      { key: 'font',     title: 'Yazı Tipi',      desc: 'Arayüz font ailesi', control: twSeg('font', TW_OPTS.font) },
      { key: 'uiScale',  title: 'UI Ölçeği',      desc: 'Tüm arayüz boyutu', control: twSlider('uiScale', 85, 120, 1, '%') },
      { key: 'weight',   title: 'Metin Kalınlığı', desc: 'Genel yazı kalınlığı', control: twSeg('weight', TW_OPTS.weight) },
      { key: 'tracking', title: 'Harf Aralığı',   desc: 'Karakter sıklığı', control: twSeg('tracking', TW_OPTS.tracking) },
    ]},
    { icon: 'layout-dashboard', title: 'Düzen', items: [
      { key: 'density', title: 'Bilgi Yoğunluğu', desc: 'Boşluk ve satır sıklığı', control: twSeg('density', TW_OPTS.density) },
      { key: 'radius',  title: 'Köşe Yuvarlaklığı', desc: 'Kart ve buton köşeleri', control: twSeg('radius', TW_OPTS.radius) },
      { key: 'cwidth',  title: 'İçerik Genişliği', desc: 'Sayfa içerik sınırı', control: twSeg('cwidth', TW_OPTS.cwidth) },
      { key: 'sidebar', title: 'Kenar Çubuğu', desc: 'Açılışta menü genişliği', control: twSeg('sidebar', TW_OPTS.sidebar) },
      { key: 'cards',   title: 'Kart Stili', desc: 'Gölgeli, düz veya çerçeveli', control: twSeg('cards', TW_OPTS.cards) },
    ]},
    { icon: 'sparkles', title: 'Efektler', items: [
      { key: 'shadows',   title: 'Gölgeler',     desc: 'Kart ve buton gölgeleri', control: twSeg('shadows', TW_ONOFF) },
      { key: 'glass',     title: 'Cam Efekti',   desc: 'Üst çubukta bulanıklık', control: twSeg('glass', TW_ONOFF) },
      { key: 'bg',        title: 'Arka Plan',    desc: 'Sayfa arka plan deseni', control: twSeg('bg', TW_OPTS.bg) },
      { key: 'focusring', title: 'Odak Halkası', desc: 'Klavye odak göstergesi', control: twSeg('focusring', TW_OPTS.focusring) },
    ]},
    { icon: 'table', title: 'Tablolar', items: [
      { key: 'tstripe', title: 'Zebra Satırlar', desc: 'Tek/çift renklendirme', control: twSeg('tstripe', TW_ONOFF) },
      { key: 'thover',  title: 'Satır Vurgusu', desc: 'Üzerine gelince renklenme', control: twSeg('thover', TW_ONOFF) },
      { key: 'tlines',  title: 'Izgara Çizgileri', desc: 'Hücre kenarlıkları', control: twSeg('tlines', TW_OPTS.tlines) },
    ]},
    { icon: 'accessibility', title: 'Erişilebilirlik & Hareket', items: [
      { key: 'motion',    title: 'Hareket', desc: 'Animasyon ve geçişler', control: twSeg('motion', TW_OPTS.motion) },
      { key: 'underline', title: 'Bağlantı Altı Çizgi', desc: 'Linkleri altı çizili göster', control: twSeg('underline', TW_ONOFF) },
    ]},
  ];
  return `<div class="cockpit-grid">` + sections.map(s =>
    ckSectionHTML(s.icon, s.title, s.items.length) + s.items.map(ckCardHTML).join('')
  ).join('') + `</div>`;
}

function appearanceCardHTML() {
  const ic = (typeof icon === 'function') ? icon : () => '';
  return `
    <div class="cockpit-bar">
      <div class="cockpit-bar-info">
        ${ic('sliders-horizontal', 'icon icon-sm')}
        <strong>Tema &amp; Görünüm</strong> — 24 ayar, tarayıcınızda kayıtlı
      </div>
      <div class="cockpit-actions">
        <span class="badge badge-muted">Bu cihazda kaydedilir</span>
        <button class="btn btn-ghost btn-sm" onclick="__twReset()">${ic('rotate-ccw', 'icon icon-sm')} Sıfırla</button>
      </div>
    </div>
    <div id="appearance-card-body">${appearanceControlsHTML()}</div>
  `;
}
window.appearanceCardHTML = appearanceCardHTML;

function refreshAppearanceUI() {
  buildTweaksPanel();
  const body = document.getElementById('appearance-card-body');
  if (body) body.innerHTML = appearanceControlsHTML();
  if (window.lucide) window.lucide.createIcons();
}

// "Orta" köşe için ara değerler
const _twRadiusStyle = document.createElement('style');
_twRadiusStyle.textContent = '[data-radius="md"]{--radius-sm:7px;--radius-md:10px;--radius-lg:14px;--radius-xl:20px;}';
document.head.appendChild(_twRadiusStyle);

// ---- Floating panel aç/kapat ----
function openTweaks() {
  const p = document.getElementById('tweaks-panel');
  if (!p) return;
  buildTweaksPanel();
  p.classList.add('open');
  if (window.lucide) window.lucide.createIcons();
}
function closeTweaks() {
  const p = document.getElementById('tweaks-panel');
  if (!p) return;
  p.classList.remove('open');
  try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
}
window.openTweaks = openTweaks;
window.closeTweaks = closeTweaks;

// ---- Host protokolü ----
window.addEventListener('message', (e) => {
  const d = e.data || {};
  if (d.type === '__activate_edit_mode') openTweaks();
  else if (d.type === '__deactivate_edit_mode') {
    const p = document.getElementById('tweaks-panel');
    if (p) p.classList.remove('open');
  }
});
try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}
