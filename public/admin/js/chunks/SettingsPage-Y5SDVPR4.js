import {
  ACCENTS,
  OPTS,
  getAppearance,
  resetAppearance,
  setAppearance
} from "./chunk-QI5RVIRR.js";
import {
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api,
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/tweaks/AppearanceTweaks.ts
function seg(key, options) {
  const cur = String(getAppearance()[key]);
  return `<div class="tweak-seg">${options.map(
    (o) => `<button type="button" data-key="${key}" data-val="${o.val}" class="${cur === o.val ? "active" : ""}">${o.label}</button>`
  ).join("")}</div>`;
}
function swatches() {
  const cur = String(getAppearance().accent).toLowerCase();
  return `<div class="tweak-swatches">${ACCENTS.map(
    (a) => `<button type="button" class="tweak-swatch ${cur === a.value.toLowerCase() ? "active" : ""}" style="background:${a.value}" data-key="accent" data-val="${a.value}" title="${a.label}" aria-label="${a.label}"></button>`
  ).join("")}</div>`;
}
function toggle(key) {
  const on = getAppearance()[key] === "on";
  return `<button type="button" class="tw-toggle ${on ? "on" : ""}" role="switch" aria-checked="${on}" data-toggle="${key}"><span class="tw-knob"></span></button>`;
}
function slider(key, min, max, step, unit) {
  const v = getAppearance()[key];
  return `
    <div class="tw-slider">
      <input type="range" min="${min}" max="${max}" step="${step}" value="${v}" data-slider="${key}" data-unit="${unit}" aria-label="${key}">
      <span class="tw-slider-val">${v}${unit}</span>
    </div>`;
}
function ckPreview(key) {
  switch (key) {
    case "theme":
      return `<div class="pv-split"><i></i><b></b></div>`;
    case "contrast":
      return `<span class="pv-aa" style="-webkit-text-stroke:0.6px var(--text-primary)">Aa</span>`;
    case "accent":
      return `<span class="pv-chip" style="background:var(--accent)"></span>`;
    case "glow":
      return `<span class="pv-chip pv-chip-glow" style="background:var(--accent)"></span>`;
    case "tint":
      return `<span class="pv-card-mini tint"></span>`;
    case "font":
      return `<span class="pv-aa">Aa</span>`;
    case "uiScale":
      return `<span class="pv-aa">Aa</span>`;
    case "weight":
      return `<span class="pv-aa" style="font-weight:800">Aa</span>`;
    case "tracking":
      return `<span class="pv-track">ABC</span>`;
    case "density":
      return `<div class="pv-rows"><i></i><i></i><i></i></div>`;
    case "radius":
      return `<span class="pv-radius"></span>`;
    case "cwidth":
      return `<div class="pv-page"><i></i><i></i></div>`;
    case "cards":
      return `<span class="pv-card-mini sh"></span>`;
    case "shadows":
      return `<span class="pv-card-mini sh"></span>`;
    case "glass":
      return `<div class="pv-glass"><i></i></div>`;
    case "bg":
      return `<span class="pv-bg glow"></span>`;
    case "focusring":
      return `<span class="pv-ring"></span>`;
    case "tstripe":
      return `<div class="pv-tbl"><i></i><i></i><i></i><i></i></div>`;
    case "thover":
      return `<div class="pv-tbl"><i></i><i class="hot"></i><i></i><i></i></div>`;
    case "tlines":
      return `<div class="pv-tbl grid"><i></i><i></i><i></i><i></i></div>`;
    case "motion":
      return `<span class="pv-motion">${icon("zap")}</span>`;
    case "underline":
      return `<span class="pv-link">Ba\u011Flant\u0131</span>`;
    default:
      return "";
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
  return `<div class="ck-section">
    <span class="ck-sec-ico">${icon(iconName)}</span>
    <strong>${title}</strong>
    <span class="ck-sec-count">${count} ayar</span>
  </div>`;
}
function appearanceControlsHTML() {
  const sections = [
    { icon: "contrast", title: "Tema & Kontrast", items: [
      { key: "theme", title: "Tema", desc: "Koyu, a\xE7\u0131k veya otomatik", control: seg("theme", OPTS.theme) },
      { key: "contrast", title: "Kontrast", desc: "Kenarl\u0131k ve metin keskinli\u011Fi", control: seg("contrast", OPTS.contrast) }
    ] },
    { icon: "palette", title: "Renk", items: [
      { key: "accent", title: "Vurgu Rengi", desc: "12 marka rengi", control: swatches() },
      { key: "glow", title: "Vurgu Parlamas\u0131", desc: "Buton ve \xF6\u011Felerde \u0131\u015F\u0131ma", control: seg("glow", OPTS.glow) },
      { key: "tint", title: "Y\xFCzey Tonu", desc: "Kartlar\u0131 vurguyla boya", control: toggle("tint") }
    ] },
    { icon: "type", title: "Tipografi", items: [
      { key: "font", title: "Yaz\u0131 Tipi", desc: "Aray\xFCz font ailesi", control: seg("font", OPTS.font) },
      { key: "uiScale", title: "UI \xD6l\xE7e\u011Fi", desc: "T\xFCm aray\xFCz boyutu", control: slider("uiScale", 85, 120, 1, "%") },
      { key: "weight", title: "Metin Kal\u0131nl\u0131\u011F\u0131", desc: "Genel yaz\u0131 kal\u0131nl\u0131\u011F\u0131", control: seg("weight", OPTS.weight) },
      { key: "tracking", title: "Harf Aral\u0131\u011F\u0131", desc: "Karakter s\u0131kl\u0131\u011F\u0131", control: seg("tracking", OPTS.tracking) }
    ] },
    { icon: "layout-dashboard", title: "D\xFCzen", items: [
      { key: "density", title: "Bilgi Yo\u011Funlu\u011Fu", desc: "Bo\u015Fluk ve sat\u0131r s\u0131kl\u0131\u011F\u0131", control: seg("density", OPTS.density) },
      { key: "radius", title: "K\xF6\u015Fe Yuvarlakl\u0131\u011F\u0131", desc: "Kart ve buton k\xF6\u015Feleri", control: seg("radius", OPTS.radius) },
      { key: "cwidth", title: "\u0130\xE7erik Geni\u015Fli\u011Fi", desc: "Sayfa i\xE7erik s\u0131n\u0131r\u0131", control: seg("cwidth", OPTS.cwidth) },
      { key: "cards", title: "Kart Stili", desc: "G\xF6lgeli, d\xFCz veya \xE7er\xE7eveli", control: seg("cards", OPTS.cards) }
    ] },
    { icon: "sparkles", title: "Efektler", items: [
      { key: "shadows", title: "G\xF6lgeler", desc: "Kart ve buton g\xF6lgeleri", control: toggle("shadows") },
      { key: "glass", title: "Cam Efekti", desc: "\xDCst \xE7ubukta bulan\u0131kl\u0131k", control: toggle("glass") },
      { key: "bg", title: "Arka Plan", desc: "Sayfa arka plan deseni", control: seg("bg", OPTS.bg) },
      { key: "focusring", title: "Odak Halkas\u0131", desc: "Klavye odak g\xF6stergesi", control: seg("focusring", OPTS.focusring) }
    ] },
    { icon: "table", title: "Tablolar", items: [
      { key: "tstripe", title: "Zebra Sat\u0131rlar", desc: "Tek/\xE7ift renklendirme", control: toggle("tstripe") },
      { key: "thover", title: "Sat\u0131r Vurgusu", desc: "\xDCzerine gelince renklenme", control: toggle("thover") },
      { key: "tlines", title: "Izgara \xC7izgileri", desc: "H\xFCcre kenarl\u0131klar\u0131", control: seg("tlines", OPTS.tlines) }
    ] },
    { icon: "accessibility", title: "Eri\u015Filebilirlik & Hareket", items: [
      { key: "motion", title: "Hareket", desc: "Animasyon ve ge\xE7i\u015Fler", control: seg("motion", OPTS.motion) },
      { key: "underline", title: "Ba\u011Flant\u0131 Alt\u0131 \xC7izgi", desc: "Linkleri alt\u0131 \xE7izili g\xF6ster", control: toggle("underline") }
    ] }
  ];
  return `<div class="cockpit-grid">` + sections.map(
    (s) => ckSectionHTML(s.icon, s.title, s.items.length) + s.items.map(ckCardHTML).join("")
  ).join("") + `</div>`;
}
var TOTAL_SETTINGS = 21;
function renderAppearanceTab() {
  return `
    <div class="card">
      <div class="cockpit-bar">
        <div class="cockpit-bar-info">
          ${icon("sliders-horizontal", "icon icon-sm")}
          <strong>Tema &amp; G\xF6r\xFCn\xFCm</strong> \u2014 ${TOTAL_SETTINGS} ayar, bu cihazda kaydedilir
        </div>
        <div class="cockpit-actions">
          <span class="badge badge-muted">Bu cihazda kaydedilir</span>
          <button class="btn btn-ghost btn-sm" id="appearance-reset">${icon("rotate-ccw", "icon icon-sm")} S\u0131f\u0131rla</button>
        </div>
      </div>
      <div id="appearance-card-body">${appearanceControlsHTML()}</div>
    </div>
  `;
}
function attachAppearanceTab(container, onChange) {
  container.querySelectorAll(".tweak-seg button[data-key], .tweak-swatch[data-key]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.key;
      const val = btn.dataset.val;
      setAppearance({ [key]: key === "uiScale" ? Number(val) : val });
      onChange();
    });
  });
  container.querySelectorAll("[data-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const key = btn.dataset.toggle;
      const on = getAppearance()[key] === "on";
      setAppearance({ [key]: on ? "off" : "on" });
      onChange();
    });
  });
  container.querySelectorAll('input[type="range"][data-slider]').forEach((input) => {
    input.addEventListener("input", () => {
      const key = input.dataset.slider;
      const unit = input.dataset.unit ?? "";
      setAppearance({ [key]: Number(input.value) });
      const label = input.parentElement?.querySelector(".tw-slider-val");
      if (label) label.textContent = `${input.value}${unit}`;
    });
  });
  container.querySelector("#appearance-reset")?.addEventListener("click", () => {
    resetAppearance();
    onChange();
  });
}

