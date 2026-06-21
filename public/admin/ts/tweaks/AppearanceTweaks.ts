import { ACCENTS, OPTS, TW_ONOFF, getAppearance, setAppearance, resetAppearance, type AppearanceState } from './appearance.js';
import { icon } from '../icons.js';

function seg(key: keyof AppearanceState, options: Array<{ val: string; label: string }>): string {
  const cur = String(getAppearance()[key]);
  return `<div class="tweak-seg">${options.map(o =>
    `<button type="button" data-key="${key}" data-val="${o.val}" class="${cur === o.val ? 'active' : ''}">${o.label}</button>`
  ).join('')}</div>`;
}

function swatches(): string {
  const cur = String(getAppearance().accent).toLowerCase();
  return `<div class="tweak-swatches">${ACCENTS.map(a =>
    `<button type="button" class="tweak-swatch ${cur === a.value.toLowerCase() ? 'active' : ''}" style="background:${a.value}" data-key="accent" data-val="${a.value}" title="${a.label}" aria-label="${a.label}"></button>`
  ).join('')}</div>`;
}

function toggle(key: keyof AppearanceState): string {
  const on = getAppearance()[key] === 'on';
  return `<button type="button" class="tw-toggle ${on ? 'on' : ''}" role="switch" aria-checked="${on}" data-toggle="${key}"><span class="tw-knob"></span></button>`;
}

function slider(key: keyof AppearanceState, min: number, max: number, step: number, unit: string): string {
  const v = getAppearance()[key];
  return `
    <div class="tw-slider">
      <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-slider="${key}" data-unit="${unit}" aria-label="${key}">
      <span class="tw-slider-val">${v}${unit}</span>
    </div>`;
}

// Her ayar için canlı mini önizleme — admin-panel-preview/js/tweaks.js'teki ckPreview ile aynı
function ckPreview(key: string): string {
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
    case 'cwidth':    return `<div class="pv-page"><i></i><i></i></div>`;
    case 'cards':     return `<span class="pv-card-mini sh"></span>`;
    case 'shadows':   return `<span class="pv-card-mini sh"></span>`;
    case 'glass':     return `<div class="pv-glass"><i></i></div>`;
    case 'bg':        return `<span class="pv-bg glow"></span>`;
    case 'focusring': return `<span class="pv-ring"></span>`;
    case 'tstripe':   return `<div class="pv-tbl"><i></i><i></i><i></i><i></i></div>`;
    case 'thover':    return `<div class="pv-tbl"><i></i><i class="hot"></i><i></i><i></i></div>`;
    case 'tlines':    return `<div class="pv-tbl grid"><i></i><i></i><i></i><i></i></div>`;
    case 'motion':    return `<span class="pv-motion">${icon('zap')}</span>`;
    case 'underline': return `<span class="pv-link">Bağlantı</span>`;
    default:          return '';
  }
}

interface CockpitItem { key: keyof AppearanceState; title: string; desc: string; control: string; }
interface CockpitSection { icon: string; title: string; items: CockpitItem[]; }

function ckCardHTML(item: CockpitItem): string {
  return `<div class="ck-card">
    <div class="ck-card-top">
      <div class="ck-meta"><strong>${item.title}</strong><span>${item.desc}</span></div>
      <div class="ck-preview">${ckPreview(item.key)}</div>
    </div>
    <div class="ck-card-foot">${item.control}</div>
  </div>`;
}

function ckSectionHTML(iconName: string, title: string, count: number): string {
  return `<div class="ck-section">
    <span class="ck-sec-ico">${icon(iconName)}</span>
    <strong>${title}</strong>
    <span class="ck-sec-count">${count} ayar</span>
  </div>`;
}

