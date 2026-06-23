import {
  bindPagination,
  cellUser,
  paginationControls,
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/pages/MovementsPage.ts
var PER_PAGE = 15;
function statusBadge(status) {
  switch (status) {
    case "success":
      return '<span class="badge badge-success">Ba\u015Far\u0131l\u0131</span>';
    case "pending":
      return '<span class="badge badge-warning">Onay Bekliyor</span>';
    default:
      return '<span class="badge badge-error">Hatal\u0131</span>';
  }
}
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
var MovementsPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.page = 1;
    this.total = 0;
    this.rows = [];
    this.month = (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
  }
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    await this.load();
  }
  async load() {
    try {
      const res = await api.get(
        `/api/v1/attendance?page=${this.page}&limit=${PER_PAGE}&month=${this.month}`
      );
      this.rows = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Hareketler y\xFCklenemedi", "error");
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
        <div class="toolbar">
          <input class="input" type="month" id="movements-month" value="${this.month}" style="max-width:160px" />
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} hareket</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>T\xFCr</th>
              <th>Zaman</th>
              <th>Durum</th>
              <th>IP</th>
            </tr></thead>
            <tbody>
              ${this.rows.length === 0 ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Hareket bulunamad\u0131</td></tr>` : this.rows.map((r) => `
                  <tr>
                    <td>${cellUser(r.user_name)}</td>
                    <td>${r.type === "in" ? "Giri\u015F" : "\xC7\u0131k\u0131\u015F"}</td>
                    <td>${formatTime(r.timestamp)}</td>
                    <td>${statusBadge(r.status)}</td>
                    <td>${r.ip_address ?? "\u2014"}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;
    this.on("#movements-month", "change", async (e) => {
      this.month = e.target.value;
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
  MovementsPage
};
//# sourceMappingURL=MovementsPage-K4RYWRGJ.js.map
