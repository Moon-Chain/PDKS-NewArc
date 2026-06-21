/* ==========================================================================
   <c-api-endpoint>
   REST endpoint kartı. Method badge + URL + açıklama + parametre tablosu
   + istek/yanıt örneklerini tek bir açılır/kapanır kart içinde gösterir.
   Swagger'a gerek kalmadan inline API dokümantasyonu için kullanılır.

   Attribute'lar:
     method  - GET | POST | PUT | PATCH | DELETE (varsayılan: GET)
     url     - endpoint yolu, ör. /api/v1/users
     summary - kısa açıklama metni (opsiyonel)

   Veri (opsiyonel <script type="application/json"> içinde):
     {
       "params": [
         { "name": "page", "type": "integer", "required": false, "desc": "Sayfa no" }
       ],
       "request":  "{ \"name\": \"Ali\" }",
       "response": "{ \"id\": 1, \"name\": \"Ali\" }"
     }

   Kullanım:
     <c-api-endpoint method="GET" url="/api/users" summary="Kullanıcıları listele">
       <script type="application/json">
       { "params": [{ "name": "page", "type": "integer", "required": false, "desc": "Sayfa" }],
         "response": "{ \"users\": [...] }" }
       </script>
     </c-api-endpoint>
   ========================================================================== */

class CApiEndpoint extends HTMLElement {
    connectedCallback() {
        const method  = (this.getAttribute('method') || 'GET').toUpperCase();
        const url     = this.getAttribute('url')     || '/';
        const summary = this.getAttribute('summary') || '';

        const scriptEl = this.querySelector('script[type="application/json"]');
        let data = {};
        if (scriptEl) {
            try { data = JSON.parse(scriptEl.textContent); } catch (e) {}
        }

        const params   = data.params   || [];
        const request  = data.request  || null;
        const response = data.response || null;

        this.innerHTML = '';
        this.classList.add('c-api-endpoint');

        /* ── Başlık ── */
        const header = document.createElement('div');
        header.className = 'c-api-endpoint__header';

        const badge = document.createElement('span');
        badge.className = `c-badge c-badge--${method.toLowerCase()}`;
        badge.textContent = method;

        const urlEl = document.createElement('span');
        urlEl.className = 'c-api-endpoint__url';
        urlEl.textContent = url;

        const chevron = document.createElement('span');
        chevron.className = 'c-api-endpoint__chevron c-api-endpoint__chevron--open';
        chevron.textContent = '▼';

        header.appendChild(badge);
        header.appendChild(urlEl);

        if (summary) {
            const summaryEl = document.createElement('span');
            summaryEl.className = 'c-api-endpoint__summary';
            summaryEl.textContent = summary;
            header.appendChild(summaryEl);
        }

        header.appendChild(chevron);

        /* ── Gövde ── */
        const body = document.createElement('div');
        body.className = 'c-api-endpoint__body';

        if (params.length > 0) {
            const label = document.createElement('div');
            label.className = 'c-api-endpoint__section-label';
            label.textContent = 'Parametreler';
            body.appendChild(label);

            const table = document.createElement('table');
            table.className = 'c-api-endpoint__params';

            const thead = document.createElement('thead');
            thead.innerHTML = '<tr><th>İsim</th><th>Tür</th><th>Zorunlu</th><th>Açıklama</th></tr>';
            table.appendChild(thead);

            const tbody = document.createElement('tbody');
            params.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${p.name || ''}</td>
                    <td>${p.type || ''}</td>
                    <td>${p.required ? '<span class="c-api-endpoint__required">✓</span>' : '—'}</td>
                    <td>${p.desc || ''}</td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            body.appendChild(table);
        }

        if (request) {
            const label = document.createElement('div');
            label.className = 'c-api-endpoint__section-label';
            label.textContent = 'İstek Gövdesi';
            body.appendChild(label);

            const pre = document.createElement('pre');
            pre.className = 'c-api-endpoint__code language-json';
            const codeReq = document.createElement('code');
            codeReq.className = 'language-json';
            if (window.Prism && Prism.languages.json) {
                codeReq.innerHTML = Prism.highlight(request, Prism.languages.json, 'json');
            } else {
                codeReq.textContent = request;
            }
            pre.appendChild(codeReq);
            body.appendChild(pre);
        }

        if (response) {
            const label = document.createElement('div');
            label.className = 'c-api-endpoint__section-label';
            label.textContent = 'Yanıt';
            body.appendChild(label);

            const pre = document.createElement('pre');
            pre.className = 'c-api-endpoint__code language-json';
            const codeRes = document.createElement('code');
            codeRes.className = 'language-json';
            if (window.Prism && Prism.languages.json) {
                codeRes.innerHTML = Prism.highlight(response, Prism.languages.json, 'json');
            } else {
                codeRes.textContent = response;
            }
            pre.appendChild(codeRes);
            body.appendChild(pre);
        }

        /* ── Toggle ── */
        header.addEventListener('click', () => {
            const collapsed = body.classList.toggle('c-api-endpoint__body--collapsed');
            chevron.classList.toggle('c-api-endpoint__chevron--open', !collapsed);
        });

        this.appendChild(header);
        this.appendChild(body);
    }
}

customElements.define('c-api-endpoint', CApiEndpoint);
