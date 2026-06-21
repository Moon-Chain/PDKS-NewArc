/* ==========================================================================
   <c-spacing-scale>
   Spacing token'larını gerçek boyutlarıyla ve ölçekli barlarla gösterir.
   tokens.css'teki --c-space-* token'larını otomatik okur.

   Kullanım: <c-spacing-scale></c-spacing-scale>
   ========================================================================== */

class CSpacingScale extends HTMLElement {
    connectedCallback() {
        const tokens = this._discover('--c-space-');
        const styles = getComputedStyle(document.documentElement);

        const items = tokens
            .map(name => ({ name, value: styles.getPropertyValue(name).trim() }))
            .filter(t => t.value)
            .sort((a, b) => parseFloat(a.value) - parseFloat(b.value));

        const maxRem = Math.max(...items.map(t => parseFloat(t.value)));

        this.classList.add('c-spacing-scale');
        this.innerHTML = items.map(t => {
            const rem = parseFloat(t.value);
            const px  = Math.round(rem * 16);
            const pct = Math.round((rem / maxRem) * 100);
            return `
            <div class="c-spacing-scale__row">
                <code class="c-spacing-scale__name">${t.name}</code>
                <div class="c-spacing-scale__bar-wrap" title="${t.value} · ${px}px">
                    <div class="c-spacing-scale__bar" style="width:${pct}%"></div>
                    <div class="c-spacing-scale__real" style="width:var(${t.name});height:var(${t.name})" title="Gerçek boyut: ${px}×${px}px"></div>
                </div>
                <span class="c-spacing-scale__value">${t.value}<span class="c-spacing-scale__px"> · ${px}px</span></span>
            </div>`;
        }).join('');
    }

    _discover(prefix) {
        try {
            for (const sheet of document.styleSheets) {
                for (const rule of sheet.cssRules) {
                    if (rule.selectorText === ':root') {
                        return [...rule.style].filter(p => p.trim().startsWith(prefix));
                    }
                }
            }
        } catch (_) {}
        return ['--c-space-1', '--c-space-2', '--c-space-3', '--c-space-4', '--c-space-5'];
    }
}

customElements.define('c-spacing-scale', CSpacingScale);
