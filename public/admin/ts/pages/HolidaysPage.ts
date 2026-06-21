import { BasePage } from '../../../ts/core/BasePage.js';
import { api } from '../../../ts/core/ApiClient.js';
import { icon } from '../icons.js';
import { toast, openModal, confirmModal, paginationControls, bindPagination } from '../adminUi.js';

interface HolidayRow {
  id: number;
  year: number;
  date: string;
  name: string;
  is_half_day: boolean;
}

function yearOptionsHtml(selected: number): string {
  const current = new Date().getFullYear();
  const years = [current - 1, current, current + 1, current + 2];
  return years.map(y => `<option value="${y}" ${y === selected ? 'selected' : ''}>${y}</option>`).join('');
}

function fmtDate(date: string): string {
  return new Date(date).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', weekday: 'long' });
}

const PER_PAGE = 10;

export class HolidaysPage extends BasePage {
  private year = new Date().getFullYear();
  private rows: HolidayRow[] = [];
  private page = 1;

  async render(): Promise<void> {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Yükleniyor...</p></div>`;
    await this.load();
  }

  private async load(): Promise<void> {
    try {
      const res = await api.get<{ success: boolean; rows: HolidayRow[] }>(`/api/v1/holidays?year=${this.year}`);
      this.rows = res.rows;
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Tatil günleri yüklenemedi', 'error');
      this.rows = [];
    }
    this.draw();
  }

  private get totalPages(): number {
    return Math.max(1, Math.ceil(this.rows.length / PER_PAGE));
  }

  private get pageRows(): HolidayRow[] {
    const start = (this.page - 1) * PER_PAGE;
    return this.rows.slice(start, start + PER_PAGE);
  }

  private draw(): void {
    const rows = this.pageRows;
    this.container.innerHTML = `
      <div class="card">
        <div class="toolbar">
          <select class="input" id="holidays-year" style="max-width:120px">${yearOptionsHtml(this.year)}</select>
          <div class="toolbar-spacer"></div>
          <span class="badge badge-muted">${this.rows.length} tatil günü</span>
          <button class="btn btn-primary" id="holidays-add">${icon('calendar-plus')} Tatil Günü Ekle</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead><tr>
              <th>Tarih</th>
              <th>Adı</th>
              <th>Tür</th>
              <th></th>
            </tr></thead>
            <tbody>
              ${rows.length === 0
                ? `<tr><td colspan="4" style="text-align:center; color:var(--text-muted)">Tatil günü bulunamadı</td></tr>`
                : rows.map(h => `
                  <tr>
                    <td>${fmtDate(h.date)}</td>
                    <td>${h.name}</td>
                    <td><span class="badge badge-muted">${h.is_half_day ? 'Yarım Gün' : 'Tam Gün'}</span></td>
                    <td><button class="btn btn-ghost btn-sm holidays-delete" data-id="${h.id}">${icon('trash-2', 'icon icon-sm')} Sil</button></td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
        ${paginationControls(this.page, this.totalPages, this.rows.length, PER_PAGE)}
      </div>
    `;

    this.on('#holidays-year', 'change', async (e) => {
      this.year = Number((e.target as HTMLSelectElement).value);
      this.page = 1;
      await this.load();
    });
    this.on('#holidays-add', 'click', () => this.openAddModal());
    bindPagination(this.container, this.page, this.totalPages, (p) => {
      this.page = p;
      this.draw();
    });

    this.$$('.holidays-delete').forEach(el => {
      el.addEventListener('click', () => {
        const id = Number(el.getAttribute('data-id'));
        const h = this.rows.find(x => x.id === id);
        if (h) this.deleteHoliday(h);
      });
    });
  }

  private openAddModal(): void {
    const { el, close } = openModal('Tatil Günü Ekle', `
      <form id="add-holiday-form" class="form-grid">
        <div class="form-field"><label class="label">Tarih</label><input class="input" type="date" name="date" required /></div>
        <div class="form-field"><label class="label">Adı</label><input class="input" name="name" required /></div>
        <div class="form-field" style="grid-column: 1 / -1">
          <label class="label" style="display:flex; align-items:center; gap:8px; cursor:pointer">
            <input type="checkbox" name="is_half_day" />
            Yarım Gün
          </label>
        </div>
        <div class="modal-actions" style="grid-column: 1 / -1">
          <button type="button" class="btn btn-ghost modal-cancel">İptal</button>
          <button type="submit" class="btn btn-primary">Ekle</button>
        </div>
      </form>
    `);

    el.querySelector('.modal-cancel')?.addEventListener('click', close);

    const form = el.querySelector('#add-holiday-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const data = {
        date: String(fd.get('date')),
        name: String(fd.get('name')),
        is_half_day: !!form.querySelector<HTMLInputElement>('[name=is_half_day]')?.checked,
      };
      try {
        await api.post('/api/v1/holidays', data);
        toast('Tatil günü eklendi', 'success');
        close();
        this.year = parseInt(data.date.split('-')[0]);
        this.page = 1;
        await this.load();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Hata', 'error');
      }
    });
  }

  private async deleteHoliday(h: HolidayRow): Promise<void> {
    const ok = await confirmModal({
      title: 'Tatil Günü Sil',
      message: `"${h.name}" (${fmtDate(h.date)}) tatil gününü silmek istediğinize emin misiniz?`,
      confirmText: 'Sil',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.delete(`/api/v1/holidays/${h.id}`);
      toast('Tatil günü silindi', 'success');
      await this.load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Hata', 'error');
    }
  }
}
