/* ==========================================================================
   <c-command-palette>
   Ctrl+K / Cmd+K ile açılan klavye-driven bileşen arama overlay'i.
   Sayfa yüklendiğinde global kısayolu otomatik dinler.

   Attribute'lar:
     base — sayfa URL'leri için prefix (varsayılan: "./")

   JS API:
     el.open()   — paleti programatik olarak aç
     el.close()  — paleti kapat

   Kullanım:
     <c-command-palette base="./"></c-command-palette>
   ========================================================================== */

const _CP_DATA = [
    { label: 'Navbar',             group: 'Layout',        file: 'navbar.html' },
    { label: 'Sidebar',            group: 'Layout',        file: 'sidebar.html' },
    { label: 'Breadcrumb',         group: 'Layout',        file: 'breadcrumb.html' },
    { label: 'Theme Toggle',       group: 'Layout',        file: 'theme-toggle.html' },
    { label: 'Back to Top',        group: 'Layout',        file: 'back-to-top.html' },
    { label: 'Read Progress',      group: 'Layout',        file: 'read-progress.html' },
    { label: 'Callout',            group: 'İçerik',        file: 'callout.html' },
    { label: 'Button',             group: 'İçerik',        file: 'button.html' },
    { label: 'Card',               group: 'İçerik',        file: 'card.html' },
    { label: 'Badge',              group: 'İçerik',        file: 'badge.html' },
    { label: 'Alert',              group: 'İçerik',        file: 'alert.html' },
    { label: 'Prop Table',         group: 'İçerik',        file: 'prop-table.html' },
    { label: 'Comparison',         group: 'İçerik',        file: 'comparison.html' },
    { label: 'Table',              group: 'İçerik',        file: 'table.html' },
    { label: 'Method Signature',   group: 'İçerik',        file: 'method-signature.html' },
    { label: 'Timeline',           group: 'İçerik',        file: 'timeline.html' },
    { label: 'Tooltip',            group: 'İçerik',        file: 'tooltip.html' },
    { label: 'Image Zoom',         group: 'İçerik',        file: 'image-zoom.html' },
    { label: 'Divider',            group: 'İçerik',        file: 'divider.html' },
    { label: 'Stat',               group: 'İçerik',        file: 'stat.html' },
    { label: 'Skeleton Loader',    group: 'İçerik',        file: 'skeleton.html' },
    { label: 'Empty State',        group: 'İçerik',        file: 'empty-state.html' },
    { label: 'Steps',              group: 'Docs',          file: 'steps.html' },
    { label: 'Keyboard (Kbd)',     group: 'Docs',          file: 'kbd.html' },
    { label: 'File Tree',          group: 'Docs',          file: 'file-tree.html' },
    { label: 'API Endpoint',       group: 'Docs',          file: 'api-endpoint.html' },
    { label: 'Changelog',          group: 'Docs',          file: 'changelog.html' },
    { label: 'Copy Button',        group: 'Docs',          file: 'copy-button.html' },
    { label: 'Print Button',       group: 'Docs',          file: 'print-button.html' },
    { label: 'Code Block',         group: 'Kod',           file: 'code-block.html' },
    { label: 'Terminal',           group: 'Kod',           file: 'terminal.html' },
    { label: 'Diff View',          group: 'Kod',           file: 'diff.html' },
    { label: 'Live Demo',          group: 'Kod',           file: 'live-demo.html' },
    { label: 'Tabs',               group: 'Etkileşimli',   file: 'tabs.html' },
    { label: 'Accordion',          group: 'Etkileşimli',   file: 'accordion.html' },
    { label: 'İçindekiler (TOC)',  group: 'Etkileşimli',   file: 'toc.html' },
    { label: 'Pagination Nav',     group: 'Etkileşimli',   file: 'pagination-nav.html' },
    { label: 'Search Box',         group: 'Etkileşimli',   file: 'search-box.html' },
    { label: 'Blueprint',          group: 'Etkileşimli',   file: 'blueprint.html' },
    { label: 'Heading Anchor',     group: 'Etkileşimli',   file: 'heading-anchor.html' },
    { label: 'Modal',              group: 'Etkileşimli',   file: 'modal.html' },
    { label: 'Feedback',           group: 'Etkileşimli',   file: 'feedback.html' },
    { label: 'Toast',              group: 'Etkileşimli',   file: 'toast.html' },
    { label: 'Popover',            group: 'Etkileşimli',   file: 'popover.html' },
    { label: 'Command Palette',    group: 'Etkileşimli',   file: 'command-palette.html' },
    { label: 'Banner',             group: 'Etkileşimli',   file: 'banner.html' },
    { label: 'Color Swatch',       group: 'Design System', file: 'color-swatch.html' },
    { label: 'Font Scale',         group: 'Design System', file: 'font-scale.html' },
    { label: 'Spacing Scale',      group: 'Design System', file: 'spacing-scale.html' },
    { label: 'Icon Gallery',       group: 'Design System', file: 'icon-gallery.html' },
];

class CCommandPalette extends HTMLElement {
    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;

        this._base      = this.getAttribute('base') || './';
        this._activeIdx = -1;
        this._flatItems = [];

