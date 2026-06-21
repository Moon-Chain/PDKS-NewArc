/* ==========================================================================
   <c-table>
   Stillendirilmiş, isteğe bağlı sıralanabilir veri tablosu.
   İçine ham <table> yazılır; c-table yatay kaydırma + sıralama ekler.

   Attribute'lar:
     sortable - varsa, th başlıklarına tıklanarak sütun sıralanır
     striped  - varsa, zebra satır renklendirmesi

   Kullanım:
     <c-table sortable striped>
       <table>
         <thead><tr><th>Ad</th><th>Sürüm</th></tr></thead>
         <tbody>...</tbody>
       </table>
     </c-table>
   ========================================================================== */

class CTable extends HTMLElement {
    connectedCallback() {
        this.classList.add('c-table');
        if (this.hasAttribute('striped'))  this.classList.add('c-table--striped');
        if (this.hasAttribute('sortable')) this._initSort();
    }

    _initSort() {
        const table = this.querySelector('table');
        if (!table) return;

        const headers = Array.from(table.querySelectorAll('thead th'));
        headers.forEach((th, colIndex) => {
            th.classList.add('c-table__th--sortable');
            th.setAttribute('aria-sort', 'none');
            th.addEventListener('click', () => this._sortBy(table, colIndex, th, headers));
        });
    }

    _sortBy(table, colIndex, activeTh, allThs) {
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const current = activeTh.dataset.sortOrder || 'none';
        const next    = current === 'asc' ? 'desc' : 'asc';

        allThs.forEach(th => {
            th.dataset.sortOrder = '';
            th.setAttribute('aria-sort', 'none');
            th.classList.remove('c-table__th--asc', 'c-table__th--desc');
        });

        activeTh.dataset.sortOrder = next;
        activeTh.setAttribute('aria-sort', next === 'asc' ? 'ascending' : 'descending');
        activeTh.classList.add(`c-table__th--${next}`);

        const rows = Array.from(tbody.querySelectorAll('tr'));
        rows.sort((a, b) => {
            const aText = a.cells[colIndex]?.textContent.trim() ?? '';
            const bText = b.cells[colIndex]?.textContent.trim() ?? '';
            const aNum  = parseFloat(aText);
            const bNum  = parseFloat(bText);
            const cmp   = (!isNaN(aNum) && !isNaN(bNum))
                ? aNum - bNum
                : aText.localeCompare(bText, 'tr');
            return next === 'asc' ? cmp : -cmp;
        });

        rows.forEach(r => tbody.appendChild(r));
    }
}

customElements.define('c-table', CTable);
