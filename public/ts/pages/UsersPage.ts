import Alpine from 'alpinejs';
import { BasePage } from '../core/BasePage.js';
import { api } from '../core/ApiClient.js';
import { state } from '../core/StateManager.js';
import { Toast } from '../components/Toast.js';
import { Modal } from '../components/Modal.js';

interface User {
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
  avatar_path?: string;
  is_deleted: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  admin:        'Yönetici',
  mudur:        'Müdür',
  takim_lideri: 'Takım Lideri',
  personel:     'Personel',
};

const ICON_PLUS   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
const ICON_TRUCK  = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>`;
const ICON_EDIT   = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const ICON_TRASH  = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;
const ICON_SEARCH = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`;
const ICON_USERS  = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`;
const ICON_CAMERA = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>`;
const ICON_EDIT_HDR = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;

Alpine.data('usersPage', () => ({
  users:         [] as User[],
  filteredUsers: [] as User[],
  total:         0,
  page:          1,
  perPage:       20,
  search:        '',
  isManager:     false,
  loading:       true,

  // Düzenleme modalı state
  showEditModal:      false,
  editingUser:        null as User | null,
  editSaving:         false,
  editAvatarSrc:      null as string | null,
  editAvatarInitial:  '',
  editDeviceId:       '',

  // Personel ekle form state
  addName:          '',
  addTitle:         '',
  addPersonnelId:   '',
  addPassword:      '',
  addRole:          'personel',
  addManagerId:     '',
  addLeaveBalance:  14,
  addStartDate:     '',
  addBirthDate:     '',
  addAllowedDevice: '',
  addDeviceId:      '',
  addRemote:        false,
  addSubmitting:    false,

  get totalPages(): number { return Math.ceil(this.total / this.perPage); },

  get managers(): User[] {
    return this.users.filter(u => u.role === 'admin' || u.role === 'mudur');
  },

  get editManagers(): User[] {
    return this.users.filter(u => (u.role === 'admin' || u.role === 'mudur') && u.id !== this.editingUser?.id);
  },

  roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
  },

  async init() {
    const user = state.get('user') as { role: string } | null;
    this.isManager = user?.role === 'admin' || user?.role === 'mudur';
    await this.load();
  },

  async load() {
    this.loading = true;
    try {
      const res = await api.get<{ success: boolean; users: User[]; total: number }>(
        `/api/v1/users?page=${this.page}&perPage=${this.perPage}`
      );
      this.users = res.users;
      this.total = res.total;
      this._applySearch();
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Yüklenemedi', 'error');
    } finally {
      this.loading = false;
    }
  },

  _applySearch() {
    const q = this.search.toLowerCase();
    this.filteredUsers = q
      ? this.users.filter(u =>
          u.name.toLowerCase().includes(q) ||
          u.personnel_id.toLowerCase().includes(q) ||
          (u.title ?? '').toLowerCase().includes(q)
        )
      : this.users;
  },

  onSearch() {
    this._applySearch();
  },

  async prevPage() {
    if (this.page <= 1) return;
    this.page--;
    await this.load();
  },

  async nextPage() {
    if (this.page >= this.totalPages) return;
    this.page++;
    await this.load();
  },

  /* ------------------------------------------------------------------ */
  /* Personel Ekle                                                        */
  /* ------------------------------------------------------------------ */
  async submitAddUser(e: Event) {
    e.preventDefault();
    this.addSubmitting = true;
    const data: Record<string, unknown> = {};
    if (this.addName)          data.name           = this.addName;
    if (this.addTitle)         data.title          = this.addTitle;
    if (this.addPersonnelId)   data.personnel_id   = this.addPersonnelId;
    if (this.addPassword)      data.password       = this.addPassword;
    if (this.addRole)          data.role           = this.addRole;
    if (this.addManagerId)     data.manager_id     = this.addManagerId;
    if (this.addLeaveBalance)  data.leave_balance  = Number(this.addLeaveBalance);
    if (this.addStartDate)     data.start_date     = this.addStartDate;
    if (this.addBirthDate)     data.birth_date     = this.addBirthDate;
    if (this.addAllowedDevice) data.allowed_device = this.addAllowedDevice;
    if (this.addDeviceId)      data.device_id      = this.addDeviceId;
    data.can_remote_check_in = this.addRemote;

    try {
      await api.post('/api/v1/users', data);
      Toast.show('Personel eklendi', 'success');
      this.addName = ''; this.addTitle = ''; this.addPersonnelId = '';
      this.addPassword = ''; this.addRole = 'personel'; this.addManagerId = '';
      this.addLeaveBalance = 14; this.addStartDate = ''; this.addBirthDate = '';
      this.addAllowedDevice = ''; this.addDeviceId = ''; this.addRemote = false;
      await this.load();
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Hata', 'error');
    } finally {
      this.addSubmitting = false;
    }
  },

  /* ------------------------------------------------------------------ */
  /* Düzenleme Modalı                                                     */
  /* ------------------------------------------------------------------ */
  openEditModal(user: User) {
    this.editingUser       = user;
    this.editAvatarSrc     = user.avatar_path ?? null;
    this.editAvatarInitial = user.name.charAt(0).toUpperCase();
    this.editDeviceId      = user.device_id ?? '';
    this.showEditModal     = true;
  },

  closeEditModal() {
    this.showEditModal = false;
    this.editingUser   = null;
    this.editSaving    = false;
  },

  clearDeviceLock() {
    this.editDeviceId = '';
  },

  async uploadAvatar(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || !this.editingUser) return;
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await fetch(`/api/v1/users/${this.editingUser.id}/avatar`, {
        method: 'POST', credentials: 'include', body: fd,
      });
      if (!res.ok) { const j = await res.json() as { error?: string }; throw new Error(j.error ?? 'Hata'); }
      const data = await res.json() as { avatarPath: string };
      this.editAvatarSrc = data.avatarPath;
      if (this.editingUser) this.editingUser = { ...this.editingUser, avatar_path: data.avatarPath };
      Toast.show('Fotoğraf güncellendi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Hata', 'error');
    } finally {
      (e.target as HTMLInputElement).value = '';
    }
  },

  async deleteAvatar() {
    if (!this.editingUser) return;
    const ok = await Modal.confirm({
      title: 'Fotoğrafı Sil',
      content: 'Profil fotoğrafı silinecek. Devam edilsin mi?',
      confirmText: 'Evet, Sil', cancelText: 'Vazgeç', danger: true,
    });
    if (!ok) return;
    try {
      await api.patch(`/api/v1/users/${this.editingUser.id}`, { avatar_path: null });
      this.editAvatarSrc = null;
      if (this.editingUser) this.editingUser = { ...this.editingUser, avatar_path: undefined };
      Toast.show('Fotoğraf silindi', 'success');
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Hata', 'error');
    }
  },

  async saveEditUser(e: Event) {
    e.preventDefault();
    if (!this.editingUser) return;
    this.editSaving = true;

    const form = e.target as HTMLFormElement;
    const fd   = new FormData(form);
    const data: Record<string, unknown> = {};
    fd.forEach((v, k) => { data[k] = v === '' ? null : v; });
    data.can_remote_check_in = form.querySelector<HTMLInputElement>('[name=can_remote_check_in]')?.checked ?? false;
    if (data.leave_balance) data.leave_balance = Number(data.leave_balance);
    // device_id alanı clearDeviceLock ile temizlenmiş olabilir, x-model üzerinden gelir
    data.device_id = this.editDeviceId || null;

    try {
      await api.patch(`/api/v1/users/${this.editingUser.id}`, data);
      Toast.show('Güncellendi', 'success');
      this.closeEditModal();
      await this.load();
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Hata', 'error');
    } finally {
      this.editSaving = false;
    }
  },

  openDeleteFromModal() {
    const user = this.editingUser;
    if (!user) return;
    this.closeEditModal();
    // nextTick ile modal kapandıktan sonra sil modalını aç
    this.$nextTick(() => { this.openDeleteModal(user); });
  },

  /* ------------------------------------------------------------------ */
  /* Pasife Al Modalı — Modal.confirm kullanarak                         */
  /* ------------------------------------------------------------------ */
  async openDeleteModal(user: User) {
    const ok = await Modal.confirm({
      title: 'Personeli Pasife Al',
      content: `"${user.name}" personeli pasife alınacak. Giriş yapamaz hale gelir.`,
      confirmText: 'Pasife Al', cancelText: 'İptal', danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/users/${user.id}`);
      Toast.show('Personel pasife alındı', 'success');
      await this.load();
    } catch (err: unknown) {
      Toast.show(err instanceof Error ? err.message : 'Hata', 'error');
    }
  },
}));

export class UsersPage extends BasePage {
  async render(): Promise<void> {
    this.container.innerHTML = `
      <div class="users-page" x-data="usersPage()">

        <!-- Personel Ekle Formu (sadece yönetici) -->
        <template x-if="isManager">
          <div class="add-user-card">
            <h3 class="add-user-title">${ICON_PLUS} Yeni Personel Ekle</h3>
            <form class="add-user-form" autocomplete="off" @submit="submitAddUser($event)">
              <div class="field-group">
                <label class="field-label">Ad Soyad</label>
                <input class="field-input" x-model="addName" required placeholder="Örn: Ahmet Yılmaz" />
              </div>
              <div class="field-group">
                <label class="field-label">Ünvan / Pozisyon</label>
                <input class="field-input" x-model="addTitle" placeholder="Örn: Yazılım Geliştirici, Bölüm Müdürü" />
              </div>
              <div class="field-group">
                <label class="field-label">Personel ID</label>
                <input class="field-input" x-model="addPersonnelId" required placeholder="Örn: ahmet123" />
              </div>
              <div class="field-group">
                <label class="field-label">Şifre</label>
                <input class="field-input" type="password" x-model="addPassword" required placeholder="Şifre belirleyin" />
              </div>
              <div class="field-group">
                <label class="field-label">Yetki</label>
                <select class="field-input" x-model="addRole">
                  <option value="personel">Personel</option>
                  <option value="takim_lideri">Takım Lideri</option>
                  <option value="mudur">Müdür</option>
                  <option value="admin">Yönetici</option>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Bağlı Olduğu Yönetici</label>
                <select class="field-input" x-model="addManagerId">
                  <option value="">Sistem Yöneticisi</option>
                  <template x-for="m in managers" :key="m.id">
                    <option :value="m.id" x-text="m.name"></option>
                  </template>
                </select>
              </div>
              <div class="field-group">
                <label class="field-label">Yıllık İzin Bakiyesi (Gün)</label>
                <input class="field-input" type="number" min="0" x-model.number="addLeaveBalance" />
              </div>
              <div class="field-group">
                <label class="field-label">İşe Giriş Tarihi</label>
                <input class="field-input" type="date" x-model="addStartDate" />
              </div>
              <div class="field-group">
                <label class="field-label">Doğum Tarihi</label>
                <input class="field-input" type="date" x-model="addBirthDate" />
              </div>
              <div class="field-group">
                <label class="field-label">Cihaz Kısıtlaması (UA İçeriği)</label>
                <input class="field-input" x-model="addAllowedDevice" placeholder="Örn: iPhone, Samsung, SM-G991B" />
              </div>
              <div class="field-group">
                <label class="field-label">Sabit Cihaz Kimliği (Hardware ID)</label>
                <input class="field-input" x-model="addDeviceId" placeholder="Otomatik tanımlanır veya ID girin" />
              </div>
              <div class="field-group field-group--full">
                <label class="remote-toggle">
                  <input type="checkbox" x-model="addRemote" />
                  <div>
                    <p class="remote-toggle-title">${ICON_TRUCK} Nakliye / Uzaktan Giriş Yetkisi</p>
                    <p class="remote-toggle-desc">Bu personel ofis dışından (nakliyede) da giriş-çıkış yapabilir. Konumu kaydedilir, yöneticileri bildirim alır.</p>
                  </div>
                </label>
              </div>
              <div class="field-group field-group--full">
                <button type="submit" class="submit-btn" :disabled="addSubmitting">
                  <span x-text="addSubmitting ? 'Ekleniyor...' : 'Personel Ekle'"></span>
                </button>
              </div>
            </form>
          </div>
        </template>

        <!-- Personel Listesi -->
        <div class="users-list-section">
          <div class="users-list-header">
            <span class="list-header-icon">${ICON_USERS}</span>
            <h3 class="list-header-title">Personel Listesi</h3>
            <span class="list-header-count" x-text="total"></span>
          </div>
          <div class="search-bar">
            <span class="search-icon">${ICON_SEARCH}</span>
            <input class="search-input" type="text" placeholder="Ad, ID veya unvan ara..."
                   x-model="search" @input="onSearch()" autocomplete="off" />
          </div>
          <div class="ul-table-card">
            <template x-if="loading">
              <div class="ul-list">
                <div class="skeleton" style="height:64px;border-radius:12px;margin-bottom:8px"></div>
                <div class="skeleton" style="height:64px;border-radius:12px;margin-bottom:8px"></div>
                <div class="skeleton" style="height:64px;border-radius:12px"></div>
              </div>
            </template>
            <template x-if="!loading">
              <div class="ul-list">
                <template x-if="filteredUsers.length === 0">
                  <div class="empty-state"><p>Personel bulunamadı</p></div>
                </template>
                <template x-for="u in filteredUsers" :key="u.id">
                  <div class="ul-row">
                    <div class="ul-avatar-wrap">
                      <template x-if="u.avatar_path">
                        <img class="ul-avatar" :src="u.avatar_path" :alt="u.name" />
                      </template>
                      <template x-if="!u.avatar_path">
                        <div class="ul-avatar ul-avatar--initial" x-text="u.name.charAt(0).toUpperCase()"></div>
                      </template>
                    </div>
                    <div class="ul-info">
                      <p class="ul-name" x-text="u.name"></p>
                      <div class="ul-meta-row">
                        <span class="ul-pid" x-text="u.personnel_id"></span>
                        <template x-if="u.title">
                          <span class="ul-title-dot">·</span>
                        </template>
                        <template x-if="u.title">
                          <span class="ul-title-text" x-text="u.title"></span>
                        </template>
                      </div>
                    </div>
                    <span class="ul-badge" :class="'ul-badge--' + u.role" x-text="roleLabel(u.role)"></span>
                    <template x-if="isManager">
                      <div class="ul-actions">
                        <button class="ul-action-btn ul-action-btn--edit" title="Düzenle"
                                @click.stop="openEditModal(u)">${ICON_EDIT}</button>
                        <button class="ul-action-btn ul-action-btn--del" title="Pasife Al"
                                @click.stop="openDeleteModal(u)">${ICON_TRASH}</button>
                      </div>
                    </template>
                  </div>
                </template>
              </div>
            </template>
          </div>

          <!-- Sayfalama -->
          <template x-if="totalPages > 1">
            <div class="pagination">
              <button class="page-btn" :disabled="page <= 1" @click="prevPage()">←</button>
              <span class="page-info" x-text="page + ' / ' + totalPages"></span>
              <button class="page-btn" :disabled="page >= totalPages" @click="nextPage()">→</button>
            </div>
          </template>
        </div>

        <!-- Düzenleme Modalı -->
        <div class="edit-modal-overlay" x-show="showEditModal" @click.self="closeEditModal()" style="display:none">
          <template x-if="showEditModal && editingUser">
            <div class="edit-modal">

              <!-- Başlık -->
              <div class="edit-modal-hdr">
                <h2 class="edit-modal-title">${ICON_EDIT_HDR} Personel Düzenle</h2>
                <button class="edit-modal-close" type="button" @click="closeEditModal()">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </button>
              </div>

              <!-- Fotoğraf Bölümü -->
              <div class="edit-photo-row">
                <div class="edit-photo-group">
                  <div class="edit-avatar-wrap">
                    <template x-if="editAvatarSrc">
                      <img class="edit-avatar-img" :src="editAvatarSrc" :alt="editingUser.name" />
                    </template>
                    <template x-if="!editAvatarSrc">
                      <div class="edit-avatar-img edit-avatar-initial" x-text="editAvatarInitial"></div>
                    </template>
                    <label class="edit-avatar-overlay">
                      ${ICON_CAMERA}
                      <input type="file" accept="image/jpeg,image/png,image/webp" hidden
                             @change="uploadAvatar($event)" />
                    </label>
                  </div>
                </div>
                <div class="edit-photo-info">
                  <p class="edit-photo-title">Profil Fotoğrafı</p>
                  <p class="edit-photo-desc">Resmin üzerine tıklayarak fotoğrafı değiştirebilirsiniz.</p>
                  <template x-if="editAvatarSrc">
                    <button type="button" class="edit-photo-del" @click="deleteAvatar()">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                      Fotoğrafı Kaldır
                    </button>
                  </template>
                </div>
              </div>

              <!-- Form -->
              <form class="edit-form-grid" autocomplete="off" @submit="saveEditUser($event)">
                <div class="field-group">
                  <label class="field-label">Ad Soyad</label>
                  <input class="field-input" name="name" required :value="editingUser.name" />
                </div>
                <div class="field-group">
                  <label class="field-label">Ünvan / Pozisyon</label>
                  <input class="field-input" name="title" :value="editingUser.title ?? ''"
                         placeholder="Örn: Bölüm Müdürü, Tekniker" />
                </div>
                <div class="field-group">
                  <label class="field-label">Yetki</label>
                  <select class="field-input" name="role">
                    <template x-for="(label, key) in {'admin':'Yönetici','mudur':'Müdür','takim_lideri':'Takım Lideri','personel':'Personel'}" :key="key">
                      <option :value="key" :selected="editingUser.role === key" x-text="label"></option>
                    </template>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">Bağlı Olduğu Yönetici</label>
                  <select class="field-input" name="manager_id">
                    <option value="">Sistem Yöneticisi</option>
                    <template x-for="m in editManagers" :key="m.id">
                      <option :value="m.id" :selected="editingUser.manager_id === m.id" x-text="m.name"></option>
                    </template>
                  </select>
                </div>
                <div class="field-group">
                  <label class="field-label">
                    Yıllık İzin Bakiyesi (Gün)
                    <span class="field-label-hint">Mevcut: <span x-text="editingUser.leave_balance"></span> Gün</span>
                  </label>
                  <input class="field-input" name="leave_balance" type="number" min="0"
                         :value="editingUser.leave_balance" />
                </div>
                <div class="field-group">
                  <label class="field-label">İşe Giriş Tarihi</label>
                  <input class="field-input" name="start_date" type="date"
                         :value="editingUser.start_date?.slice(0,10) ?? ''" />
                </div>
                <div class="field-group">
                  <label class="field-label">Doğum Tarihi</label>
                  <input class="field-input" name="birth_date" type="date"
                         :value="editingUser.birth_date?.slice(0,10) ?? ''" />
                </div>
                <div class="field-group">
                  <label class="field-label">Cihaz Kısıtlaması (UA)</label>
                  <input class="field-input" name="allowed_device"
                         :value="editingUser.allowed_device ?? ''"
                         placeholder="Örn: iPhone, Samsung" />
                  <p class="field-hint">Boş bırakılırsa her cihazdan giriş yapabilir.</p>
                </div>
                <div class="field-group">
                  <label class="field-label">
                    Sabit Cihaz Kimliği (Fixed ID)
                    <template x-if="editingUser.device_id">
                      <button type="button" class="field-label-link" @click="clearDeviceLock()">Cihaz Kilidini Kaldır</button>
                    </template>
                  </label>
                  <input class="field-input" name="device_id" x-model="editDeviceId"
                         placeholder="Otomatik atanır, manuel girmek için yapıştırın" />
                </div>
                <div class="field-group">
                  <label class="field-label">Şifre Sıfırla (Yeni Şifre)</label>
                  <input class="field-input" name="password" type="password"
                         placeholder="Değiştirmek istemiyorsanız boş bırakın" />
                </div>
                <div class="field-group field-group--full">
                  <label class="remote-toggle">
                    <input type="checkbox" name="can_remote_check_in"
                           :checked="editingUser.can_remote_check_in" />
                    <div>
                      <p class="remote-toggle-title">${ICON_TRUCK} Nakliye / Uzaktan Giriş Yetkisi</p>
                      <p class="remote-toggle-desc">Bu personel ofis dışından da giriş-çıkış yapabilir. Konumu kaydedilir, yöneticileri bildirim alır.</p>
                    </div>
                  </label>
                </div>
                <div class="field-group field-group--full edit-modal-footer-btns">
                  <button type="button" class="edit-btn-del" @click="openDeleteFromModal()">Sil</button>
                  <button type="submit" class="edit-btn-save" :disabled="editSaving">
                    <span x-text="editSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'"></span>
                  </button>
                </div>
              </form>

            </div>
          </template>
        </div>

      </div>
    `;
  }
}
