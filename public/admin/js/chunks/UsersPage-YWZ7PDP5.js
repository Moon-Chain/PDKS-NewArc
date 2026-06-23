import {
  state
} from "./chunk-BSM6WVR6.js";
import {
  bindPagination,
  cellUser,
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

// public/admin/ts/pages/UsersPage.ts
var ROLE_LABELS = {
  admin: "Y\xF6netici",
  mudur: "M\xFCd\xFCr",
  takim_lideri: "Tak\u0131m Lideri",
  personel: "Personel"
};
var PER_PAGE = 10;
function roleOptionsHtml(selected) {
  return Object.entries(ROLE_LABELS).map(([key, label]) => `<option value="${key}" ${key === selected ? "selected" : ""}>${label}</option>`).join("");
}
var UsersPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.page = 1;
    this.total = 0;
    this.users = [];
    this.search = "";
    this.isManager = false;
  }
  async render() {
    const user = state.get("user");
    this.isManager = user?.role === "admin" || user?.role === "mudur";
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    await this.load();
  }
  async load() {
    try {
      const res = await api.get(
        `/api/v1/users?page=${this.page}&perPage=${PER_PAGE}`
      );
      this.users = res.users;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Personel listesi y\xFCklenemedi", "error");
      this.users = [];
      this.total = 0;
    }
    this.draw();
  }
  get totalPages() {
    return Math.max(1, Math.ceil(this.total / PER_PAGE));
  }
  get filteredUsers() {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(
      (u) => u.name.toLowerCase().includes(q) || u.personnel_id.toLowerCase().includes(q) || (u.title ?? "").toLowerCase().includes(q)
    );
  }
  draw() {
    const rows = this.filteredUsers;
    this.container.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <input class="input" id="users-search" placeholder="Ad, ID veya unvan ara..." value="${this.search}" />
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} personel</span>
          ${this.isManager ? `<button class="btn btn-primary" id="users-add">${icon("user-plus", "icon icon-sm")} Yeni Personel</button>` : ""}
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>\xDCnvan</th>
              <th>Rol</th>
              <th>\u0130zin Bakiyesi</th>
              <th>Durum</th>
              ${this.isManager ? "<th></th>" : ""}
            </tr></thead>
            <tbody>
              ${rows.length === 0 ? `<tr><td colspan="${this.isManager ? 6 : 5}" style="text-align:center; color:var(--text-muted)">Personel bulunamad\u0131</td></tr>` : rows.map((u) => `
                  <tr>
                    <td>${cellUser(u.name, u.personnel_id)}</td>
                    <td>${u.title ?? "\u2014"}</td>
                    <td><span class="badge ${u.role === "admin" ? "badge-primary" : "badge-muted"}">${ROLE_LABELS[u.role] ?? u.role}</span></td>
                    <td>${u.leave_balance} g\xFCn</td>
                    <td>${u.is_deleted ? '<span class="badge badge-muted">Pasif</span>' : '<span class="badge badge-success">Aktif</span>'}</td>
                    ${this.isManager ? `
                      <td>
                        <div style="display:flex; gap:6px; justify-content:flex-end">
                          <button class="btn btn-ghost btn-sm users-edit" data-id="${u.id}" title="D\xFCzenle">${icon("settings", "icon icon-sm")}</button>
                          <button class="btn btn-ghost btn-sm users-delete" data-id="${u.id}" title="Pasife Al">${icon("x", "icon icon-sm")}</button>
                        </div>
                      </td>` : ""}
                  </tr>
                `).join("")}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;
    this.attachHandlers();
  }
  attachHandlers() {
    this.on("#users-search", "input", (e) => {
      this.search = e.target.value;
      this.draw();
    });
    bindPagination(this.container, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.load();
    });
    this.on("#users-add", "click", () => this.openAddModal());
    this.$$(".users-edit").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const u = this.users.find((x) => x.id === id);
        if (u) this.openEditModal(u);
      });
    });
    this.$$(".users-delete").forEach((el) => {
      el.addEventListener("click", () => {
        const id = el.getAttribute("data-id");
        const u = this.users.find((x) => x.id === id);
        if (u) this.deleteUser(u);
      });
    });
  }
  openAddModal() {
    const { el, close } = openModal("Yeni Personel Ekle", `
      <form id="add-user-form" class="form-grid">
        <div class="form-field"><label class="label">Ad Soyad</label><input class="input" name="name" required /></div>
        <div class="form-field"><label class="label">\xDCnvan / Pozisyon</label><input class="input" name="title" /></div>
        <div class="form-field"><label class="label">Personel ID</label><input class="input" name="personnel_id" required /></div>
        <div class="form-field"><label class="label">\u015Eifre</label><input class="input" type="password" name="password" autocomplete="new-password" required /></div>
        <div class="form-field"><label class="label">Yetki</label><select class="input" name="role">${roleOptionsHtml("personel")}</select></div>
        <div class="form-field"><label class="label">Y\u0131ll\u0131k \u0130zin Bakiyesi (G\xFCn)</label><input class="input" type="number" min="0" name="leave_balance" value="14" /></div>
        <div class="form-field"><label class="label">\u0130\u015Fe Giri\u015F Tarihi</label><input class="input" type="date" name="start_date" /></div>
        <div class="form-field"><label class="label">Do\u011Fum Tarihi</label><input class="input" type="date" name="birth_date" /></div>
        <div class="form-field"><label class="label">Cihaz K\u0131s\u0131tlamas\u0131 (UA \u0130\xE7eri\u011Fi)</label><input class="input" name="allowed_device" placeholder="\xD6rn: iPhone, Samsung" /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="can_remote_check_in" />
            Nakliye / Uzaktan Giri\u015F Yetkisi
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">\u0130ptal</button>
          <button type="submit" class="btn btn-primary">Personel Ekle</button>
        </div>
      </form>
    `);
    el.querySelector(".modal-cancel")?.addEventListener("click", close);
    const form = el.querySelector("#add-user-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => {
        if (v !== "") data[k] = v;
      });
      data.can_remote_check_in = !!form.querySelector("[name=can_remote_check_in]")?.checked;
      if (data.leave_balance) data.leave_balance = Number(data.leave_balance);
      try {
        await api.post("/api/v1/users", data);
        toast("Personel eklendi", "success");
        close();
        this.page = 1;
        await this.load();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Hata", "error");
      }
    });
  }
  openEditModal(u) {
    const { el, close } = openModal(`Personel D\xFCzenle \u2014 ${u.name}`, `
      <form id="edit-user-form" class="form-grid">
        <div class="form-field"><label class="label">Ad Soyad</label><input class="input" name="name" required value="${u.name}" /></div>
        <div class="form-field"><label class="label">\xDCnvan / Pozisyon</label><input class="input" name="title" value="${u.title ?? ""}" /></div>
        <div class="form-field"><label class="label">Yetki</label><select class="input" name="role">${roleOptionsHtml(u.role)}</select></div>
        <div class="form-field"><label class="label">Y\u0131ll\u0131k \u0130zin Bakiyesi (G\xFCn)</label><input class="input" type="number" min="0" name="leave_balance" value="${u.leave_balance}" /></div>
        <div class="form-field"><label class="label">\u0130\u015Fe Giri\u015F Tarihi</label><input class="input" type="date" name="start_date" value="${u.start_date?.slice(0, 10) ?? ""}" /></div>
        <div class="form-field"><label class="label">Do\u011Fum Tarihi</label><input class="input" type="date" name="birth_date" value="${u.birth_date?.slice(0, 10) ?? ""}" /></div>
        <div class="form-field"><label class="label">Cihaz K\u0131s\u0131tlamas\u0131 (UA \u0130\xE7eri\u011Fi)</label><input class="input" name="allowed_device" value="${u.allowed_device ?? ""}" /></div>
        <div class="form-field"><label class="label">Yeni \u015Eifre (opsiyonel)</label><input class="input" type="password" name="password" autocomplete="new-password" placeholder="De\u011Fi\u015Ftirmek istemiyorsan\u0131z bo\u015F b\u0131rak\u0131n" /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="can_remote_check_in" ${u.can_remote_check_in ? "checked" : ""} />
            Nakliye / Uzaktan Giri\u015F Yetkisi
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">\u0130ptal</button>
          <button type="submit" class="btn btn-primary">Kaydet</button>
        </div>
      </form>
    `);
    el.querySelector(".modal-cancel")?.addEventListener("click", close);
    const form = el.querySelector("#edit-user-form");
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {};
      fd.forEach((v, k) => {
        data[k] = v === "" ? null : v;
      });
      data.can_remote_check_in = !!form.querySelector("[name=can_remote_check_in]")?.checked;
      if (data.leave_balance) data.leave_balance = Number(data.leave_balance);
      if (!data.password) delete data.password;
      try {
        await api.patch(`/api/v1/users/${u.id}`, data);
        toast("Personel g\xFCncellendi", "success");
        close();
        await this.load();
      } catch (err) {
        toast(err instanceof Error ? err.message : "Hata", "error");
      }
    });
  }
  async deleteUser(u) {
    const ok = await confirmModal({
      title: "Personeli Pasife Al",
      message: `"${u.name}" personeli pasife al\u0131nacak. Giri\u015F yapamaz hale gelir.`,
      confirmText: "Pasife Al",
      cancelText: "Vazge\xE7",
      danger: true
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/users/${u.id}`);
      toast("Personel pasife al\u0131nd\u0131", "success");
      await this.load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Hata", "error");
    }
  }
};
export {
  UsersPage
};
//# sourceMappingURL=UsersPage-YWZ7PDP5.js.map
