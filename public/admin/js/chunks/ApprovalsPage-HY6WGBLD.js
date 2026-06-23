import {
  cellUser,
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api,
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/pages/ApprovalsPage.ts
var TYPE_LABELS = {
  annual: "Y\u0131ll\u0131k \u0130zin",
  report: "Rapor",
  excuse: "Mazeret \u0130zni"
};
function fmtRange(start, end) {
  const opts = { day: "2-digit", month: "2-digit", year: "numeric" };
  const s = new Date(start).toLocaleDateString("tr-TR", opts);
  const e = new Date(end).toLocaleDateString("tr-TR", opts);
  return s === e ? s : `${s} - ${e}`;
}
function fmtDate(date) {
  return new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function approvalCard(id, name, meta, note) {
  return `
    <div class="approval-card" data-id="${id}">
      <div>
        ${cellUser(name)}
        <div class="approval-meta">${meta}</div>
        ${note ? `<div class="approval-meta" style="margin-top:4px">${note}</div>` : ""}
      </div>
      <div class="approval-actions">
        <button class="btn btn-primary btn-sm" data-action="approve">${icon("check", "icon icon-sm")} Onayla</button>
        <button class="btn btn-ghost btn-sm" data-action="reject">${icon("x", "icon icon-sm")} Reddet</button>
      </div>
    </div>`;
}
var ApprovalsPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.leaves = [];
    this.overtimes = [];
  }
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    await this.load();
  }
  async load() {
    try {
      const [leavesRes, overtimeRes] = await Promise.all([
        api.get("/api/v1/leaves?status=pending&limit=50"),
        api.get("/api/v1/overtime?status=pending&limit=50")
      ]);
      this.leaves = leavesRes.rows;
      this.overtimes = overtimeRes.rows;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Onay listesi y\xFCklenemedi", "error");
      this.leaves = [];
      this.overtimes = [];
    }
    this.draw();
  }
  draw() {
    this.container.innerHTML = `
      <div class="card">
        <div class="card-title">\u0130zin Talepleri (${this.leaves.length})</div>
        ${this.leaves.length === 0 ? `<p style="color:var(--text-muted)">Bekleyen izin talebi yok</p>` : this.leaves.map((l) => approvalCard(
      l.id,
      l.user_name,
      `${fmtRange(l.start_date, l.end_date)} \xB7 ${l.days} g\xFCn \xB7 ${TYPE_LABELS[l.type] ?? l.type}`,
      l.reason ? `"${l.reason}"` : ""
    )).join("")}
      </div>
      <div class="card" style="margin-top: var(--space-4)">
        <div class="card-title">Mesai Talepleri (${this.overtimes.length})</div>
        ${this.overtimes.length === 0 ? `<p style="color:var(--text-muted)">Bekleyen mesai talebi yok</p>` : this.overtimes.map((o) => approvalCard(
      o.id,
      o.user_name,
      `${fmtDate(o.date)} \xB7 ${o.hours} Saat`,
      o.description ? `"${o.description}"` : ""
    )).join("")}
      </div>
    `;
    this.on('[data-action="approve"]', "click", (e) => {
      const card = e.target.closest(".approval-card");
      this.handleAction(card, "approve");
    });
    this.on('[data-action="reject"]', "click", (e) => {
      const card = e.target.closest(".approval-card");
      this.handleAction(card, "reject");
    });
  }
  async handleAction(card, action) {
    const id = card.dataset.id;
    const isLeave = this.leaves.some((l) => l.id === id);
    const endpoint = isLeave ? `/api/v1/leaves/${id}/${action}` : `/api/v1/overtime/${id}/${action}`;
    try {
      await api.patch(endpoint, {});
      toast(action === "approve" ? "Talep onayland\u0131" : "Talep reddedildi", "success");
      await this.load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "\u0130\u015Flem ba\u015Far\u0131s\u0131z", "error");
    }
  }
};
export {
  ApprovalsPage
};
//# sourceMappingURL=ApprovalsPage-HY6WGBLD.js.map
