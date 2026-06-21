/* ==========================================================================
   <c-method-signature>
   TypeScript stili fonksiyon/metod imzası gösterimi.
   c-api-endpoint'in kod tarafını tamamlar.

   İki kullanım modu vardır:

   1) Structured — name + c-param elementleri:
     <c-method-signature name="getUserById" returns="Promise&lt;User&gt;">
       <c-param name="id" type="string"></c-param>
       <c-param name="options" type="RequestOptions" optional></c-param>
     </c-method-signature>

   2) Düz metin — olduğu gibi render edilir:
     <c-method-signature>getUserById(id: string): User</c-method-signature>
   ========================================================================== */

class CMethodSignature extends HTMLElement {
    connectedCallback() {
        const name    = this.getAttribute('name');
        const returns = this.getAttribute('returns');

        this.classList.add('c-method-signature');

        if (name) {
            const params = Array.from(this.querySelectorAll('c-param'));
            const parts  = params.map((p, i) => {
                const pName    = p.getAttribute('name') || '';
                const pType    = p.getAttribute('type') || '';
                const optional = p.hasAttribute('optional');
                const comma    = i < params.length - 1 ? '<span class="c-ms__comma">, </span>' : '';
                return `<span class="c-ms__param-name">${pName}${optional ? '?' : ''}</span>`
                     + `<span class="c-ms__punct">: </span>`
                     + `<span class="c-ms__param-type">${pType}</span>`
                     + comma;
            }).join('');

            const returnPart = returns
                ? `<span class="c-ms__punct">: </span><span class="c-ms__return">${returns}</span>`
                : '';

            this.innerHTML = `<pre class="c-ms__pre"><code>`
                + `<span class="c-ms__fn-name">${name}</span>`
                + `<span class="c-ms__punct">(</span>`
                + parts
                + `<span class="c-ms__punct">)</span>`
                + returnPart
                + `</code></pre>`;
        } else {
            const raw = this.textContent.trim();
            this.innerHTML = `<pre class="c-ms__pre"><code>${raw}</code></pre>`;
        }
    }
}

customElements.define('c-method-signature', CMethodSignature);

/* Veri taşıyıcı — sadece c-method-signature tarafından okunur */
class CParam extends HTMLElement {}
customElements.define('c-param', CParam);
