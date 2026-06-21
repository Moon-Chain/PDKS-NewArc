/* ==========================================================================
   <c-blueprint>

   Data: child <script type="application/json"> içinde JSON nesnesi.

   {
     nodes: [{
       id, title, x, y, color,
       ports: [{ id, label, dir: "in"|"out"|"none", type?, color? }]
     }],
     connections: [{ from: "nodeId.portId", to: "nodeId.portId", color? }]
   }
   ========================================================================== */

class CBlueprint extends HTMLElement {
    connectedCallback() {
        const script = this.querySelector('script[type="application/json"]');
        if (!script) return;

        let data;
        try { data = JSON.parse(script.textContent); }
        catch { return; }

        this._scale  = 1;
        this._panX   = 0;
        this._panY   = 0;
        this._dots   = {};   // { 'nodeId.portId': dotEl }
        this._nodes  = {};   // { nodeId: el }
        this._conns  = data.connections || [];

        this.innerHTML = '';
        this._build(data);
    }

    _build(data) {
        this._data = data;

        /* x/y verilmemiş düğümlere otomatik konum ata */
        const nodes = data.nodes || [];
        if (nodes.some(n => n.x == null || n.y == null)) {
            const auto = this._autoLayout(nodes, data.connections || []);
            nodes.forEach(n => {
                if (n.x == null) n.x = auto[n.id].x;
                if (n.y == null) n.y = auto[n.id].y;
            });
        }

        /* Canvas kapsayıcı */
        const wrap = document.createElement('div');
        wrap.className = 'c-blueprint';
        this.appendChild(wrap);
        this._wrap = wrap;

        /* Scene — transform hedefi */
        const scene = document.createElement('div');
        scene.className = 'c-blueprint__scene';
        wrap.appendChild(scene);
        this._scene = scene;

        /* SVG bağlantı katmanı (scene içinde, en üstte) */
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('class', 'c-blueprint__svg');
        scene.appendChild(svg);
        this._svg = svg;

        /* Düğümleri oluştur */
        nodes.forEach(nd => {
            const el = this._makeNode(nd);
            scene.appendChild(el);
            this._nodes[nd.id] = el;
            this._makeDraggable(el);
        });

        /* reset butonunun başlangıç konumunu güncelle */
        this._initialPos = Object.fromEntries(nodes.map(n => [n.id, { x: n.x, y: n.y }]));

        /* Kontrol butonları */
        const ctrl = document.createElement('div');
        ctrl.className = 'c-blueprint__controls';
        ctrl.innerHTML = `
            <button class="c-blueprint__btn" data-a="reset"  title="Düzeni sıfırla">↺</button>
            <button class="c-blueprint__btn" data-a="export" title="Konumları dışa aktar">⬇</button>
            <button class="c-blueprint__btn" data-a="zi"     title="Yakınlaş">+</button>
            <button class="c-blueprint__btn" data-a="zo"     title="Uzaklaş">−</button>
            <button class="c-blueprint__btn" data-a="fs"     title="Tam ekran">⛶</button>`;
        wrap.appendChild(ctrl);
        ctrl.addEventListener('click', e => this._onCtrl(e, data));

        /* Export paneli */
        this._makeExportPanel();

        /* İpucu */
        const hint = document.createElement('div');
        hint.className = 'c-blueprint__hint';
        hint.textContent = 'Sürükle · Boş alandan kaydır · Tekerlek ile zum';
        wrap.appendChild(hint);

        /* Etkileşimler */
        wrap.addEventListener('wheel', e => {
            e.preventDefault();
            this._scale = clamp(this._scale + (e.deltaY < 0 ? 0.08 : -0.08), 0.25, 2.5);
            this._applyTransform();
        }, { passive: false });

        this._setupPan(wrap);

        /* İlk çizim */
        requestAnimationFrame(() => this._draw());
        window.addEventListener('resize', () => this._draw());
        document.addEventListener('fullscreenchange', () => {
            const btn = ctrl.querySelector('[data-a="fs"]');
            if (btn) btn.textContent = document.fullscreenElement ? '✕' : '⛶';
            requestAnimationFrame(() => this._draw());
        });
    }

