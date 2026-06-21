/* ==========================================================================
   <c-prop-table>
   Bileşen prop/attribute referans tablosu. JSON attribute'dan otomatik render.

   Attribute'lar:
     props - JSON dizisi; her eleman:
             { name, type, default, required, description }

   Kullanım:
     <c-prop-table props='[
       {"name":"variant","type":"string","default":"info","required":false,"description":"Renk teması"},
       {"name":"dismissible","type":"boolean","default":"—","required":false,"description":"Kapatma butonu"}
     ]'></c-prop-table>
   ========================================================================== */

class CPropTable extends HTMLElement {
    connectedCallback() {
        let props = [];
        try { props = JSON.parse(this.getAttribute('props') || '[]'); } catch (_) {}

        this.classList.add('c-prop-table');

        const thead = `<thead><tr>
            <th>Attribute</th>
            <th>Tür</th>
            <th>Varsayılan</th>
            <th>Zorunlu</th>
            <th>Açıklama</th>
        </tr></thead>`;

        const rows = props.map(p => `<tr>
            <td><code>${p.name ?? ''}</code></td>
            <td><code class="c-prop-table__type">${p.type ?? ''}</code></td>
            <td><code>${p.default ?? '—'}</code></td>
            <td class="${p.required ? 'c-prop-table__required' : 'c-prop-table__optional'}">${p.required ? 'evet' : 'hayır'}</td>
            <td>${p.description ?? ''}</td>
        </tr>`).join('');

        this.innerHTML = `<div class="c-prop-table__wrap"><table>${thead}<tbody>${rows}</tbody></table></div>`;
    }
}

customElements.define('c-prop-table', CPropTable);
