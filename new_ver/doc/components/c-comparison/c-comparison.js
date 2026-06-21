/* ==========================================================================
   <c-comparison>
   Yan yana "Yap / Yapma" (Do / Don't) karşılaştırma panelleri.
   Design system ve API migration dokümantasyonunda kullanılır.

   Kullanım:
     <c-comparison>
       <c-dont label="Yapma">Kötü örnek...</c-dont>
       <c-do label="Yap">İyi örnek...</c-do>
     </c-comparison>

   label attribute'u opsiyoneldir; varsayılanlar "Yapma" ve "Yap"tır.
   ========================================================================== */

class CComparison extends HTMLElement {
    connectedCallback() {
        const dontEl = this.querySelector('c-dont');
        const doEl   = this.querySelector('c-do');

        const dontLabel = dontEl?.getAttribute('label') || 'Yapma';
        const doLabel   = doEl?.getAttribute('label')   || 'Yap';

        const dontNodes = dontEl ? Array.from(dontEl.childNodes) : [];
        const doNodes   = doEl   ? Array.from(doEl.childNodes)   : [];

        this.classList.add('c-comparison');
        this.innerHTML = `
            <div class="c-comparison__panel c-comparison__panel--dont">
                <div class="c-comparison__label">${dontLabel}</div>
                <div class="c-comparison__body"></div>
            </div>
            <div class="c-comparison__panel c-comparison__panel--do">
                <div class="c-comparison__label">${doLabel}</div>
                <div class="c-comparison__body"></div>
            </div>`;

        const [dontBody, doBody] = this.querySelectorAll('.c-comparison__body');
        dontBody.append(...dontNodes);
        doBody.append(...doNodes);
    }
}

customElements.define('c-comparison', CComparison);

/* Veri taşıyıcı elementler — sadece c-comparison tarafından okunur */
class CDont extends HTMLElement {}
customElements.define('c-dont', CDont);

class CDo extends HTMLElement {}
customElements.define('c-do', CDo);
