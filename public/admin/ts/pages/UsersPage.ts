import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { state } from '../../../ts/core/StateManager.js';
import { icon } from '../icons.js';
import { toast, openModal, confirmModal, cellUser, paginationControls, bindPagination } from '../adminUi.js';

interface AdminUser {
  id: string;
  personnel_id: string;
  name: string;
  title?: string;
  email?: string;
  role: string;
  manager_id?: string;
  leave_balance: number;
  start_date?: string;
  birth_date?: string;
  can_remote_check_in: boolean;
  allowed_device?: string;
  device_id?: string;
  is_deleted: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin:        'Yönetici',
  mudur:        'Müdür',
  takim_lideri: 'Takım Lideri',
  personel:     'Personel',
};

const PER_PAGE = 10;

function roleOptionsHtml(selected?: string): string {
  return Object.entries(ROLE_LABELS)
    .map(([key, label]) => `<option value="${key}" ${key === selected ? 'selected' : ''}>${label}</option>`)
    .join('');
}

export class UsersPage extends BasePage {
  private page    = 1;
  private total   = 0;
  private users: AdminUser[] = [];
  private search  = '';
  private isManager = false;

  async render(): Promise<void> {
    const user = state.get<{ role: string }>('user');
    this.isManager = user?.role === 'admin' || user?.role === 'mudur';

    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const res = await api.get<{ success: boolean; users: AdminUser[]; total: number }>(
        `/api/v1/users?page=${this.page}&perPage=${PER_PAGE}`
      );
      this.users = res.users;
      this.total = res.total;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Personel listesi yüklenemedi', 'error');
      this.users = [];
      this.total = 0;
    }
    this.draw();
  }

  private get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / PER_PAGE));
  }

  private get filteredUsers(): AdminUser[] {
    const q = this.search.trim().toLowerCase();
    if (!q) return this.users;
    return this.users.filter(u =>
      u.name.toLowerCase().includes(q) ||
      u.personnel_id.toLowerCase().includes(q) ||
      (u.title ?? '').toLowerCase().includes(q)
    );
  }

  private draw(): void {
    const rows = this.filteredUsers;

    this.container.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <input class="input" id="users-search" placeholder="Ad, ID veya unvan ara..." value="${this.search}" />
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.total} personel</span>
          ${this.isManager ? `<button class="btn btn-primary" id="users-add">${icon('user-plus', 'icon icon-sm')} Yeni Personel</button>` : ''}
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Personel</th>
              <th>Ünvan</th>
              <th>Rol</th>
              <th>İzin Bakiyesi</th>
              <th>Durum</th>
              ${this.isManager ? '<th></th>' : ''}
            </tr></thead>
            <tbody>
              ${rows.length === 0
                ? `<tr><td colspan="${this.isManager ? 6 : 5}" style="text-align:center; color:var(--text-muted)">Personel bulunamadı</td></tr>`
                : rows.map(u => `
                  <tr>
                    <td>${cellUser(u.name, u.personnel_id)}</td>
                    <td>${u.title ?? '—'}</td>
                    <td><span class="badge ${u.role === 'admin' ? 'badge-primary' : 'badge-muted'}">${ROLE_LABELS[u.role] ?? u.role}</span></td>
                    <td>${u.leave_balance} gün</td>
                    <td>${u.is_deleted
                      ? '<span class="badge badge-muted">Pasif</span>'
                      : '<span class="badge badge-success">Aktif</span>'}</td>
                    ${this.isManager ? `
                      <td>
                        <div style="display:flex; gap:6px; justify-content:flex-end">
                          <button class="btn btn-ghost btn-sm users-edit" data-id="${u.id}" title="Düzenle">${icon('settings', 'icon icon-sm')}</button>
                          <button class="btn btn-ghost btn-sm users-delete" data-id="${u.id}" title="Pasife Al">${icon('x', 'icon icon-sm')}</button>
                        </div>
                      </td>` : ''}
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.total, PER_PAGE)}
      </div>
    `;

    this.attachHandlers();
  }

  private attachHandlers(): void {
    this.on('#users-search', 'input', (e) => {
      this.search = (e.target as HTMLInputElement).value;
      this.draw();
    });

    bindPagination(this.container, this.page, this.totalPages, async (p) => {
      this.page = p;
      await this.load();
    });

    this.on('#users-add', 'click', () => this.openAddModal());

    this.$$('.users-edit').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const u = this.users.find(x => x.id === id);
        if (u) this.openEditModal(u);
      });
    });
    this.$$('.users-delete').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-id');
        const u = this.users.find(x => x.id === id);
        if (u) this.deleteUser(u);
      });
    });
  }

  private openAddModal(): void {
    const { el, close } = openModal('Yeni Personel Ekle', `
      <form id="add-user-form" class="form-grid">
        <div class="form-field"><label class="label">Ad Soyad</label><input class="input" name="name" required /></div>
        <div class="form-field"><label class="label">Ünvan / Pozisyon</label><input class="input" name="title" /></div>
        <div class="form-field"><label class="label">Personel ID</label><input class="input" name="personnel_id" required /></div>
        <div class="form-field"><label class="label">Şifre</label><input class="input" type="password" name="password" autocomplete="new-password" required /></div>
        <div class="form-field"><label class="label">Yetki</label><select class="input" name="role">${roleOptionsHtml('personel')}</select></div>
        <div class="form-field"><label class="label">Yıllık İzin Bakiyesi (Gün)</label><input class="input" type="number" min="0" name="leave_balance" value="14" /></div>
        <div class="form-field"><label class="label">İşe Giriş Tarihi</label><input class="input" type="date" name="start_date" /></div>
        <div class="form-field"><label class="label">Doğum Tarihi</label><input class="input" type="date" name="birth_date" /></div>
        <div class="form-field"><label class="label">Cihaz Kısıtlaması (UA İçeriği)</label><input class="input" name="allowed_device" placeholder="Örn: iPhone, Samsung" /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="can_remote_check_in" />
            Nakliye / Uzaktan Giriş Yetkisi
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">İptal</button>
          <button type="submit" class="btn btn-primary">Personel Ekle</button>
        </div>
      </form>
    `);

    el.querySelector('.modal-cancel')?.addEventListener('click', close);

    const form = el.querySelector('#add-user-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data: Record<string, unknown> = {};
      fd.forEach((v, k) => { if (v !== '') data[k] = v; });
      data.can_remote_check_in = !!form.querySelector<HTMLInputElement>('[name=can_remote_check_in]')?.checked;
      if (data.leave_balance) data.leave_balance = Number(data.leave_balance);

      try {
        await api.post('/api/v1/users', data);
        toast('Personel eklendi', 'success');
        close();
        this.page = 1;
        await this.load();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Hata', 'error');
      }
    });
  }

  private openEditModal(u: AdminUser): void {
    const { el, close } = openModal(`Personel Düzenle — ${u.name}`, `
      <form id="edit-user-form" class="form-grid">
        <div class="form-field"><label class="label">Ad Soyad</label><input class="input" name="name" required value="${u.name}" /></div>
        <div class="form-field"><label class="label">Ünvan / Pozisyon</label><input class="input" name="title" value="${u.title ?? ''}" /></div>
        <div class="form-field"><label class="label">Yetki</label><select class="input" name="role">${roleOptionsHtml(u.role)}</select></div>
        <div class="form-field"><label class="label">Yıllık İzin Bakiyesi (Gün)</label><input class="input" type="number" min="0" name="leave_balance" value="${u.leave_balance}" /></div>
        <div class="form-field"><label class="label">İşe Giriş Tarihi</label><input class="input" type="date" name="start_date" value="${u.start_date?.slice(0, 10) ?? ''}" /></div>
        <div class="form-field"><label class="label">Doğum Tarihi</label><input class="input" type="date" name="birth_date" value="${u.birth_date?.slice(0, 10) ?? ''}" /></div>
        <div class="form-field"><label class="label">Cihaz Kısıtlaması (UA İçeriği)</label><input class="input" name="allowed_device" value="${u.allowed_device ?? ''}" /></div>
        <div class="form-field"><label class="label">Yeni Şifre (opsiyonel)</label><input class="input" type="password" name="password" autocomplete="new-password" placeholder="Değiştirmek istemiyorsanız boş bırakın" /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="can_remote_check_in" ${u.can_remote_check_in ? 'checked' : ''} />
            Nakliye / Uzaktan Giriş Yetkisi
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">İptal</button>
          <button type="submit" class="btn btn-primary">Kaydet</button>
        </div>
      </form>
    `);

    el.querySelector('.modal-cancel')?.addEventListener('click', close);

    const form = el.querySelector('#edit-user-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data: Record<string, unknown> = {};
      fd.forEach((v, k) => { data[k] = v === '' ? null : v; });
      data.can_remote_check_in = !!form.querySelector<HTMLInputElement>('[name=can_remote_check_in]')?.checked;
      if (data.leave_balance) data.leave_balance = Number(data.leave_balance);
      if (!data.password) delete data.password;

      try {
        await api.patch(`/api/v1/users/${u.id}`, data);
        toast('Personel güncellendi', 'success');
        close();
        await this.load();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Hata', 'error');
      }
    });
  }

  private async deleteUser(u: AdminUser): Promise<void> {
    const ok = await confirmModal({
      title: 'Personeli Pasife Al',
      message: `"${u.name}" personeli pasife alınacak. Giriş yapamaz hale gelir.`,
      confirmText: 'Pasife Al',
      cancelText: 'Vazgeç',
      danger: true,
    });
    if (!ok) return;

    try {
      await api.delete(`/api/v1/users/${u.id}`);
      toast('Personel pasife alındı', 'success');
      await this.load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Hata', 'error');
    }
  }
}
