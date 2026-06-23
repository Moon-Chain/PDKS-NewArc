import {
  bindPagination,
  cellUser,
  paginationControls,
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api,
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/pages/AuditLogPage.ts
var PER_PAGE = 20;
function fmtDateTime(value) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function fmtTarget(table, id) {
  if (!table) return "-";
  if (!id) return table;
  return `${table} \xB7 ${id.slice(0, 8)}\u2026`;
}
var AuditLogPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.page = 1;
    this.total = 0;
    this.rows = [];
    this.actor = "";
    this.action = "";
    this.from = "";
    this.to = "";
  }
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    await this.load();
  }
  async load() {
    try {
      const qs = new URLSearchParams({ page: String(this.page), limit: String(PER_PAGE) });
      if (this.actor) qs.set("actor", this.actor);
      if (this.action) qs.set("action", this.action);
      if (this.from) qs.set("from", this.from);
      if (this.to) qs.set("to", this.to);
      const res = await api.get(
        `/api/v1/admin/audit?${qs.toString()}`
      );
      this.rows = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Aktivite ge\xE7mi\u015Fi y\xFCklenemedi", "error");
      this.rows = [];
      this.total = 0;
    }
    this.draw();
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.total / PER_PAGE));
  }
  draw() {
    this.container.innerHTML = `
      <div class="card">
        <div class="toolbar" style="flex-wrap:wrap; gap:8px">
          <input class="input" id="audit-actor" type="text" placeholder="Akt\xF6r ara..." value="${this.actor}" style="max-width:180px">
          <input class="input" id="audit-action" type="text" placeholder="Eylem (\xF6r. login)" value="${this.action}" style="max-width:160px">
          <input class="input" id="audit-from" type="date" value="${this.from}" style="max-width:160px">
          <input class="input" id="audit-to" type="date" value="${this.to}" style="max-width:160px">
          <button class="btn btn-secondary" id="audit-filter">${icon("search", "icon icon-sm")} Filtrele</button>
          <button class="btn btn-ghost" id="audit-clear">Temizle</button>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} kay\u0131t</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Tarih</th>
              <th>Akt\xF6r</th>
              <th>Eylem</th>
              <th>Hedef</th>
              <th>IP Adresi</th>
            </tr></thead>
            <tbody>
              ${this.rows.length === 0 ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Kay\u0131t bulunamad\u0131</td></tr>` : this.rows.map((r) => `
                  <tr>
                    <td>${fmtDateTime(r.created_at)}</td>
                    <td>${cellUser(r.actor_name)}</td>
                    <td>${r.action}</td>
                    <td>${fmtTarget(r.target_table, r.target_id)}</td>
                    <td>${r.ip_address ?? "-"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;
    this.on("#audit-filter", "click", async () => {
      this.actor = this.$("#audit-actor").value.trim();
      this.action = this.$("#audit-action").value.trim();
      this.from = this.$("#audit-from").value;
      this.to = this.$("#audit-to").value;
      this.page = 1;
      await this.load();
    });
    this.on("#audit-clear", "click", async () => {
      this.actor = "";
      this.action = "";
      this.from = "";
      this.to = "";
      this.page = 1;
      await this.load();
    });
    bindPagination(this.container, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.load();
    });
  }
};
export {
  AuditLogPage
};
//# sourceMappingURL=AuditLogPage-EKX6TCWC.js.map