    /* ── Düğüm DOM'u ── */
    _makeNode(nd) {
        const el = document.createElement('div');
        el.className = 'bp-node';
        el.style.cssText = `left:${nd.x}px;top:${nd.y}px;z-index:10;`;
        if (nd.color) el.style.setProperty('--bp-node-color', nd.color);

        const header = document.createElement('div');
        header.className = 'bp-node__header';
        header.innerHTML = `<span class="bp-node__hd"></span>${nd.title}`;
        el.appendChild(header);

        const body = document.createElement('div');
        body.className = 'bp-node__body';

        (nd.ports || []).forEach(p => {
            const row = document.createElement('div');
            row.className = `bp-port bp-port--${p.dir}`;

            const lbl = document.createElement('span');
            lbl.className = 'bp-port__label';
            lbl.textContent = p.label;

            if (p.type) {
                const badge = document.createElement('span');
                badge.className = 'bp-port__badge';
                badge.textContent = p.type;
                /* out satırlarında önce badge, sonra label (sağdan okunur) */
                if (p.dir === 'out') { row.appendChild(badge); row.appendChild(lbl); }
                else                 { row.appendChild(lbl);   row.appendChild(badge); }
            } else {
                row.appendChild(lbl);
            }

            if (p.dir !== 'none') {
                const dot = document.createElement('span');
                dot.className = 'bp-port__dot';
                dot.style.background = p.color || (p.dir === 'out' ? (nd.color || 'var(--c-primary)') : 'var(--c-secondary)');
                row.appendChild(dot);
                this._dots[`${nd.id}.${p.id}`] = dot;
            }

            body.appendChild(row);
        });

        el.appendChild(body);
        return el;
    }

    /* ── Port merkezini scene-local koordinata çevirir ── */
    _portPos(dot) {
        const cr = this._wrap.getBoundingClientRect();
        const dr = dot.getBoundingClientRect();
        return {
            x: (dr.left + dr.width  / 2 - cr.left - this._panX) / this._scale,
            y: (dr.top  + dr.height / 2 - cr.top  - this._panY) / this._scale,
        };
    }

    /* ── Bağlantıları SVG bezier ile çiz ── */
    _draw() {
        while (this._svg.firstChild) this._svg.removeChild(this._svg.firstChild);

        this._conns.forEach(c => {
            const fd = this._dots[c.from];
            const td = this._dots[c.to];
            if (!fd || !td) return;

            const f  = this._portPos(fd);
            const t  = this._portPos(td);
            /* Yatay kontrol kolları — ComfyUI eğrisi */
            const cx = Math.max(Math.abs(t.x - f.x) * 0.5, 50);
            const d  = `M${f.x},${f.y} C${f.x+cx},${f.y} ${t.x-cx},${t.y} ${t.x},${t.y}`;

            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('stroke', c.color || 'var(--c-primary)');
            path.setAttribute('stroke-width', '2');
            path.setAttribute('fill', 'none');
            path.setAttribute('opacity', '0.75');
            this._svg.appendChild(path);
        });
    }

    /* ── Scene dönüşümünü uygula ── */
    _applyTransform() {
        this._scene.style.transform =
            `translate(${this._panX}px,${this._panY}px) scale(${this._scale})`;
        this._draw();
    }

    /* ── Düğüm sürükleme ── */
    _makeDraggable(el) {
        let drag = false, sx, sy, ox, oy;

        el.addEventListener('mousedown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            e.stopPropagation();
            drag = true;
            el.classList.add('is-dragging');
            sx = e.clientX; sy = e.clientY;
            ox = parseFloat(el.style.left);
            oy = parseFloat(el.style.top);
        });

        document.addEventListener('mousemove', e => {
            if (!drag) return;
            el.style.left = (ox + (e.clientX - sx) / this._scale) + 'px';
            el.style.top  = (oy + (e.clientY - sy) / this._scale) + 'px';
            this._draw();
        });