        this._render();
        this._bindGlobal();
    }

    _render() {
        const svg = `<svg class="c-cmdpal__search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">
            <circle cx="8.5" cy="8.5" r="5.5"/>
            <line x1="13" y1="13" x2="18" y2="18"/>
        </svg>`;

        this.innerHTML = `
            <div class="c-cmdpal" role="dialog" aria-modal="true" aria-label="Command Palette" hidden>
                <div class="c-cmdpal__backdrop"></div>
                <div class="c-cmdpal__panel">
                    <div class="c-cmdpal__search-wrap">
                        ${svg}
                        <input class="c-cmdpal__input" type="text"
                               placeholder="Bileşen ara…" autocomplete="off" spellcheck="false">
                        <kbd class="c-cmdpal__kbd-hint">Esc</kbd>
                    </div>
                    <ul class="c-cmdpal__list" role="listbox" aria-label="Sonuçlar"></ul>
                    <div class="c-cmdpal__footer">
                        <span class="c-cmdpal__footer-hint"><kbd>↑</kbd><kbd>↓</kbd> gezin</span>
                        <span class="c-cmdpal__footer-hint"><kbd>↵</kbd> aç</span>
                        <span class="c-cmdpal__footer-hint"><kbd>Esc</kbd> kapat</span>
                    </div>
                </div>
            </div>
        `;

        this._el    = this.querySelector('.c-cmdpal');
        this._input = this.querySelector('.c-cmdpal__input');
        this._list  = this.querySelector('.c-cmdpal__list');

        this.querySelector('.c-cmdpal__backdrop').addEventListener('click', () => this.close());
        this._input.addEventListener('input', () => this._search());
    }

    _bindGlobal() {
        document.addEventListener('keydown', e => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this._isOpen() ? this.close() : this.open();
                return;
            }
            if (!this._isOpen()) return;
            if (e.key === 'Escape')    { e.preventDefault(); this.close();      return; }
            if (e.key === 'ArrowDown') { e.preventDefault(); this._move(+1);    return; }
            if (e.key === 'ArrowUp')   { e.preventDefault(); this._move(-1);    return; }
            if (e.key === 'Enter')     { e.preventDefault(); this._navigate();  return; }
        });
    }

    _isOpen() { return !this._el.hidden; }

    open() {
        this._el.hidden   = false;
        this._input.value = '';
        this._activeIdx   = -1;
        this._search();
        requestAnimationFrame(() => this._input.focus());
    }

    close() {
        this._el.hidden = true;
    }

    _search() {
        const q = this._input.value.trim().toLowerCase();
        const filtered = q
            ? _CP_DATA.filter(d =>
                d.label.toLowerCase().includes(q) ||
                d.group.toLowerCase().includes(q))
            : _CP_DATA;
        this._activeIdx = filtered.length ? 0 : -1;
        this._renderList(filtered);
    }

    _renderList(items) {
        if (!items.length) {
            this._flatItems = [];
            this._list.innerHTML = `<li class="c-cmdpal__empty">Sonuç bulunamadı.</li>`;
            return;
        }

        /* Grupla (sırayı koru) */
        const groups   = [];
        const groupMap = {};
        items.forEach(item => {
            if (!groupMap[item.group]) {
                groupMap[item.group] = [];
                groups.push({ label: item.group, items: groupMap[item.group] });
            }
            groupMap[item.group].push(item);
        });

        this._flatItems = groups.flatMap(g => g.items);

        let idx  = 0;
        let html = '';
        groups.forEach(g => {
            html += `<li class="c-cmdpal__group-label" role="presentation">${g.label}</li>`;
            g.items.forEach(item => {
                const active = idx === this._activeIdx;
                html += `<li class="c-cmdpal__item${active ? ' c-cmdpal__item--active' : ''}"
                             role="option" aria-selected="${active}" data-idx="${idx}">
                    <span class="c-cmdpal__item-label">${item.label}</span>
                    <span class="c-cmdpal__item-group">${item.group}</span>
                </li>`;
                idx++;
            });
        });

        this._list.innerHTML = html;

        this._list.querySelectorAll('.c-cmdpal__item').forEach(el => {
            el.addEventListener('click', () => {
                this._activeIdx = +el.dataset.idx;
                this._navigate();
            });
            el.addEventListener('mouseenter', () => {
                this._activeIdx = +el.dataset.idx;
                this._updateActive();
            });
        });

        this._scrollToActive();
    }

    _move(dir) {
        if (!this._flatItems.length) return;
        this._activeIdx = Math.max(0, Math.min(this._flatItems.length - 1, this._activeIdx + dir));
        this._updateActive();
        this._scrollToActive();
    }

    _updateActive() {
        this._list.querySelectorAll('.c-cmdpal__item').forEach(el => {
            const on = +el.dataset.idx === this._activeIdx;
            el.classList.toggle('c-cmdpal__item--active', on);
            el.setAttribute('aria-selected', String(on));
        });
    }

    _scrollToActive() {
        const active = this._list.querySelector('.c-cmdpal__item--active');
        if (active) active.scrollIntoView({ block: 'nearest' });
    }

    _navigate() {
        const item = this._flatItems[this._activeIdx];
        if (!item) return;
        this.close();
        window.location.href = this._base + item.file;
    }
}

customElements.define('c-command-palette', CCommandPalette);