// public/admin/ts/pages/SettingsPage.ts
var SettingsPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.tab = "genel";
    this.settings = null;
  }
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    try {
      const res = await api.get("/api/v1/settings");
      this.settings = res.settings;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ayarlar y\xFCklenemedi", "error");
    }
    this.draw();
  }
  draw() {
    this.container.innerHTML = `
      <div class="settings-tabs">
        <button class="settings-tab ${this.tab === "genel" ? "active" : ""}" data-tab="genel">Genel</button>
        <button class="settings-tab ${this.tab === "gorunum" ? "active" : ""}" data-tab="gorunum">G\xF6r\xFCn\xFCm</button>
      </div>
      <div id="settings-tab-content">
        ${this.tab === "genel" ? this.renderGeneralTab() : renderAppearanceTab()}
      </div>
    `;
    this.on(".settings-tabs", "click", (e) => {
      const btn = e.target.closest("[data-tab]");
      if (!btn) return;
      this.tab = btn.dataset.tab;
      this.draw();
    });
    if (this.tab === "genel") {
      this.attachGeneralTab();
    } else {
      const content = this.$("#settings-tab-content");
      attachAppearanceTab(content, () => this.draw());
    }
  }
  renderGeneralTab() {
    const s = this.settings;
    return `
      <div class="card">
        <div class="card-title">\u015Eirket Genel Bilgileri</div>
        <form id="settings-form" class="form-grid">
          <div class="form-field">
            <label class="label">\u015Eirket Ad\u0131</label>
            <input class="input" name="company_name" value="${s?.company_name ?? ""}" placeholder="\xD6rn: ABC Yaz\u0131l\u0131m Ltd. \u015Eti." />
          </div>
          <div class="form-field">
            <label class="label">Haftal\u0131k \xC7al\u0131\u015Fma G\xFCn\xFC</label>
            <select class="input" name="work_days_per_week">
              <option value="5" ${s?.work_days_per_week === 5 ? "selected" : ""}>5 G\xFCn</option>
              <option value="6" ${s?.work_days_per_week === 6 ? "selected" : ""}>6 G\xFCn</option>
              <option value="7" ${s?.work_days_per_week === 7 ? "selected" : ""}>7 G\xFCn</option>
            </select>
          </div>
          <div class="form-field">
            <label class="label">Hesaplama Tolerans\u0131 (Dk)</label>
            <input class="input" type="number" name="rounding_threshold_minutes" value="${s?.rounding_threshold_minutes ?? 30}" />
          </div>
          <div class="form-field">
            <label class="label">Mesai Ba\u015Flang\u0131c\u0131</label>
            <input class="input" type="time" name="shift_start" value="${s?.shift_start?.slice(0, 5) ?? "09:00"}" />
          </div>
          <div class="form-field">
            <label class="label">Mesai Biti\u015Fi</label>
            <input class="input" type="time" name="shift_end" value="${s?.shift_end?.slice(0, 5) ?? "18:00"}" />
          </div>
          <div class="form-field">
            <label class="label">\u0130\u015F Yeri IP Adresi</label>
            <input class="input" name="office_ip" value="${s?.office_ip ?? ""}" placeholder="\xD6rn: 176.234.12.34" />
          </div>
          <div class="form-field">
            <label class="label">QR Gizli Anahtar</label>
            <div style="display:flex; gap:var(--space-2)">
              <input class="input" name="qr_secret" value="${s?.qr_secret ?? ""}" placeholder="QR gizli anahtar\u0131" />
              <button type="button" class="btn btn-ghost btn-sm" id="settings-regen-secret">Yenile</button>
            </div>
          </div>
          <div class="form-field" style="grid-column: 1 / -1">
            <button type="submit" class="btn btn-primary">Ayarlar\u0131 Kaydet</button>
          </div>
        </form>
      </div>
    `;
  }
  attachGeneralTab() {
    const form = this.$("#settings-form");
    form?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => {
        data[k] = v || null;
      });
      if (data.work_days_per_week) data.work_days_per_week = Number(data.work_days_per_week);
      if (data.rounding_threshold_minutes) data.rounding_threshold_minutes = Number(data.rounding_threshold_minutes);
      try {
        const res = await api.patch("/api/v1/settings", data);
        this.settings = res.settings;
        toast("Ayarlar kaydedildi", "success");
      } catch (err) {
        toast(err instanceof Error ? err.message : "Kaydedilemedi", "error");
      }
    });
    this.on("#settings-regen-secret", "click", async () => {
      try {
        const res = await api.post("/api/v1/settings/generate-secret", {});
        const input = this.$('input[name="qr_secret"]');
        if (input) input.value = res.secret;
        toast("Yeni QR s\u0131rr\u0131 \xFCretildi \u2014 Ayarlar\u0131 kaydetmeyi unutmay\u0131n!", "warning");
      } catch {
        toast("S\u0131r \xFCretilemedi", "error");
      }
    });
  }
};
export {
  SettingsPage
};
//# sourceMappingURL=SettingsPage-Y5SDVPR4.js.map
