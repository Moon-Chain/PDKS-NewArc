import {
  bindPagination,
  paginationControls,
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api,
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/pages/ReportsPage.ts
var PER_PAGE = 6;
var TARGET_LABELS = {
  attendance: "Devam Raporu",
  leaves: "\u0130zin Raporu"
};
function fmtDateTime(value) {
  return new Date(value).toLocaleString("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
function currentMonth() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 7);
}
var ReportsPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.page = 1;
    this.total = 0;
    this.rows = [];
  }
  async render() {
    const month = currentMonth();
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">Devam Raporu</div>
        <div class="form-grid" style="margin-bottom: var(--space-4)">
          <div class="form-field">
            <label class="label">Ay</label>
            <input class="input" type="month" id="attendance-month" value="${month}" />
          </div>
        </div>
        <button class="btn btn-primary" id="attendance-download">${icon("download")} Excel Olarak \u0130ndir</button>
      </div>

      <div class="card" style="margin-top: var(--space-4)">
        <div class="card-title">\u0130zin Raporu</div>
        <div class="form-grid" style="margin-bottom: var(--space-4)">
          <div class="form-field">
            <label class="label">Ay (opsiyonel)</label>
            <input class="input" type="month" id="leaves-month" value="${month}" />
          </div>
        </div>
        <button class="btn btn-primary" id="leaves-download">${icon("download")} Excel Olarak \u0130ndir</button>
      </div>

      <div class="card" id="reports-history-card" style="margin-top: var(--space-4)">
        <div class="card-title">Ge\xE7mi\u015F Raporlar</div>
        <p style="color:var(--text-muted)">Y\xFCkleniyor...</p>
      </div>
    `;
    this.on("#attendance-download", "click", () => {
      const m = this.$("#attendance-month").value || month;
      window.location.href = `/api/v1/reports/excel/attendance?month=${m}`;
      setTimeout(() => this.loadHistory(), 1500);
    });
    this.on("#leaves-download", "click", () => {
      const m = this.$("#leaves-month").value;
      const url = m ? `/api/v1/reports/excel/leaves?month=${m}` : "/api/v1/reports/excel/leaves";
      window.location.href = url;
      setTimeout(() => this.loadHistory(), 1500);
    });
    await this.loadHistory();
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.total / PER_PAGE));
  }
  async loadHistory() {
    try {
      const qs = new URLSearchParams({ page: String(this.page), limit: String(PER_PAGE), action: "report_download" });
      const res = await api.get(
        `/api/v1/admin/audit?${qs.toString()}`
      );
      this.rows = res.rows;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Ge\xE7mi\u015F raporlar y\xFCklenemedi", "error");
      this.rows = [];
      this.total = 0;
    }
    this.drawHistory();
  }
  drawHistory() {
    const card = this.$("#reports-history-card");
    if (!card) return;
    card.innerHTML = `
      <div class="card-title">Ge\xE7mi\u015F Raporlar</div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr>
            <th>T\xFCr</th>
            <th>D\xF6nem</th>
            <th>Olu\u015Fturulma</th>
            <th>Olu\u015Fturan</th>
          </tr></thead>
          <tbody>
            ${this.rows.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Hen\xFCz olu\u015Fturulmu\u015F rapor yok</td></tr>` : this.rows.map((r) => `
                <tr>
                  <td>${TARGET_LABELS[r.target_table ?? ""] ?? r.target_table ?? "-"}</td>
                  <td>${r.new_value?.month ?? "\u2014"}</td>
                  <td>${fmtDateTime(r.created_at)}</td>
                  <td>${r.actor_name}</td>
                </tr>
              `).join("")}
          </tbody>
        </table>
      </div>
      ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
    `;
    bindPagination(card, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.loadHistory();
    });
  }
};
export {
  ReportsPage
};
//# sourceMappingURL=ReportsPage-OXJEXRZT.js.map
