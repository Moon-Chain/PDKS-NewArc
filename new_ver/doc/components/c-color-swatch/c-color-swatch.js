/* ==========================================================================
   <c-color-swatch>
   Tek bir CSS renk token'ını görselleştirir. Hesaplanmış değeri okur,
   tıklanınca panoya kopyalar.

   Attribute'lar:
     var     — CSS değişken adı (örn. "--c-primary")
     label   — gösterilecek başlık (varsayılan: var değeri)
     variant — "" | "block"  (block: renk bloğu üstte, bilgi altta)

   Kullanım:
     <c-color-swatch var="--c-primary" label="Primary"></c-color-swatch>
     <c-color-swatch var="--c-success" variant="block"></c-color-swatch>
   ========================================================================== */

class CColorSwatch extends HTMLElement {
    connectedCallback() {
        const varName = this.getAttribute('var') || '';
        const label   = this.getAttribute('label') || varName;
        const variant = this.getAttribute('variant') || '';
        const value   = getComputedStyle(document.documentElement)
                            .getPropertyValue(varName).trim();

        this.classList.add('c-color-swatch');
        if (variant) this.classList.add(`c-color-swatch--${variant}`);

        this.title = `${value} — kopyalamak için tıkla`;
        this.innerHTML = `
            <span class="c-color-swatch__block" style="background:var(${varName})"></span>
            <span class="c-color-swatch__info">
                <span class="c-color-swatch__label">${label}</span>
                <code class="c-color-swatch__var">${varName}</code>
                <code class="c-color-swatch__value">${value}</code>
            </span>
        `;

        this.addEventListener('click', () => {
            if (!value) return;
            navigator.clipboard.writeText(value).then(() => {
                this.classList.add('c-color-swatch--copied');
                setTimeout(() => this.classList.remove('c-color-swatch--copied'), 1500);
            });
        });
    }
}

customElements.define('c-color-swatch', CColorSwatch);