        document.addEventListener('mouseup', () => {
            if (drag) { drag = false; el.classList.remove('is-dragging'); }
        });
    }

    /* ── Canvas kaydırma (pan) ── */
    _setupPan(wrap) {
        let pan = false, sx, sy;

        wrap.addEventListener('mousedown', e => {
            if (e.target.closest('.bp-node, .c-blueprint__controls')) return;
            if (e.button !== 0) return;
            pan = true;
            wrap.classList.add('is-panning');
            sx = e.clientX; sy = e.clientY;
        });

        document.addEventListener('mousemove', e => {
            if (!pan) return;
            this._panX += e.clientX - sx;
            this._panY += e.clientY - sy;
            sx = e.clientX; sy = e.clientY;
            this._applyTransform();
        });

        document.addEventListener('mouseup', () => {
            if (pan) { pan = false; wrap.classList.remove('is-panning'); }
        });
    }

    /* ── Otomatik katmanlı yerleşim (x/y verilmediğinde) ── */
    _autoLayout(nodes, connections) {
        const NODE_W = 205, NODE_H = 120, H_GAP = 60, V_GAP = 28;

        /* Bağlantı grafiği: from → [to] (self-loop'ları yoksay) */
        const out = {}, inCount = {};
        nodes.forEach(n => { out[n.id] = new Set(); inCount[n.id] = 0; });
        connections.forEach(c => {
            const from = c.from.split('.')[0];
            const to   = c.to.split('.')[0];
            if (from !== to && out[from] && !out[from].has(to)) {
                out[from].add(to);
                inCount[to]++;
            }
        });

        /* Kahn algoritması — her düğümün katmanını (sütununu) bul */
        const layer = {};
        const queue = nodes.filter(n => inCount[n.id] === 0).map(n => n.id);
        queue.forEach(id => { layer[id] = 0; });

        let head = 0;
        while (head < queue.length) {
            const id = queue[head++];
            out[id].forEach(tid => {
                layer[tid] = Math.max(layer[tid] ?? 0, layer[id] + 1);
                if (--inCount[tid] === 0) queue.push(tid);
            });
        }
        /* Döngüdeki düğümler atanmamış kalır → 0. katmana */
        nodes.forEach(n => { if (layer[n.id] == null) layer[n.id] = 0; });

        /* Katmana göre grupla, aynı katmandakileri ID sırasına diz */
        const cols = {};
        nodes.forEach(n => { (cols[layer[n.id]] = cols[layer[n.id]] || []).push(n.id); });

        const pos = {};
        Object.keys(cols).map(Number).sort((a, b) => a - b).forEach(l => {
            cols[l].forEach((id, i) => {
                pos[id] = {
                    x: l * (NODE_W + H_GAP) + 24,
                    y: i * (NODE_H  + V_GAP) + 24,
                };
            });
        });

        return pos;
    }

    /* ── Export paneli ── */
    _makeExportPanel() {
        const panel = document.createElement('div');
        panel.className = 'c-blueprint__export-panel';
        panel.innerHTML = `
            <div class="c-blueprint__export-hd">
                <span>Node Konumları — JSON</span>
                <button class="c-blueprint__btn" data-a="ecopy"  title="Kopyala">⎘</button>
                <button class="c-blueprint__btn" data-a="eclose" title="Kapat">✕</button>
            </div>
            <pre class="c-blueprint__export-pre"></pre>`;
        this._wrap.appendChild(panel);
        this._exportPanel = panel;
        this._exportPre   = panel.querySelector('.c-blueprint__export-pre');

        panel.addEventListener('click', e => {
            const a = e.target.closest('[data-a]')?.dataset.a;
            if (a === 'ecopy')  this._copyExport();
            if (a === 'eclose') this._closeExport();
        });
    }

    _openExport() {
        const nodes = (this._data.nodes || []).map(nd => {
            const el = this._nodes[nd.id];
            const x = el ? Math.round(parseFloat(el.style.left)) : nd.x;
            const y = el ? Math.round(parseFloat(el.style.top))  : nd.y;
            return Object.assign({}, nd, { x, y });
        });
        const out = Object.assign({}, this._data, { nodes });
        this._exportPre.textContent = JSON.stringify(out, null, 2);
        this._exportPanel.classList.add('is-open');
    }

    _closeExport() {
        this._exportPanel.classList.remove('is-open');
    }

    _copyExport() {
        const text = this._exportPre.textContent;
        if (!navigator.clipboard) {
            /* Fallback: geçici textarea */
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.cssText = 'position:fixed;opacity:0';
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            this._flashCopyBtn();
            return;
        }
        navigator.clipboard.writeText(text).then(() => this._flashCopyBtn());
    }

    _flashCopyBtn() {
        const btn = this._exportPanel.querySelector('[data-a="ecopy"]');
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = '✓';
        btn.style.color = 'var(--c-success)';
        setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1400);
    }

    /* ── Kontrol butonları ── */
    _onCtrl(e, data) {
        const a = e.target.closest('[data-a]')?.dataset.a;
        if (!a) return;
        if (a === 'zi')     { this._scale = clamp(this._scale + 0.15, 0.25, 2.5); this._applyTransform(); }
        if (a === 'zo')     { this._scale = clamp(this._scale - 0.15, 0.25, 2.5); this._applyTransform(); }
        if (a === 'export') {
            if (this._exportPanel.classList.contains('is-open')) this._closeExport();
            else this._openExport();
        }
        if (a === 'fs') {
            if (!document.fullscreenElement) {
                this._wrap.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
        if (a === 'reset') {
            this._scale = 1; this._panX = 0; this._panY = 0;
            Object.entries(this._initialPos).forEach(([id, pos]) => {
                const el = this._nodes[id];
                if (el) { el.style.left = pos.x + 'px'; el.style.top = pos.y + 'px'; }
            });
            this._applyTransform();
            this._closeExport();
        }
    }
}

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

customElements.define('c-blueprint', CBlueprint);
