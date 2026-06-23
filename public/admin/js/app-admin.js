import {
  applyAppearance
} from "./chunks/chunk-QI5RVIRR.js";
import {
  state
} from "./chunks/chunk-BSM6WVR6.js";
import {
  BasePage,
  api,
  icon
} from "./chunks/chunk-5NLMPZFQ.js";

// public/ts/core/Router.ts
var Router = class {
  constructor(routes2, appContainer) {
    this.current = null;
    this.routes = routes2;
    this.container = appContainer;
    window.addEventListener("popstate", () => this._render(location.pathname));
  }
  async navigate(path) {
    history.pushState(null, "", path);
    await this._render(path);
  }
  prefetch(path) {
    const loader = this.routes[path];
    if (loader) loader().catch(() => {
    });
  }
  async _render(path) {
    if (path.length > 1 && path.endsWith("/")) {
      path = path.slice(0, -1);
    }
    if (!state.get("user") && path !== "/login") {
      return this.navigate("/login");
    }
    if (state.get("user") && path === "/login") {
      return this.navigate("/home");
    }
    const loader = this.routes[path] ?? this.routes["/home"];
    if (!loader) {
      this.container.innerHTML = `
        <div style="padding:40px;text-align:center;color:var(--color-muted)">
          <p>Sayfa bulunamad\u0131</p>
        </div>`;
      return;
    }
    this.current?.destroy();
    this.container.innerHTML = "";
    this.container.classList.add("page-enter");
    setTimeout(() => this.container.classList.remove("page-enter"), 200);
    let PageClass;
    try {
      PageClass = await loader();
    } catch {
      this.container.innerHTML = `
        <div style="padding:40px;text-align:center">
          <p style="color:var(--color-muted);margin-bottom:16px">Sayfa y\xFCklenemedi.</p>
          <button class="btn btn-primary" onclick="location.reload()">Yenile</button>
        </div>`;
      return;
    }
    this.current = new PageClass(this.container);
    await this.current.render();
  }
};

// public/ts/core/BaseComponent.ts
var BaseComponent = class {
  constructor(props = {}) {
    this.el = null;
    this.props = props;
  }
  afterMount() {
  }
  mount(container) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = this.template();
    const child = wrapper.firstElementChild;
    if (child) {
      container.appendChild(child);
      this.el = child;
      this.afterMount();
    }
    return this;
  }
  unmount() {
    this.el?.remove();
    this.el = null;
  }
  $(selector) {
    return this.el?.querySelector(selector) ?? null;
  }
};

// public/admin/ts/pages/PlaceholderPage.ts
function makeAdminPlaceholder(title, note) {
  return class extends BasePage {
    async render() {
      this.container.innerHTML = `
        <div class="card locked-module">
          <div class="lock-icon">${icon("lock", "icon icon-lg")}</div>
          <h3>${title}</h3>
          <p>${note}</p>
        </div>
      `;
    }
  };
}

