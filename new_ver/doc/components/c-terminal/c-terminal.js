/* ==========================================================================
   <c-terminal> / <c-terminal-line>
   Retro Win98-style sahte terminal penceresi. c-code-block'tan farkı:
   satır türüne göre renk + prompt ile etkileşimli oturumu simüle eder.

   Attribute'lar (c-terminal):
     title  - başlık çubuğu metni (varsayılan: "C:\WINDOWS\system32\cmd.exe")
     prompt - input satırlarındaki prompt (varsayılan: "C:\>")

   Attribute'lar (c-terminal-line):
     type   - input | output | error | comment  (varsayılan: default)

   Kullanım:
     <c-terminal title="Kurulum" prompt="$">
       <c-terminal-line type="comment"># Repoyu klonla</c-terminal-line>
       <c-terminal-line type="input">git clone https://github.com/example/repo.git</c-terminal-line>
       <c-terminal-line type="output">Cloning into 'repo'...</c-terminal-line>
       <c-terminal-line type="error">Error: EACCES: permission denied</c-terminal-line>
     </c-terminal>
   ========================================================================== */

class CTerminal extends HTMLElement {
    connectedCallback() {
        const title  = this.getAttribute('title')  || 'C:\\WINDOWS\\system32\\cmd.exe';
        const prompt = this.getAttribute('prompt') || 'C:\\>';
        const lines  = Array.from(this.querySelectorAll('c-terminal-line'));

        this.classList.add('c-terminal');

        /* Satırları oluştur */
        const lineEls = lines.map(line => {
            const type = line.getAttribute('type') || 'default';
            const text = line.textContent;

            const lineEl = document.createElement('div');
            lineEl.className = `c-terminal__line c-terminal__line--${type}`;

            if (type === 'input') {
                const promptEl = document.createElement('span');
                promptEl.className = 'c-terminal__prompt';
                promptEl.textContent = prompt + ' ';
                lineEl.appendChild(promptEl);
            }

            const textEl = document.createElement('span');
            textEl.className = 'c-terminal__text';
            textEl.textContent = text;
            lineEl.appendChild(textEl);

            return lineEl;
        });

        this.innerHTML = '';

        /* ── Başlık çubuğu ── */
        const header = document.createElement('div');
        header.className = 'c-terminal__header';

        const icon = document.createElement('span');
        icon.className = 'c-terminal__icon';
        icon.textContent = '🖥';

        const titleEl = document.createElement('div');
        titleEl.className = 'c-terminal__title';
        titleEl.textContent = title;

        const controls = document.createElement('div');
        controls.className = 'c-terminal__controls';

        ['_', '□', '×'].forEach(sym => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'c-terminal__btn';
            btn.textContent = sym;
            btn.tabIndex = -1;
            controls.appendChild(btn);
        });

        header.appendChild(icon);
        header.appendChild(titleEl);
        header.appendChild(controls);

        /* ── Terminal gövdesi (iç boşluk + sunken ekran) ── */
        const inner = document.createElement('div');
        inner.className = 'c-terminal__inner';

        const body = document.createElement('div');
        body.className = 'c-terminal__body';
        lineEls.forEach(el => body.appendChild(el));

        inner.appendChild(body);

        this.appendChild(header);
        this.appendChild(inner);
    }
}

customElements.define('c-terminal', CTerminal);

class CTerminalLine extends HTMLElement {}
customElements.define('c-terminal-line', CTerminalLine);
