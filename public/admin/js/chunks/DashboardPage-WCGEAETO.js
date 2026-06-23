import {
  state
} from "./chunk-BSM6WVR6.js";
import {
  openModal,
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api,
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/pages/DashboardPage.ts
var ACTION_LABELS = {
  approve: "onaylad\u0131",
  reject: "reddetti",
  update: "g\xFCncelledi",
  delete: "sildi",
  create: "olu\u015Fturdu",
  login: "giri\u015F yapt\u0131"
};
function statCard(iconName, label, value, foot, theme, modalType) {
  return `
    <div class="card stat-card stat-theme-${theme}${modalType ? " stat-card-clickable" : ""}" ${modalType ? `data-stat-modal="${modalType}"` : ""}>
      <div class="stat-top">
        <span class="stat-label">${label}</span>
        <span class="stat-icon stat-icon-${theme}">${icon(iconName)}</span>
      </div>
      <div class="stat-value tnum">${value}</div>
      <div class="stat-foot">${foot}</div>
    </div>`;
}
function activityItem(actor, action, time) {
  return `
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${actor}</strong> ${action}</div>
        <div class="activity-time">${time}</div>
      </div>
    </div>`;
}
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4);
  if (m < 1) return "Az \xF6nce";
  if (m < 60) return `${m} dk \xF6nce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} sa \xF6nce`;
  return `${Math.floor(h / 24)} g\xFCn \xF6nce`;
}
function fmtRange(start, end) {
  const opts = { day: "2-digit", month: "2-digit" };
  const s = new Date(start).toLocaleDateString("tr-TR", opts);
  const e = new Date(end).toLocaleDateString("tr-TR", opts);
  return s === e ? s : `${s} - ${e}`;
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
var DashboardPage = class extends BasePage {
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    let data = null;
    try {
      data = await api.get("/api/v1/admin/dashboard");
    } catch (err) {
      toast(err instanceof Error ? err.message : "G\xF6sterge paneli y\xFCklenemedi", "error");
    }
    if (!data) {
      this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Veriler y\xFCklenemedi.</p></div>`;
      return;
    }
    const profile = state.get("profile");
    const firstName = (profile?.name ?? "").split(" ")[0] || "";
    const pendingTotal = data.pendingLeaves + data.pendingOvertime;
    const maxDept = Math.max(1, ...data.departments.map((d) => d.count));
    const today = (/* @__PURE__ */ new Date()).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" });
    const presentPct = data.totalStaff > 0 ? Math.round(data.present / data.totalStaff * 100) : 0;
    this.container.innerHTML = `
      <div class="greeting">
        <div>
          <h2>\u0130yi g\xFCnler, ${firstName}</h2>
          <div class="greeting-sub">\u015Eu an ofiste <strong>${data.present}</strong> ki\u015Fi var \xB7 <strong>${pendingTotal}</strong> talep onay\u0131n\u0131z\u0131 bekliyor</div>
        </div>
        <div class="greeting-date">${icon("calendar-days")} <span>${today}</span></div>
      </div>

      <div class="stat-grid">
        ${statCard("door-open", "\u015Eu An \u0130\xE7eride", `${data.present} / ${data.totalStaff}`, `Personelin %${presentPct}'i ofiste`, "info", "inside")}
        ${statCard("inbox", "Bekleyen Onaylar", `${pendingTotal}`, `${data.pendingLeaves} izin \xB7 ${data.pendingOvertime} mesai talebi`, "warning", "pending")}
        ${statCard("palmtree", "Bug\xFCn \u0130zinli", `${data.onLeave}`, data.onLeaveList.map((o) => o.name).join(", ") || "Yok", "success", "onleave")}
        ${statCard("users", "Toplam Personel", `${data.totalStaff}`, `${data.departments.length} departman`, "accent", "total")}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">
            <span>Son Aktiviteler</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/audit">${icon("arrow-right", "icon icon-sm")} T\xFCm Ge\xE7mi\u015Fi G\xF6r</button>
          </div>
          <div class="activity-list">
            ${data.recentActivity.length === 0 ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Aktivite kayd\u0131 yok</p>` : data.recentActivity.map((a) => activityItem(
      a.actor,
      `${ACTION_LABELS[a.action] ?? a.action}${a.target_table ? " \xB7 " + a.target_table : ""}`,
      timeAgo(a.created_at)
    )).join("")}
          </div>
        </div>

        <div class="card">
          <div class="card-title">H\u0131zl\u0131 Eri\u015Fim</div>
          <div style="display:flex; flex-direction:column; gap: var(--space-2)">
            <button class="btn btn-primary" style="justify-content:flex-start" data-nav="/admin/users">${icon("user-plus")} Yeni Personel Ekle</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/approvals">${icon("inbox")} Bekleyen Onaylar\u0131 G\xF6r</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/reports">${icon("download")} Ayl\u0131k Excel Raporu \u0130ndir</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/holidays">${icon("calendar-plus")} Tatil G\xFCn\xFC Ekle</button>
          </div>
        </div>
      </div>

      <div class="widget-grid">
        <div class="card">
          <div class="card-title">
            <span>Bekleyen \u0130zin Talepleri</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/approvals">${icon("arrow-right", "icon icon-sm")}</button>
          </div>
          <div class="widget-list">
            ${data.pendingLeaveRows.length === 0 ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Bekleyen izin talebi yok</p>` : data.pendingLeaveRows.map((l) => `
                  <div class="widget-row">
                    <span>${l.name}</span>
                    <span class="widget-meta">${fmtRange(l.start_date, l.end_date)} \xB7 ${l.days} g\xFCn</span>
                  </div>`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/leaves">${icon("calendar-days", "icon icon-sm")} T\xFCm \u0130zinleri G\xF6r</button>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Yakla\u015Fan Tatiller</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/holidays">${icon("arrow-right", "icon icon-sm")}</button>
          </div>
          <div class="widget-list">
            ${data.upcomingHolidays.length === 0 ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Yakla\u015Fan tatil yok</p>` : data.upcomingHolidays.map((h) => `
                  <div class="widget-row">
                    <span>${h.name}</span>
                    <span class="widget-meta">${fmtDate(h.date)}</span>
                  </div>`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/holidays">${icon("sun", "icon icon-sm")} T\xFCm Tatilleri G\xF6r</button>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Departman Da\u011F\u0131l\u0131m\u0131</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/users">${icon("arrow-right", "icon icon-sm")}</button>
          </div>
          <div class="widget-list">
            ${data.departments.length === 0 ? `<p style="color:var(--text-muted); padding: var(--space-2) 0">Personel kayd\u0131 yok</p>` : data.departments.map((d) => `
                  <div class="widget-row">
                    <span>${d.dept}</span>
                    <div class="dept-bar"><div class="dept-bar-fill" style="width:${d.count / maxDept * 100}%"></div></div>
                    <span class="widget-meta">${d.count}</span>
                  </div>`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/users">${icon("users", "icon icon-sm")} T\xFCm Personeli G\xF6r</button>
        </div>
      </div>
    `;
    this.$$("[data-nav]").forEach((el) => {
      el.addEventListener("click", () => {
        const path = el.getAttribute("data-nav");
        if (path) this.navigate(path);
      });
    });
    this.$$("[data-stat-modal]").forEach((el) => {
      el.addEventListener("click", () => {
        const type = el.getAttribute("data-stat-modal");
        if (type) this.openStatModal(type, data, maxDept);
      });
    });
  }
  navigate(path) {
    window.router?.navigate(path);
  }
  openStatModal(type, data, maxDept) {
    if (type === "inside") {
      const rows = data.presentList.map((p) => `
        <div class="widget-row"><span>${p.name}</span><span class="widget-meta">${p.detail}</span></div>`).join("");
      const { close } = openModal("\u015Eu An \u0130\xE7eride", `
        <div class="widget-list">${rows || '<div class="widget-row"><span class="widget-meta">\u0130\xE7eride kimse yok</span></div>'}</div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon("clock", "icon icon-sm")} T\xFCm Hareketleri G\xF6r</button>
      `);
      this.bindStatModalNav(close, "/admin/movements");
    } else if (type === "pending") {
      const leaveRows = data.pendingLeaveRows.map((l) => `
        <div class="widget-row"><span>${l.name}</span><span class="widget-meta">${fmtRange(l.start_date, l.end_date)} \xB7 ${l.days} g\xFCn</span></div>`).join("");
      const overtimeRows = data.pendingOvertimeRows.map((o) => `
        <div class="widget-row"><span>${o.name}</span><span class="widget-meta">${fmtDate(o.date)} \xB7 ${o.hours} saat</span></div>`).join("");
      const { close } = openModal("Bekleyen Onaylar", `
        <div class="modal-section-title">\u0130zin Talepleri (${data.pendingLeaves})</div>
        <div class="widget-list">${leaveRows || '<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
        <div class="modal-section-title">Mesai Talepleri (${data.pendingOvertime})</div>
        <div class="widget-list">${overtimeRows || '<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
        <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon("check-check", "icon icon-sm")} Onaylar Sayfas\u0131na Git</button>
      `);
      this.bindStatModalNav(close, "/admin/approvals");
    } else if (type === "onleave") {
      const rows = data.onLeaveList.map((o) => `
        <div class="widget-row"><span>${o.name}</span><span class="widget-meta">${o.detail}</span></div>`).join("");
      const { close } = openModal("Bug\xFCn \u0130zinli", `
        <div class="widget-list">${rows || '<div class="widget-row"><span class="widget-meta">Bug\xFCn izinli kimse yok</span></div>'}</div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon("calendar-days", "icon icon-sm")} T\xFCm \u0130zinleri G\xF6r</button>
      `);
      this.bindStatModalNav(close, "/admin/leaves");
    } else if (type === "total") {
      const deptRows = data.departments.map((d) => `
        <div class="widget-row">
          <span>${d.dept}</span>
          <div class="dept-bar"><div class="dept-bar-fill" style="width:${d.count / maxDept * 100}%"></div></div>
          <span class="widget-meta">${d.count}</span>
        </div>`).join("");
      const { close } = openModal("Toplam Personel", `
        <div class="modal-section-title">Departmana G\xF6re</div>
        <div class="widget-list">${deptRows || '<div class="widget-row"><span class="widget-meta">Personel kayd\u0131 yok</span></div>'}</div>
        <div class="modal-section-title">Role G\xF6re</div>
        <div class="widget-list">
          <div class="widget-row"><span>Y\xF6netici</span><span class="widget-meta">${data.roleCounts.admin}</span></div>
          <div class="widget-row"><span>M\xFCd\xFCr</span><span class="widget-meta">${data.roleCounts.mudur}</span></div>
          <div class="widget-row"><span>Tak\u0131m Lideri</span><span class="widget-meta">${data.roleCounts.takim_lideri}</span></div>
          <div class="widget-row"><span>Personel</span><span class="widget-meta">${data.roleCounts.personel}</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${icon("users", "icon icon-sm")} T\xFCm Personeli G\xF6r</button>
      `);
      this.bindStatModalNav(close, "/admin/users");
    }
  }
  bindStatModalNav(close, path) {
    document.getElementById("stat-modal-nav")?.addEventListener("click", () => {
      close();
      this.navigate(path);
    });
  }
};
export {
  DashboardPage
};
//# sourceMappingURL=DashboardPage-WCGEAETO.js.map