// public/admin/ts/moduleRegistry.ts
var ADMIN_MODULES = [
  // ── Operasyon ──────────────────────────────────────────────
  {
    id: "dashboard",
    label: "Genel Bak\u0131\u015F",
    icon: "layout-dashboard",
    path: "/admin",
    permission: "dashboard:view",
    group: "operasyon",
    title: "Genel Bak\u0131\u015F",
    subtitle: "\u015Eirketinizin g\xFCnl\xFCk \xF6zeti",
    loader: async () => (await import("./chunks/DashboardPage-WCGEAETO.js")).DashboardPage
  },
  {
    id: "movements",
    label: "Hareketler",
    icon: "clock",
    path: "/admin/movements",
    permission: "attendance:view",
    group: "operasyon",
    title: "Hareketler",
    subtitle: "T\xFCm personelin giri\u015F/\xE7\u0131k\u0131\u015F kay\u0131tlar\u0131",
    loader: async () => (await import("./chunks/MovementsPage-K4RYWRGJ.js")).MovementsPage
  },
  {
    id: "approvals",
    label: "Onaylar",
    icon: "check-check",
    path: "/admin/approvals",
    permission: "leave:approve",
    group: "operasyon",
    title: "Onaylar",
    subtitle: "Bekleyen izin ve mesai talepleri",
    loader: async () => (await import("./chunks/ApprovalsPage-HY6WGBLD.js")).ApprovalsPage
  },
  // ── İnsan Kaynakları ───────────────────────────────────────
  {
    id: "users",
    label: "Personel",
    icon: "users",
    path: "/admin/users",
    permission: "user:manage",
    group: "insan-kaynaklari",
    title: "Personel",
    subtitle: "Personel listesi ve y\xF6netimi",
    loader: async () => (await import("./chunks/UsersPage-YWZ7PDP5.js")).UsersPage
  },
  {
    id: "leaves",
    label: "\u0130zinler",
    icon: "calendar-days",
    path: "/admin/leaves",
    permission: "leave:view",
    group: "insan-kaynaklari",
    title: "\u0130zinler",
    subtitle: "\u0130zin talepleri ve bakiyeler",
    loader: async () => (await import("./chunks/LeavesPage-TNHK35QP.js")).LeavesPage
  },
  {
    id: "overtime",
    label: "Mesai",
    icon: "zap",
    path: "/admin/overtime",
    permission: "overtime:view",
    group: "insan-kaynaklari",
    title: "Mesai",
    subtitle: "Mesai talepleri ve kay\u0131tlar\u0131",
    loader: async () => (await import("./chunks/OvertimePage-4VOMQ2S3.js")).OvertimePage
  },
  {
    id: "reports",
    label: "Raporlar",
    icon: "file-spreadsheet",
    path: "/admin/reports",
    permission: "reports:view",
    group: "insan-kaynaklari",
    title: "Raporlar",
    subtitle: "Excel raporu indir",
    loader: async () => (await import("./chunks/ReportsPage-OXJEXRZT.js")).ReportsPage
  },
  // ── Ayarlar ────────────────────────────────────────────────
  {
    id: "holidays",
    label: "Tatil G\xFCnleri",
    icon: "sun",
    path: "/admin/holidays",
    permission: "settings:view",
    group: "ayarlar",
    title: "Tatil G\xFCnleri",
    subtitle: "Resmi ve \u015Firket tatilleri",
    loader: async () => (await import("./chunks/HolidaysPage-TR32XOKO.js")).HolidaysPage
  },
  {
    id: "settings",
    label: "\u015Eirket Ayarlar\u0131",
    icon: "settings",
    path: "/admin/settings",
    permission: "settings:manage",
    group: "ayarlar",
    title: "\u015Eirket Ayarlar\u0131",
    subtitle: "Ofis IP, vardiya, mola kurallar\u0131",
    loader: async () => (await import("./chunks/SettingsPage-Y5SDVPR4.js")).SettingsPage
  },
  // ── Sistem ─────────────────────────────────────────────────
  {
    id: "audit",
    label: "Aktivite Ge\xE7mi\u015Fi",
    icon: "history",
    path: "/admin/audit",
    permission: "audit:view",
    group: "sistem",
    title: "Aktivite Ge\xE7mi\u015Fi",
    subtitle: "Kim ne zaman ne yapt\u0131",
    loader: async () => (await import("./chunks/AuditLogPage-EKX6TCWC.js")).AuditLogPage
  },
  {
    id: "branches",
    label: "\u015Eubeler",
    icon: "map-pin",
    path: "/admin/branches",
    permission: "branch:manage",
    group: "sistem",
    title: "\u015Eubeler",
    subtitle: "\u015Eube y\xF6netimi",
    locked: { note: "Kademe 1" },
    loader: () => Promise.resolve(makeAdminPlaceholder(
      "\u015Eube Sistemi",
      "Bu mod\xFCl Kademe 1 kapsam\u0131nda eklenecek. Birden fazla \u015Fubesi olan \u015Firketler i\xE7in \u015Fube bazl\u0131 personel ve hareket filtrelemesi sa\u011Flayacak."
    ))
  },
  {
    id: "roles",
    label: "Rol & Yetki",
    icon: "shield",
    path: "/admin/roles",
    permission: "role:manage",
    group: "sistem",
    title: "Rol & Yetki",
    subtitle: "\xD6zel roller ve izin atamalar\u0131",
    locked: { note: "Kademe 2" },
    loader: () => Promise.resolve(makeAdminPlaceholder(
      "Rol & Yetki Y\xF6netimi",
      "Bu mod\xFCl Kademe 2 kapsam\u0131nda eklenecek. RBAC veritaban\u0131 (roller, izinler) zaten haz\u0131r \u2014 bu sayfa admin'in \xF6zel roller olu\u015Fturup yetki atamas\u0131 yapmas\u0131n\u0131 sa\u011Flayacak."
    ))
  },
  {
    id: "billing",
    label: "Plan & Faturalama",
    icon: "credit-card",
    path: "/admin/billing",
    permission: "billing:manage",
    group: "sistem",
    title: "Plan & Faturalama",
    subtitle: "Abonelik ve fatura y\xF6netimi",
    locked: { note: "Kademe 3" },
    loader: () => Promise.resolve(makeAdminPlaceholder(
      "Plan & Faturalama",
      "Bu mod\xFCl Kademe 3 (SaaS) kapsam\u0131nda eklenecek. Abonelik plan\u0131, kota ve fatura y\xF6netimi burada olacak."
    ))
  }
];
var ADMIN_GROUP_LABELS = {
  operasyon: "Operasyon",
  "insan-kaynaklari": "\u0130nsan Kaynaklar\u0131",
  ayarlar: "Ayarlar",
  sistem: "Sistem"
};
var ADMIN_EXTRA_ROUTES = [
  {
    id: "notifications",
    label: "Bildirimler",
    icon: "bell",
    path: "/admin/notifications",
    permission: "dashboard:view",
    group: "operasyon",
    title: "Bildirimler",
    subtitle: "T\xFCm bildirimleriniz",
    loader: async () => (await import("./chunks/NotificationsPage-TFE6JPIN.js")).NotificationsPage
  }
];
function findAdminModule(path) {
  return ADMIN_MODULES.find((m) => m.path === path) ?? ADMIN_EXTRA_ROUTES.find((m) => m.path === path);
}