function appearanceControlsHTML(): string {
  const sections: CockpitSection[] = [
    { icon: 'contrast', title: 'Tema & Kontrast', items: [
      { key: 'theme',    title: 'Tema',    desc: 'Koyu, açık veya otomatik', control: seg('theme', OPTS.theme) },
      { key: 'contrast', title: 'Kontrast', desc: 'Kenarlık ve metin keskinliği', control: seg('contrast', OPTS.contrast) },
    ]},
    { icon: 'palette', title: 'Renk', items: [
      { key: 'accent', title: 'Vurgu Rengi',     desc: '12 marka rengi', control: swatches() },
      { key: 'glow',   title: 'Vurgu Parlaması', desc: 'Buton ve öğelerde ışıma', control: seg('glow', OPTS.glow) },
      { key: 'tint',   title: 'Yüzey Tonu',      desc: 'Kartları vurguyla boya', control: toggle('tint') },
    ]},
    { icon: 'type', title: 'Tipografi', items: [
      { key: 'font',     title: 'Yazı Tipi',      desc: 'Arayüz font ailesi', control: seg('font', OPTS.font) },
      { key: 'uiScale',  title: 'UI Ölçeği',      desc: 'Tüm arayüz boyutu', control: slider('uiScale', 85, 120, 1, '%') },
      { key: 'weight',   title: 'Metin Kalınlığı', desc: 'Genel yazı kalınlığı', control: seg('weight', OPTS.weight) },
      { key: 'tracking', title: 'Harf Aralığı',   desc: 'Karakter sıklığı', control: seg('tracking', OPTS.tracking) },
    ]},
    { icon: 'layout-dashboard', title: 'Düzen', items: [
      { key: 'density', title: 'Bilgi Yoğunluğu', desc: 'Boşluk ve satır sıklığı', control: seg('density', OPTS.density) },
      { key: 'radius',  title: 'Köşe Yuvarlaklığı', desc: 'Kart ve buton köşeleri', control: seg('radius', OPTS.radius) },
      { key: 'cwidth',  title: 'İçerik Genişliği', desc: 'Sayfa içerik sınırı', control: seg('cwidth', OPTS.cwidth) },
      { key: 'cards',   title: 'Kart Stili', desc: 'Gölgeli, düz veya çerçeveli', control: seg('cards', OPTS.cards) },
    ]},
    { icon: 'sparkles', title: 'Efektler', items: [
      { key: 'shadows',   title: 'Gölgeler',     desc: 'Kart ve buton gölgeleri', control: toggle('shadows') },
      { key: 'glass',     title: 'Cam Efekti',   desc: 'Üst çubukta bulanıklık', control: toggle('glass') },
      { key: 'bg',        title: 'Arka Plan',    desc: 'Sayfa arka plan deseni', control: seg('bg', OPTS.bg) },
      { key: 'focusring', title: 'Odak Halkası', desc: 'Klavye odak göstergesi', control: seg('focusring', OPTS.focusring) },
    ]},
    { icon: 'table', title: 'Tablolar', items: [
      { key: 'tstripe', title: 'Zebra Satırlar', desc: 'Tek/çift renklendirme', control: toggle('tstripe') },
      { key: 'thover',  title: 'Satır Vurgusu', desc: 'Üzerine gelince renklenme', control: toggle('thover') },
      { key: 'tlines',  title: 'Izgara Çizgileri', desc: 'Hücre kenarlıkları', control: seg('tlines', OPTS.tlines) },
    ]},
    { icon: 'accessibility', title: 'Erişilebilirlik & Hareket', items: [
      { key: 'motion',    title: 'Hareket', desc: 'Animasyon ve geçişler', control: seg('motion', OPTS.motion) },
      { key: 'underline', title: 'Bağlantı Altı Çizgi', desc: 'Linkleri altı çizili göster', control: toggle('underline') },
    ]},
  ];

  return `<div class="cockpit-grid">` + sections.map(s =>
    ckSectionHTML(s.icon, s.title, s.items.length) + s.items.map(ckCardHTML).join('')
  ).join('') + `</div>`;
}

const TOTAL_SETTINGS = 21;

export function renderAppearanceTab(): string {
  return `
    <div class="card">
      <div class="cockpit-bar">
        <div class="cockpit-bar-info">
          ${icon('sliders-horizontal', 'icon icon-sm')}
          <strong>Tema &amp; Görünüm</strong> — ${TOTAL_SETTINGS} ayar, bu cihazda kaydedilir
        </div>
        <div class="cockpit-actions">
          <span class="badge badge-muted">Bu cihazda kaydedilir</span>
          <button class="btn btn-ghost btn-sm" id="appearance-reset">${icon('rotate-ccw', 'icon icon-sm')} Sıfırla</button>
        </div>
      </div>
      <div id="appearance-card-body">${appearanceControlsHTML()}</div>
    </div>
  `;
}

export function attachAppearanceTab(container: HTMLElement, onChange: () => void): void {
  container.querySelectorAll<HTMLButtonElement>('.tweak-seg button[data-key], .tweak-swatch[data-key]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.key as keyof AppearanceState;
      const val = btn.dataset.val!;
      setAppearance({ [key]: key === 'uiScale' ? Number(val) : val } as Partial<AppearanceState>);
      onChange();
    });
  });

  container.querySelectorAll<HTMLButtonElement>('[data-toggle]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.toggle as keyof AppearanceState;
      const on = getAppearance()[key] === 'on';
      setAppearance({ [key]: on ? 'off' : 'on' } as Partial<AppearanceState>);
      onChange();
    });
  });

  container.querySelectorAll<HTMLInputElement>('input[type="range"][data-slider]').forEach(input => {
    input.addEventListener('input', () => {
      const key = input.dataset.slider as keyof AppearanceState;
      const unit = input.dataset.unit ?? '';
      setAppearance({ [key]: Number(input.value) } as Partial<AppearanceState>);
      const label = input.parentElement?.querySelector('.tw-slider-val');
      if (label) label.textContent = `${input.value}${unit}`;
    });
  });

  container.querySelector('#appearance-reset')?.addEventListener('click', () => {
    resetAppearance();
    onChange();
  });
}
