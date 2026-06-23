// public/ts/core/ApiClient.ts
var ApiClient = class {
  async _request(method, url, body, isForm = false) {
    const opts = {
      method,
      credentials: "include"
    };
    if (body) {
      if (isForm) {
        opts.body = body;
      } else {
        opts.headers = { "Content-Type": "application/json" };
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(url, opts);
    const data = await res.json();
    if (res.status === 401) {
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      throw new Error(data.error || "Oturum s\xFCresi doldu");
    }
    if (!res.ok) {
      throw new Error(data.error || "Sunucu hatas\u0131");
    }
    return data;
  }
  get(url) {
    return this._request("GET", url);
  }
  post(url, body) {
    return this._request("POST", url, body);
  }
  put(url, body) {
    return this._request("PUT", url, body);
  }
  patch(url, body) {
    return this._request("PATCH", url, body);
  }
  delete(url) {
    return this._request("DELETE", url);
  }
  upload(url, formData) {
    return this._request("POST", url, formData, true);
  }
};
var api = new ApiClient();

// public/ts/core/BasePage.ts
var BasePage = class {
  constructor(container) {
    this._listeners = [];
    this.container = container;
  }
  on(selector, event, handler) {
    const el = typeof selector === "string" ? this.container.querySelector(selector) : selector;
    if (!el) return this;
    el.addEventListener(event, handler);
    this._listeners.push({ el, event, handler });
    return this;
  }
  $(selector) {
    return this.container.querySelector(selector);
  }
  $$(selector) {
    return this.container.querySelectorAll(selector);
  }
  destroy() {
    this._listeners.forEach(
      ({ el, event, handler }) => el.removeEventListener(event, handler)
    );
    this._listeners = [];
    this.container.innerHTML = "";
  }
};

// public/admin/ts/icons.ts
var wrap = (body) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
var ICONS = {
  // ── Modül ikonları (moduleRegistry.icon ile eşleşir) ──
  "layout-dashboard": wrap('<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>'),
  clock: wrap('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  "check-check": wrap('<path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/>'),
  check: wrap('<polyline points="20 6 9 17 4 12"/>'),
  users: wrap('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'),
  "calendar-days": wrap('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/>'),
  zap: wrap('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  "file-spreadsheet": wrap('<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 13v4"/><path d="M12 13v4"/><path d="M16 13v4"/>'),
  sun: wrap('<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>'),
  settings: wrap('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'),
  history: wrap('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>'),
  "map-pin": wrap('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  shield: wrap('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/>'),
  "credit-card": wrap('<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>'),
  lock: wrap('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'),
  // ── Dashboard ikonları ──
  "door-open": wrap('<rect x="3" y="3" width="12" height="18" rx="1"/><path d="M15 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><circle cx="9" cy="12" r="1"/>'),
  inbox: wrap('<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>'),
  palmtree: wrap('<path d="M12 22v-9"/><path d="M9 8c0-3 1.5-6 3-6s3 3 3 6"/><path d="M5 12c0-2 2-4 7-4s7 2 7 4"/>'),
  "arrow-right": wrap('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
  "arrow-left": wrap('<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>'),
  "chevron-left": wrap('<path d="m15 18-6-6 6-6"/>'),
  "chevron-right": wrap('<path d="m9 18 6-6-6-6"/>'),
  "user-plus": wrap('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="16" y1="11" x2="22" y2="11"/>'),
  download: wrap('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  "calendar-plus": wrap('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="14" x2="12" y2="18"/><line x1="10" y1="16" x2="14" y2="16"/>'),
  // ── Layout / chrome ikonları ──
  menu: wrap('<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>'),
  "panel-left-close": wrap('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><path d="m14 9-3 3 3 3"/>'),
  "panel-left-open": wrap('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><path d="m13 9 3 3-3 3"/>'),
  search: wrap('<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>'),
  bell: wrap('<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>'),
  "log-out": wrap('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>'),
  "chevrons-up-down": wrap('<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>'),
  x: wrap('<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>'),
  "trash-2": wrap('<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>'),
  // ── Ayarlar / Görünüm cockpit ikonları ──
  contrast: wrap('<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12z"/>'),
  palette: wrap('<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>'),
  type: wrap('<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>'),
  sparkles: wrap('<path d="M12 3v4"/><path d="M12 17v4"/><path d="M3 12h4"/><path d="M17 12h4"/><path d="m6.5 6.5 2 2"/><path d="m15.5 15.5 2 2"/><path d="m17.5 6.5-2 2"/><path d="m8.5 15.5-2 2"/>'),
  table: wrap('<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/>'),
  accessibility: wrap('<circle cx="12" cy="4" r="2"/><path d="M19 8 12 10 5 8"/><path d="M12 10v5"/><path d="m8 21 4-6 4 6"/>'),
  "sliders-horizontal": wrap('<line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>'),
  "rotate-ccw": wrap('<path d="M3 12a9 9 0 1 0 2.636-6.364L3 8"/><path d="M3 3v5h5"/>')
};
function icon(name, cls = "icon") {
  const svg = ICONS[name];
  if (!svg) return "";
  return svg.replace("<svg ", `<svg class="${cls}" `);
}

export {
  api,
  BasePage,
  icon
};
//# sourceMappingURL=chunk-5NLMPZFQ.js.map