// public/admin/ts/layout/Sidebar.ts
var GROUP_ORDER = ["operasyon", "insan-kaynaklari", "ayarlar", "sistem"];
var Sidebar = class extends BaseComponent {
  constructor(activePath) {
    super({});
    this.activePath = activePath;
  }
  template() {
    const profile = state.get("profile");
    const name = profile?.name ?? "";
    const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "A";
    const roleLabel = profile?.role === "admin" ? "Tam Yetkili Admin" : profile?.role ?? "";
    const groups = GROUP_ORDER.map((group) => {
      const items = ADMIN_MODULES.filter((m) => m.group === group);
      if (!items.length) return "";
      return `
        <div class="nav-group">
          <div class="nav-group-label">${ADMIN_GROUP_LABELS[group]}</div>
          ${items.map((item) => `
            <div class="nav-item ${item.path === this.activePath ? "active" : ""} ${item.locked ? "locked" : ""}"
                 data-path="${item.locked ? "" : item.path}"
                 data-label="${item.label}"
                 title="${item.locked ? "Hen\xFCz aktif de\u011Fil \u2014 " + item.locked.note : ""}">
              <span class="nav-icon">${icon(item.icon)}</span>
              <span>${item.label}</span>
              ${item.locked ? `<span class="nav-badge">${item.locked.note}</span>` : ""}
            </div>
          `).join("")}
        </div>
      `;
    }).join("");
    return `
      <aside class="sidebar" id="admin-sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">P</div>
          <div class="logo-text">
            <strong>PDKS Admin</strong>
            <span>Y\xF6netim Paneli</span>
          </div>
        </div>

        <nav class="sidebar-nav">${groups}</nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="avatar">${initials}</div>
            <div class="user-info">
              <strong>${name}</strong>
              <span>${roleLabel}</span>
            </div>
            <span class="user-caret">${icon("chevrons-up-down", "icon icon-sm")}</span>
          </div>
        </div>
      </aside>
    `;
  }
  afterMount() {
    this.$$(".nav-item[data-path]").forEach((el) => {
      const path = el.getAttribute("data-path");
      if (!path) return;
      el.addEventListener("click", () => {
        window.router?.navigate(path);
      });
    });
  }
  $$(selector) {
    return this.el?.querySelectorAll(selector) ?? document.querySelectorAll(".never-match");
  }
  setActive(path) {
    this.activePath = path;
    this.$$(".nav-item").forEach((el) => el.classList.remove("active"));
    const target = this.$$(".nav-item[data-path]");
    target.forEach((el) => {
      if (el.getAttribute("data-path") === path) el.classList.add("active");
    });
  }
};

