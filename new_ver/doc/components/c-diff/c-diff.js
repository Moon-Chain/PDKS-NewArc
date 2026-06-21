/* ==========================================================================
   <c-diff>
   Satır bazlı kod farkı görüntüleyici. LCS algoritmasıyla eklenen (+) ve
   silinen (-) satırları tespit eder; bitişik remove/add çiftlerinde kelime
   bazlı inline vurgulama yapar.

   Attribute'lar:
     lang       - Prism dil sınıfı (varsayılan: "markup")
     label-from - Sol etiket  (varsayılan: "before")
     label-to   - Sağ etiket  (varsayılan: "after")

   Kullanım:
     <c-diff lang="javascript" label-from="v1.js" label-to="v2.js">
       <script type="text/plain" slot="from">eski kod</script>
       <script type="text/plain" slot="to">yeni kod</script>
     </c-diff>
   ========================================================================== */

/* ── LCS satır diff ── */
function diffLines(oldStr, newStr) {
    const a = oldStr === '' ? [] : oldStr.split('\n');
    const b = newStr === '' ? [] : newStr.split('\n');
    const m = a.length, n = b.length;

    if (m * n > 80000) {
        return [
            ...a.map(line => ({ type: 'remove', line })),
            ...b.map(line => ({ type: 'add',    line })),
        ];
    }

    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);

    const chunks = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
            chunks.unshift({ type: 'equal',  line: a[i-1] }); i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
            chunks.unshift({ type: 'add',    line: b[j-1] }); j--;
        } else {
            chunks.unshift({ type: 'remove', line: a[i-1] }); i--;
        }
    }
    return chunks;
}

/* ── Kelime bazlı inline diff ── */
function inlineDiff(oldLine, newLine) {
    const tokenize = s => s.match(/[a-zA-Z0-9_$]+|[^a-zA-Z0-9_$]/g) || [];
    const a = tokenize(oldLine);
    const b = tokenize(newLine);
    const m = a.length, n = b.length;

    if (m * n > 6000) {
        return { oldHtml: esc(oldLine), newHtml: esc(newLine) };
    }

    const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = a[i-1] === b[j-1]
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);

    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
            ops.unshift({ t: 'eq',  o: a[i-1], n: b[j-1] }); i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
            ops.unshift({ t: 'add', n: b[j-1] }); j--;
        } else {
            ops.unshift({ t: 'del', o: a[i-1] }); i--;
        }
    }

    const oldHtml = ops.filter(c => c.t !== 'add').map(c =>
        c.t === 'del'
            ? `<mark class="c-diff__mark c-diff__mark--remove">${esc(c.o)}</mark>`
            : esc(c.o)
    ).join('');

    const newHtml = ops.filter(c => c.t !== 'del').map(c =>
        c.t === 'add'
            ? `<mark class="c-diff__mark c-diff__mark--add">${esc(c.n)}</mark>`
            : esc(c.n)
    ).join('');

    return { oldHtml, newHtml };
}

/* ── Chunk'ları satır HTML'ine dönüştür ── */
function processChunks(chunks, lang) {
    const rows = [];
    let i = 0;

    while (i < chunks.length) {
        if (chunks[i].type === 'equal') {
            rows.push({ type: 'equal', line: chunks[i].line, html: hlLine(chunks[i].line, lang) });
            i++;
            continue;
        }

        /* Bitişik remove + add bloklarını topla */
        const removes = [], adds = [];
        while (i < chunks.length && chunks[i].type === 'remove') removes.push(chunks[i++].line);
        while (i < chunks.length && chunks[i].type === 'add')    adds.push(chunks[i++].line);

        const pairs = Math.min(removes.length, adds.length);

        for (let k = 0; k < pairs; k++) {
            const { oldHtml, newHtml } = inlineDiff(removes[k], adds[k]);
            rows.push({ type: 'remove', line: removes[k], html: oldHtml });
            rows.push({ type: 'add',    line: adds[k],    html: newHtml });
        }
        for (let k = pairs; k < removes.length; k++)
            rows.push({ type: 'remove', line: removes[k], html: esc(removes[k]) });
        for (let k = pairs; k < adds.length; k++)
            rows.push({ type: 'add', line: adds[k], html: esc(adds[k]) });
    }

    return rows;
}

function esc(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hlLine(line, lang) {
    if (window.Prism) {
        const grammar = Prism.languages[lang] || Prism.languages.markup;
        return Prism.highlight(line, grammar, lang);
    }
    return esc(line);
}

/* ── Web Component ── */
class CDiff extends HTMLElement {
    connectedCallback() {
        if (this._rendered) return;
        this._rendered = true;

        const lang      = this.getAttribute('lang')       || 'markup';
        const labelFrom = this.getAttribute('label-from') || 'before';
        const labelTo   = this.getAttribute('label-to')   || 'after';

        const fromEl  = this.querySelector('[slot="from"]');
        const toEl    = this.querySelector('[slot="to"]');
        const fromStr = fromEl ? fromEl.textContent.trim() : '';
        const toStr   = toEl   ? toEl.textContent.trim()   : '';

        this.innerHTML = '';
        this.classList.add('c-diff');

        /* Başlık */
        const header = document.createElement('div');
        header.className = 'c-diff__header';
        header.innerHTML = `
            <span class="c-diff__label c-diff__label--from">${esc(labelFrom)}</span>
            <span class="c-diff__header-arrow">→</span>
            <span class="c-diff__label c-diff__label--to">${esc(labelTo)}</span>
        `;
        this.appendChild(header);

        /* Satırlar */
        const body = document.createElement('div');
        body.className = 'c-diff__body';

        const rows = processChunks(diffLines(fromStr, toStr), lang);
        const signs = { add: '+', remove: '−', equal: '' };
        let oldN = 1, newN = 1;

        rows.forEach(({ type, html }) => {
            const oldNum = type !== 'add'    ? oldN++ : '';
            const newNum = type !== 'remove' ? newN++ : '';

            const row = document.createElement('div');
            row.className = `c-diff__row c-diff__row--${type}`;
            row.innerHTML =
                `<div class="c-diff__gutter">` +
                    `<span class="c-diff__ln">${oldNum}</span>` +
                    `<span class="c-diff__ln">${newNum}</span>` +
                    `<span class="c-diff__sign">${signs[type]}</span>` +
                `</div>` +
                `<code class="c-diff__code">${html}</code>`;
            body.appendChild(row);
        });

        this.appendChild(body);
    }
}

customElements.define('c-diff', CDiff);
