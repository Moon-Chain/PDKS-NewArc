/* ==========================================================================
   <c-stat>
   Büyük sayı / metrik kartı. Ana sayfa veya landing dokümantasyon için.

   Attribute'lar:
     value   - görüntülenecek değer (zorunlu)
     label   - değerin altındaki açıklama
     prefix  - değerin önüne eklenir (ör. "$")
     suffix  - değerin sonuna eklenir (ör. "+")
     variant - "" | "accent"  (accent: primary renkle vurgular)

   Kullanım:
     <c-stat value="15" label="bileşen"></c-stat>
     <c-stat value="0" label="bağımlılık" variant="accent"></c-stat>
     <c-stat value="100" suffix="%" label="dosya uyumluluğu"></c-stat>
   ========================================================================== */

class CStat extends HTMLElement {
    connectedCallback() {
        const value   = this.getAttribute('value')   ?? '0';
        const label   = this.getAttribute('label')   ?? '';
        const prefix  = this.getAttribute('prefix')  ?? '';
        const suffix  = this.getAttribute('suffix')  ?? '';
        const variant = this.getAttribute('variant') ?? '';

        this.classList.add('c-stat');
        if (variant) this.classList.add(`c-stat--${variant}`);

        this.innerHTML = `
            <div class="c-stat__value">${prefix}${value}${suffix}</div>
            ${label ? `<div class="c-stat__label">${label}</div>` : ''}
        `;
    }
}

customElements.define('c-stat', CStat);
