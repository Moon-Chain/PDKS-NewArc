import {
  bindPagination,
  confirmModal,
  openModal,
  paginationControls,
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api,
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/pages/HolidaysPage.ts
function yearOptionsHtml(selected) {
  const current = (/* @__PURE__ */ new Date()).getFullYear();
  const years = [current - 1, current, current + 1, current + 2];
  return years.map((y) => `<option value="${y}" ${y === selected ? "selected" : ""}>${y}</option>`).join("");
}
function fmtDate(date) {
  return new Date(date).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric", weekday: "long" });
}
var PER_PAGE = 10;
var HolidaysPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.year = (/* @__PURE__ */ new Date()).getFullYear();
    this.rows = [];
    this.page = 1;
  }
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    await this.load();
  }
  async load() {
    try {
      const res = await api.get(`/api/v1/holidays?year=${this.year}`);
      this.rows = res.rows;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Tatil g\xFCnleri y\xFCklenemedi", "error");
      this.rows = [];
    }
    this.draw();
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.rows.length / PER_PAGE));
  }
  get pageRows() {
    const start = (this.page - 1) * PER_PAGE;
    return this.rows.slice(start, start + PER_PAGE);
  }
  draw() {
    const rows = this.pageRows;
    this.container.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <select class="input" id="holidays-year" style="max-width:120px">${yearOptionsHtml(this.year)}</select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.rows.length} tatil g\xFCn\xFC</span>
          <button class="btn btn-primary" id="holidays-add">${icon("calendar-plus")} Tatil G\xFCn\xFC Ekle</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Tarih</th>
              <th>Ad\u0131</th>
              <th>T\xFCr</th>
              <th></th>
            </tr></thead>
            <tbody>
              ${rows.length === 0 ? `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Tatil g\xFCn\xFC bulunamad\u0131</td></tr>` : rows.map((h) => `
                  <tr>
                    <td>${fmtDate(h.date)}</td>
                    <td>${h.name}</td>
                    <td><span class="badge badge-muted">${h.is_half_day ? "Yar\u0131m G\xFCn" : "Tam G\xFCn"}</span></td>
                    <td><button class="btn btn-ghost btn-sm holidays-delete" data-id="${h.id}">${icon("trash-2", "icon icon-sm")} Sil</button></td>
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.rows.length, PER_PAGE)}
      </div>
    `;
    this.on("#holidays-year", "change", async (e) => {
      this.year = Number(e.target.value);
      this.page = 1;
      await this.load();
    });
    this.on("#holidays-add", "click", () => this.openAddModal());
    bindPagination(this.container, this.page, this.totalPages, (p) => {
      this.page = p;
      this.draw();
    });
    this.$$(".holidays-delete").forEach((el) => {
      el.addEventListener("click", () => {
        const id = Number(el.getAttribute("data-id"));
        const h = this.rows.find((x) => x.id === id);
        if (h) this.deleteHoliday(h);
      });
    });
  }
  openAddModal() {
    const { el, close } = openModal("Tatil G\xFCn\xFC Ekle", `
      <form id="add-holiday-form" class="form-grid">
        <div class="form-field"><label class="label">Tarih</label><input class="input" type="date" name="date" required /></div>
        <div class="form-field"><label class="label">Ad\u0131</label><input class="input" name="name" required /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="is_half_day" />
            Yar\u0131m G\xFCn
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">\u0130ptal</button>
          <button type="submit" class="btn btn-primary">Ekle</button>
        </div>
      </form>
    `);
    el.querySelector(".modal-cancel")?.addEventListener("click", close);
    const form = el.querySelector("#add-holiday-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {
        date: String(fd.get("date")),
        name: String(fd.get("name")),
        is_half_day: !!form.querySelector("[name=is_half_day]")?.checked
      };
      try {
        await api.post("/api/v1/holidays", data);
        toast("Tatil g\xFCn\xFC eklendi", "success");
        close();
        this.year = parseInt(data.date.split("-")[0]);
        this.page = 1;
        await this.load();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Hata", "error");
      }
    });
  }
  async deleteHoliday(h) {
    const ok = await confirmModal({
      title: "Tatil G\xFCn\xFC Sil",
      message: `"${h.name}" (${fmtDate(h.date)}) tatil g\xFCn\xFCn\xFC silmek istedi\u011Finize emin misiniz?`,
      confirmText: "Sil",
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/holidays/${h.id}`);
      toast("Tatil g\xFCn\xFC silindi", "success");
      await this.load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Hata", "error");
    }
  }
};
export {
  HolidaysPage
};
//# sourceMappingURL=HolidaysPage-TR32XOKO.js.map
