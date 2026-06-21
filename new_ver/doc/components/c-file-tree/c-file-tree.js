/* ==========================================================================
   <c-file-tree> / <c-tree-folder> / <c-tree-file>
   Açılır/kapanır klasör ağacı. İç içe geçmiş klasörler desteklenir.
   "open" attribute'u olan klasörler başlangıçta açık gösterilir.

   Kullanım:
     <c-file-tree>
       <c-tree-folder name="src" open>
         <c-tree-folder name="components">
           <c-tree-file name="Button.tsx"></c-tree-file>
           <c-tree-file name="Input.tsx"></c-tree-file>
         </c-tree-folder>
         <c-tree-file name="index.ts"></c-tree-file>
       </c-tree-folder>
       <c-tree-file name="package.json"></c-tree-file>
       <c-tree-file name="tsconfig.json"></c-tree-file>
     </c-file-tree>
   ========================================================================== */

/* Dosya uzantısına göre icon seçimi */
function _fileIcon(name) {
    const ext = name.split('.').pop().toLowerCase();
    const map = {
        js: '🟨', ts: '🔷', tsx: '🔷', jsx: '🟨',
        css: '🎨', scss: '🎨', less: '🎨',
        html: '🌐', json: '📋', md: '📝',
        svg: '🖼', png: '🖼', jpg: '🖼', gif: '🖼', webp: '🖼',
        sh: '⚙️', env: '⚙️', yml: '⚙️', yaml: '⚙️',
    };
    return map[ext] || '📄';
}

class CFileTree extends HTMLElement {
    connectedCallback() {
        /* Ağaç yapısını önce düz JS nesnesine oku, sonra DOM'u temizle */
        const readTree = container =>
            Array.from(container.children)
                .filter(c => ['c-tree-folder', 'c-tree-file'].includes(c.tagName.toLowerCase()))
                .map(child => {
                    if (child.tagName.toLowerCase() === 'c-tree-folder') {
                        return {
                            type: 'folder',
                            name: child.getAttribute('name') || 'folder',
                            open: child.hasAttribute('open'),
                            children: readTree(child),
                        };
                    }
                    return {
                        type: 'file',
                        name: child.getAttribute('name') || 'file',
                    };
                });

        const treeData = readTree(this);
        this.innerHTML = '';
        this.classList.add('c-file-tree');

        const buildList = items => {
            const ul = document.createElement('ul');
            ul.className = 'c-file-tree__list';

            items.forEach(item => {
                const li = document.createElement('li');
                li.className = 'c-file-tree__item';

                if (item.type === 'folder') {
                    const row = document.createElement('div');
                    row.className = 'c-file-tree__row c-file-tree__row--folder';

                    const toggle = document.createElement('span');
                    toggle.className = 'c-file-tree__toggle' + (item.open ? ' c-file-tree__toggle--open' : '');
                    toggle.textContent = '▶';

                    const icon = document.createElement('span');
                    icon.className = 'c-file-tree__icon';
                    icon.textContent = item.open ? '📂' : '📁';

                    const nameEl = document.createElement('span');
                    nameEl.className = 'c-file-tree__name c-file-tree__name--folder';
                    nameEl.textContent = item.name;

                    row.appendChild(toggle);
                    row.appendChild(icon);
                    row.appendChild(nameEl);

                    const nested = buildList(item.children);
                    nested.classList.add('c-file-tree__list--nested');
                    if (!item.open) nested.classList.add('c-file-tree__list--collapsed');

                    row.addEventListener('click', () => {
                        const isOpen = toggle.classList.toggle('c-file-tree__toggle--open');
                        icon.textContent = isOpen ? '📂' : '📁';
                        nested.classList.toggle('c-file-tree__list--collapsed', !isOpen);
                    });

                    li.appendChild(row);
                    li.appendChild(nested);
                } else {
                    const row = document.createElement('div');
                    row.className = 'c-file-tree__row';

                    const spacer = document.createElement('span');
                    spacer.className = 'c-file-tree__toggle'; /* hizalama için */

                    const icon = document.createElement('span');
                    icon.className = 'c-file-tree__icon';
                    icon.textContent = _fileIcon(item.name);

                    const nameEl = document.createElement('span');
                    nameEl.className = 'c-file-tree__name c-file-tree__name--file';
                    nameEl.textContent = item.name;

                    row.appendChild(spacer);
                    row.appendChild(icon);
                    row.appendChild(nameEl);
                    li.appendChild(row);
                }

                ul.appendChild(li);
            });

            return ul;
        };

        this.appendChild(buildList(treeData));
    }
}

customElements.define('c-file-tree', CFileTree);

class CTreeFolder extends HTMLElement {}
customElements.define('c-tree-folder', CTreeFolder);

class CTreeFile extends HTMLElement {}
customElements.define('c-tree-file', CTreeFile);
