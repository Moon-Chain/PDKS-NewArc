/* ==========================================================================
   <c-tabs> / <c-tab>
   Sekmeli içerik. Her <c-tab title="..."> bir sekme başlığı + panel üretir.
   İlk sekme varsayılan olarak aktiftir.

   Kullanım:
     <c-tabs>
       <c-tab title="Request">...</c-tab>
       <c-tab title="Response">...</c-tab>
     </c-tabs>
   ========================================================================== */

class CTabs extends HTMLElement {
    connectedCallback() {
        const tabs = Array.from(this.children).filter(c => c.tagName.toLowerCase() === 'c-tab');
        if (tabs.length === 0) {
            return;
        }

        const nav = document.createElement('div');
        nav.className = 'c-tabs__nav';
        nav.setAttribute('role', 'tablist');

        const panels = document.createElement('div');
        panels.className = 'c-tabs__panels';

        tabs.forEach((tab, index) => {
            const title = tab.getAttribute('title') || `Tab ${index + 1}`;
            const panelId = `c-tabs-panel-${Math.random().toString(36).slice(2, 8)}-${index}`;

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'c-tabs__btn' + (index === 0 ? ' c-tabs__btn--active' : '');
            button.textContent = title;
            button.setAttribute('role', 'tab');
            button.setAttribute('aria-controls', panelId);

            const panel = document.createElement('div');
            panel.className = 'c-tabs__panel' + (index === 0 ? ' c-tabs__panel--active' : '');
            panel.id = panelId;
            panel.setAttribute('role', 'tabpanel');
            panel.append(...Array.from(tab.childNodes));

            button.addEventListener('click', () => {
                nav.querySelectorAll('.c-tabs__btn').forEach(b => b.classList.remove('c-tabs__btn--active'));
                panels.querySelectorAll('.c-tabs__panel').forEach(p => p.classList.remove('c-tabs__panel--active'));
                button.classList.add('c-tabs__btn--active');
                panel.classList.add('c-tabs__panel--active');
            });

            nav.appendChild(button);
            panels.appendChild(panel);
        });

        this.innerHTML = '';
        this.appendChild(nav);
        this.appendChild(panels);
    }
}

customElements.define('c-tabs', CTabs);

/* <c-tab> sadece <c-tabs> tarafından okunan bir veri taşıyıcısıdır,
   işlenmeden önce CSS ile gizlenir (bkz. c-tabs.css). */
class CTab extends HTMLElement { }

customElements.define('c-tab', CTab);