// public/ts/core/EventBus.ts
var EventBus = class {
  constructor() {
    this._listeners = {};
  }
  on(event, fn) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) {
    this._listeners[event] = this._listeners[event]?.filter((f) => f !== fn);
  }
  emit(event, data) {
    this._listeners[event]?.forEach((fn) => fn(data));
  }
};
var bus = new EventBus();

// public/admin/ts/layout/AdminNotifPanel.ts
var TYPE_ICON = { success: "\u2713", error: "\u2717", warning: "\u26A0", info: "\u2139" };
var TYPE_CLASS = {
  success: "ap-notif-item--success",
  error: "ap-notif-item--error",
  warning: "ap-notif-item--warning",
  info: "ap-notif-item--info"
};
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4);
  if (m < 1) return "Az \xF6nce";
  if (m < 60) return `${m}dk \xF6nce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa \xF6nce`;
  return `${Math.floor(h / 24)}g \xF6nce`;
}
var AdminNotifPanel = class {
  constructor() {
    this.bellEl = null;
    this.dotEl = null;
    this.panelEl = null;
    this.rows = [];
    this.unread = 0;
    this.open = false;
    this.onOutsideClick = (e) => {
      if (!this.panelEl) return;
      if (!this.panelEl.contains(e.target) && !this.bellEl?.contains(e.target)) {
        this.closePanel();
      } else {
        document.addEventListener("click", this.onOutsideClick, { once: true, capture: true });
      }
    };
  }
  mount(bellEl, dotEl) {
    this.bellEl = bellEl;
    this.dotEl = dotEl;
    bellEl.addEventListener("click", (e) => {
      e.stopPropagation();
      this.open ? this.closePanel() : this.openPanel();
    });
    this.load();
    bus.on("sse:notification", (data) => {
      this.rows.unshift(data);
      this.unread++;
      this.updateDot();
      if (this.open) this.renderList();
    });
  }
  async load() {
    try {
      const res = await api.get("/api/v1/notifications");
      this.rows = res.rows;
      this.unread = res.unread;
      this.updateDot();
    } catch {
    }
  }
  openPanel() {
    this.open = true;
    if (!this.panelEl) {
      this.panelEl = document.createElement("div");
      this.panelEl.className = "ap-notif-panel";
      document.body.appendChild(this.panelEl);
    }
    this.renderList();
    setTimeout(() => {
      document.addEventListener("click", this.onOutsideClick, { once: true, capture: true });
    }, 0);
  }
  closePanel() {
    this.open = false;
    this.panelEl?.remove();
    this.panelEl = null;
    document.removeEventListener("click", this.onOutsideClick, true);
  }
  renderList() {
    if (!this.panelEl) return;
    const bellRect = this.bellEl?.getBoundingClientRect();
    const top = (bellRect?.bottom ?? 60) + 8;
    if (window.innerWidth < 480) {
      this.panelEl.style.top = `${top}px`;
      this.panelEl.style.left = "8px";
      this.panelEl.style.right = "8px";
      this.panelEl.style.width = "auto";
    } else {
      const right = window.innerWidth - (bellRect?.right ?? 60);
      this.panelEl.style.top = `${top}px`;
      this.panelEl.style.left = "";
      this.panelEl.style.right = `${Math.max(4, right - 8)}px`;
      this.panelEl.style.width = "360px";
    }
    this.panelEl.innerHTML = `
      <div class="ap-notif-panel-header">
        <span class="ap-notif-panel-title">${icon("bell", "icon icon-sm")} Bildirimler</span>
        <div class="ap-notif-panel-actions">
          ${this.unread > 0 ? `<button class="ap-notif-read-all-btn" id="ap-notif-read-all" type="button">${icon("check", "icon icon-sm")} T\xFCm\xFCn\xFC Oku</button>` : ""}
          <button class="ap-notif-close-btn" id="ap-notif-close" type="button">${icon("x", "icon icon-sm")}</button>
        </div>
      </div>
      <div class="ap-notif-list">
        ${this.rows.length === 0 ? `<div class="ap-notif-empty">
               <div class="ap-notif-empty-icon">${icon("bell", "icon icon-lg")}</div>
               <p>Bildirim yok</p>
             </div>` : this.rows.map((n) => `
              <div class="ap-notif-item ${TYPE_CLASS[n.type] ?? ""} ${n.is_read ? "" : "ap-notif-item--unread"}"
                   data-id="${n.id}" data-link="${n.link ?? ""}">
                <div class="ap-notif-item-dot">${TYPE_ICON[n.type] ?? "\u2139"}</div>
                <div class="ap-notif-item-body">
                  <p class="ap-notif-item-title">${n.title}</p>
                  <p class="ap-notif-item-msg">${n.message}</p>
                  <p class="ap-notif-item-time">${timeAgo(n.created_at)}</p>
                </div>
                <button class="ap-notif-del-btn" data-del="${n.id}" type="button" title="Sil">${icon("x", "icon icon-sm")}</button>
              </div>
            `).join("")}
      </div>
      <div class="ap-notif-panel-footer">
        <button class="ap-notif-view-all-btn" id="ap-notif-view-all" type="button">T\xFCm\xFCn\xFC G\xF6r</button>
      </div>
    `;
    const readAllBtn = this.panelEl.querySelector("#ap-notif-read-all");
    if (readAllBtn) {
      readAllBtn.onclick = async (e) => {
        e.stopPropagation();
        await api.post("/api/v1/notifications/read-all", {}).catch(() => {
        });
        this.rows.forEach((r) => r.is_read = true);
        this.unread = 0;
        this.updateDot();
        this.renderList();
      };
    }
    const closeBtn = this.panelEl.querySelector("#ap-notif-close");
    if (closeBtn) closeBtn.onclick = () => this.closePanel();
    this.panelEl.querySelectorAll(".ap-notif-item").forEach((item) => {
      item.onclick = async (e) => {
        if (e.target.closest(".ap-notif-del-btn")) return;
        const id = item.dataset.id;
        const link = item.dataset.link;
        if (item.classList.contains("ap-notif-item--unread")) {
          await api.patch(`/api/v1/notifications/${id}/read`, {}).catch(() => {
          });
          const row = this.rows.find((r) => r.id === id);
          if (row && !row.is_read) {
            row.is_read = true;
            this.unread = Math.max(0, this.unread - 1);
          }
          this.updateDot();
          item.classList.remove("ap-notif-item--unread");
        }
        if (link) {
          this.closePanel();
          window.router?.navigate(link);
        }
      };
    });
    this.panelEl.querySelectorAll(".ap-notif-del-btn").forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const id = btn.dataset.del;
        await api.delete(`/api/v1/notifications/${id}`).catch(() => {
        });
        const idx = this.rows.findIndex((r) => r.id === id);
        if (idx !== -1) {
          if (!this.rows[idx].is_read) this.unread = Math.max(0, this.unread - 1);
          this.rows.splice(idx, 1);
        }
        this.updateDot();
        this.renderList();
      };
    });
    const viewAllBtn = this.panelEl.querySelector("#ap-notif-view-all");
    if (viewAllBtn) {
      viewAllBtn.onclick = () => {
        this.closePanel();
        window.router?.navigate("/admin/notifications");
      };
    }
  }
  updateDot() {
    if (!this.dotEl) return;
    this.dotEl.style.display = this.unread > 0 ? "" : "none";
  }
  destroy() {
    this.closePanel();
  }
};

