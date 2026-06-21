/* ==========================================================================
   <c-font-scale>
   Tipografi ölçeği görselleştiricisi. tokens.css'teki --c-font-size-*
   token'larını otomatik okuyup büyükten küçüğe listeler.

   Kullanım: <c-font-scale></c-font-scale>
   ========================================================================== */

class CFontScale extends HTMLElement {
    connectedCallback() {
        const tokens  = this._discover('--c-font-size-');
        const styles  = getComputedStyle(document.documentElement);

        const items = tokens
            .map(name => ({ name, value: styles.getPropertyValue(name).trim() }))
            .filter(t => t.value)
            .sort((a, b) => parseFloat(b.value) - parseFloat(a.value));

        this.classList.add('c-font-scale');
        this.innerHTML = items.map(t => {
            const px = Math.round(parseFloat(t.value) * 16);
            return `
            <div class="c-font-scale__row">
                <span class="c-font-scale__sample" style="font-size:var(${t.name})">
                    Aa — Hızlı kahverengi tilki
                </span>
                <span class="c-font-scale__meta">
                    <code class="c-font-scale__name">${t.name}</code>
                    <span class="c-font-scale__value">${t.value} · ${px}px</span>
                </span>
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
        return [
            '--c-font-size-4xl', '--c-font-size-3xl', '--c-font-size-2xl',
            '--c-font-size-xl',  '--c-font-size-lg',  '--c-font-size-base',
            '--c-font-size-sm',  '--c-font-size-xs',
        ];
    }
}

customElements.define('c-font-scale', CFontScale);
