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

// public/admin/ts/pages/OvertimePage.ts
var PER_PAGE = 10;
var STATUS_OPTIONS = [
  { value: "", label: "T\xFCm\xFC" },
  { value: "pending", label: "Bekleyen" },
  { value: "approved", label: "Onaylanan" },
  { value: "rejected", label: "Reddedilen" }
];
function statusBadge(status) {
  switch (status) {
    case "approved":
      return '<span class="badge badge-success">Onayland\u0131</span>';
    case "rejected":
      return '<span class="badge badge-error">Reddedildi</span>';
    default:
      return '<span class="badge badge-warning">Bekliyor</span>';
  }
}
function fmtDate(date) {
  return new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
var OvertimePage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.page = 1;
    this.total = 0;
    this.rows = [];
    this.status = "";
  }
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    await this.load();
  }
  async load() {
    try {
      const qs = new URLSearchParams({ page: String(this.page), limit: String(PER_PAGE) });
      if (this.status) qs.set("status", this.status);
      const res = await api.get(
        `/api/v1/overtime?${qs.toString()}`
      );
      this.rows = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Mesai talepleri y\xFCklenemedi", "error");
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
          <select class="input" id="overtime-status" style="max-width:180px">
            ${STATUS_OPTIONS.map((o) => `<option value="${o.value}" ${o.value === this.status ? "selected" : ""}>${o.label}</option>`).join("")}
          </select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} talep</span>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>Tarih</th>
              <th>S\xFCre</th>
              <th>A\xE7\u0131klama</th>
              <th>Durum</th>
            </tr></thead>
            <tbody>
              ${this.rows.length === 0 ? `<tr><td colspan="5" style="text-align:center; color:var(--text-muted)">Mesai talebi bulunamad\u0131</td></tr>` : this.rows.map((r) => `
                  <tr>
                    <td>${cellUser(r.user_name)}</td>
                    <td>${fmtDate(r.date)}</td>
                    <td>${r.hours} Saat</td>
                    <td>${r.description ?? "\u2014"}</td>
                    <td>${statusBadge(r.status)}</td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;
    this.on("#overtime-status", "change", async (e) => {
      this.status = e.target.value;
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
  OvertimePage
};
//# sourceMappingURL=OvertimePage-4VOMQ2S3.js.map
