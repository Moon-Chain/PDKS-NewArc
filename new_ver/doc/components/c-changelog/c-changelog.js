/* ==========================================================================
   <c-changelog> / <c-change>
   Tag odaklı kompakt değişiklik günlüğü. c-timeline'dan farkı: semver
   başlığı + Added/Changed/Fixed/Removed etiketleriyle satır bazlı liste.
   Birden fazla <c-changelog> üst üste yerleştirilerek tam changelog oluşur.

   Attribute'lar (c-changelog):
     version - sürüm etiketi, ör. "v1.2.0"
     date    - tarih metni, ör. "2025-06" veya "2025-06-15"

   Attribute'lar (c-change):
     type    - added | changed | fixed | removed | deprecated | security

   Kullanım:
     <c-changelog version="v1.1.0" date="2025-06">
       <c-change type="added">11 yeni bileşen eklendi.</c-change>
       <c-change type="fixed">Blueprint port hesaplaması düzeltildi.</c-change>
       <c-change type="changed">Sidebar mobil davranışı iyileştirildi.</c-change>
     </c-changelog>
   ========================================================================== */

class CChangelog extends HTMLElement {
    connectedCallback() {
        const version = this.getAttribute('version') || '';
        const date    = this.getAttribute('date')    || '';
        const changes = Array.from(this.querySelectorAll('c-change'));

        this.classList.add('c-changelog');

        /* Başlık */
        const header = document.createElement('div');
        header.className = 'c-changelog__header';

        if (version) {
            const vEl = document.createElement('span');
            vEl.className  = 'c-changelog__version';
            vEl.textContent = version;
            header.appendChild(vEl);
        }

        if (date) {
            const dEl = document.createElement('span');
            dEl.className  = 'c-changelog__date';
            dEl.textContent = date;
            header.appendChild(dEl);
        }

        /* Değişiklik listesi */
        const list = document.createElement('ul');
        list.className = 'c-changelog__list';

        changes.forEach(change => {
            const type = change.getAttribute('type') || 'changed';
            const text = change.textContent.trim();

            const li = document.createElement('li');
            li.className = 'c-changelog__item';

            const tag = document.createElement('span');
            tag.className  = `c-changelog__tag c-changelog__tag--${type}`;
            tag.textContent = type;

            const textEl = document.createElement('span');
            textEl.className  = 'c-changelog__text';
            textEl.textContent = text;

            li.appendChild(tag);
            li.appendChild(textEl);
            list.appendChild(li);
        });

        this.innerHTML = '';
        this.appendChild(header);
        this.appendChild(list);
    }
}

customElements.define('c-changelog', CChangelog);

class CChange extends HTMLElement {}
customElements.define('c-change', CChange);