// public/admin/ts/layout/AdminTopBar.ts
var AdminTopBar = class extends BaseComponent {
  constructor(opts) {
    super({});
    this.opts = opts;
    this.notifPanel = null;
  }
  template() {
    const railIcon = this.opts.railCollapsed ? "panel-left-open" : "panel-left-close";
    return `
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn btn-ghost icon-btn sidebar-toggle" aria-label="Men\xFCy\xFC a\xE7/kapat" id="admin-menu-toggle">
            ${icon("menu")}
          </button>
          <button class="topbar-icon rail-toggle" aria-label="Kenar \xE7ubu\u011Funu daralt/geni\u015Flet" title="Kenar \xE7ubu\u011Funu daralt/geni\u015Flet" id="admin-rail-toggle">
            ${icon(railIcon)}
          </button>
          <div>
            <h1 id="admin-page-title">${this.opts.title}</h1>
            <div class="topbar-sub" id="admin-page-sub">${this.opts.subtitle}</div>
          </div>
        </div>

        <div class="topbar-search">
          <span class="search-ico">${icon("search", "icon icon-sm")}</span>
          <input type="text" placeholder="Personel, kay\u0131t veya sayfa ara\u2026" aria-label="Ara" />
          <span class="search-kbd">\u2318K</span>
        </div>

        <div class="topbar-actions">
          <button class="topbar-icon" id="admin-notif-bell" aria-label="Bildirimler" title="Bildirimler">
            ${icon("bell")}
            <span class="dot" id="admin-notif-dot" style="display:none"></span>
          </button>
          <button class="topbar-icon" id="admin-logout" aria-label="\xC7\u0131k\u0131\u015F Yap" title="\xC7\u0131k\u0131\u015F Yap">
            ${icon("log-out")}
          </button>
        </div>
      </header>
    `;
  }
  afterMount() {
    this.$("#admin-menu-toggle")?.addEventListener("click", () => this.opts.onMenuToggle());
    this.$("#admin-rail-toggle")?.addEventListener("click", () => this.opts.onRailToggle());
    this.$("#admin-logout")?.addEventListener("click", async () => {
      try {
        await api.post("/api/v1/auth/logout");
      } catch {
      }
      state.set("user", null);
      state.set("profile", null);
      location.href = "/login";
    });
    const bellEl = this.$("#admin-notif-bell");
    if (bellEl) {
      this.notifPanel = new AdminNotifPanel();
      this.notifPanel.mount(bellEl, this.$("#admin-notif-dot"));
    }
  }
  setRailCollapsed(collapsed) {
    const btn = this.$("#admin-rail-toggle");
    if (!btn) return;
    btn.innerHTML = icon(collapsed ? "panel-left-open" : "panel-left-close");
  }
  setTitle(title, subtitle) {
    const titleEl = this.$("#admin-page-title");
    const subEl = this.$("#admin-page-sub");
    if (titleEl) titleEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
  }
};

// public/admin/ts/layout/AdminLayout.ts
var RAIL_STORAGE_KEY = "pdks-admin-sidebar";
var AdminLayout = class {
  constructor(container, initialPath) {
    this.sidebarEl = null;
    this.overlayEl = null;
    this.railCollapsed = localStorage.getItem(RAIL_STORAGE_KEY) === "collapsed";
    const mod = findAdminModule(initialPath);
    this.shellEl = document.createElement("div");
    this.shellEl.className = "admin-shell";
    this.shellEl.setAttribute("data-sidebar", this.railCollapsed ? "collapsed" : "expanded");
    this.overlayEl = document.createElement("div");
    this.overlayEl.className = "sidebar-overlay";
    this.shellEl.appendChild(this.overlayEl);
    this.sidebar = new Sidebar(initialPath);
    this.sidebar.mount(this.shellEl);
    this.sidebarEl = this.shellEl.querySelector("#admin-sidebar");
    const main = document.createElement("div");
    this.shellEl.appendChild(main);
    this.topbar = new AdminTopBar({
      title: mod?.title ?? "",
      subtitle: mod?.subtitle ?? "",
      railCollapsed: this.railCollapsed,
      onMenuToggle: () => this.toggleMobileSidebar(),
      onRailToggle: () => this.toggleRail()
    });
    this.topbar.mount(main);
    this.contentEl = document.createElement("main");
    this.contentEl.className = "content page-enter";
    main.appendChild(this.contentEl);
    this.overlayEl.addEventListener("click", () => this.closeMobileSidebar());
    container.innerHTML = "";
    container.appendChild(this.shellEl);
  }
  setActivePage(path) {
    this.sidebar.setActive(path);
    const mod = findAdminModule(path);
    this.topbar.setTitle(mod?.title ?? "", mod?.subtitle ?? "");
    this.closeMobileSidebar();
  }
  toggleRail() {
    this.railCollapsed = !this.railCollapsed;
    this.shellEl.setAttribute("data-sidebar", this.railCollapsed ? "collapsed" : "expanded");
    localStorage.setItem(RAIL_STORAGE_KEY, this.railCollapsed ? "collapsed" : "expanded");
    this.topbar.setRailCollapsed(this.railCollapsed);
  }
  toggleMobileSidebar() {
    this.sidebarEl?.classList.toggle("open");
    this.overlayEl?.classList.toggle("open");
  }
  closeMobileSidebar() {
    this.sidebarEl?.classList.remove("open");
    this.overlayEl?.classList.remove("open");
  }
};

// public/ts/core/EventStream.ts
var EventStream = class {
  constructor() {
    this.es = null;
    this.retryDelay = 3e3;
    this.maxRetry = 3e4;
  }
  connect() {
    if (this.es) return;
    this._open();
  }
  disconnect() {
    this.es?.close();
    this.es = null;
  }
  _open() {
    this.es = new EventSource("/api/v1/events", { withCredentials: true });
    this.es.addEventListener("connected", () => {
      this.retryDelay = 3e3;
      bus.emit("sse:connected", null);
    });
    this.es.addEventListener("attendance", (e) => {
      try {
        bus.emit("sse:attendance", JSON.parse(e.data));
      } catch {
      }
    });
    this.es.addEventListener("notification", (e) => {
      try {
        bus.emit("sse:notification", JSON.parse(e.data));
      } catch {
      }
    });
    this.es.onerror = () => {
      this.es?.close();
      this.es = null;
      bus.emit("sse:disconnected", null);
      setTimeout(() => this._open(), this.retryDelay);
      this.retryDelay = Math.min(this.retryDelay * 1.5, this.maxRetry);
    };
  }
};
var eventStream = new EventStream();

// public/admin/ts/app-admin.ts
applyAppearance();
var routes = {};
for (const mod of [...ADMIN_MODULES, ...ADMIN_EXTRA_ROUTES]) {
  routes[mod.path] = mod.loader;
}
async function init() {
  const app = document.getElementById("admin-app");
  if (!app) throw new Error("#admin-app bulunamad\u0131");
  const profile = await api.get("/api/v1/auth/me").catch(() => null);
  if (!profile || !("id" in profile)) {
    window.location.href = "/login";
    return;
  }
  if (profile.role !== "admin") {
    window.location.href = "/";
    return;
  }
  state.set("user", { id: profile.id, role: profile.role, company_id: profile.company_id });
  state.set("profile", profile);
  eventStream.connect();
  const layout = new AdminLayout(app, location.pathname);
  const router = new Router(routes, layout.contentEl);
  window.router = router;
  const origNavigate = router.navigate.bind(router);
  router.navigate = async (path) => {
    await origNavigate(path);
    layout.setActivePage(path);
  };
  await router._render(location.pathname);
  layout.setActivePage(location.pathname);
}
window.onerror = (msg, src, line, col, err) => {
  console.error("[PDKS Admin] Global hata:", { msg, src, line, col, err });
};
window.addEventListener("unhandledrejection", (ev) => {
  console.error("[PDKS Admin] \u0130\u015Flenmemi\u015F Promise hatas\u0131:", ev.reason);
});
init().catch((err) => {
  console.error("Admin paneli ba\u015Flat\u0131lamad\u0131:", err);
  const app = document.getElementById("admin-app");
  if (app) {
    app.innerHTML = `<div style="padding:40px;text-align:center;color:#ef4444;">
      Admin paneli ba\u015Flat\u0131lamad\u0131. Sayfay\u0131 yenileyin.
    </div>`;
  }
});
//# sourceMappingURL=app-admin.js.map
