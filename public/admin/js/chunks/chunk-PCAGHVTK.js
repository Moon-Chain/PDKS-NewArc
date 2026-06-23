import {
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/adminUi.ts
function cellUser(name, sub) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return `
    <div class="cell-user">
      <div class="cell-avatar">${initials}</div>
      <div class="cell-main"><strong>${name}</strong>${sub ? `<span>${sub}</span>` : ""}</div>
    </div>`;
}
function paginationControls(page, totalPages, total, perPage) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);
  let pageBtns = "";
  for (let i = 1; i <= totalPages; i++) {
    pageBtns += `<button type="button" class="page-btn ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
  }
  return `
    <div class="pagination">
      <div class="pagination-pages">
        <button type="button" class="page-btn" data-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>${icon("chevron-left", "icon icon-sm")}</button>
        ${pageBtns}
        <button type="button" class="page-btn" data-page="${page + 1}" ${page >= totalPages ? "disabled" : ""}>${icon("chevron-right", "icon icon-sm")}</button>
      </div>
      <div class="pagination-info">${from}\u2013${to} / ${total} kay\u0131t</div>
    </div>
  `;
}
function bindPagination(container, currentPage, totalPages, onPage) {
  const el = container.querySelector(".pagination");
  if (!el) return;
  el.addEventListener("click", (e) => {
    const btn = e.target.closest(".page-btn[data-page]");
    if (!btn || btn.disabled) return;
    const p = Number(btn.dataset.page);
    if (!p || p < 1 || p > totalPages || p === currentPage) return;
    onPage(p);
  });
}
function ensureToastContainer() {
  let el = document.getElementById("admin-toast-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "admin-toast-container";
    el.className = "admin-toast-container";
    document.body.appendChild(el);
  }
  return el;
}
function toast(message, type = "success", duration = 3e3) {
  const container = ensureToastContainer();
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  const remove = () => el.remove();
  setTimeout(remove, duration);
  el.addEventListener("click", remove);
}
function openModal(title, bodyHtml) {
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay open";
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${title}</h3>
        <button class="btn btn-ghost btn-sm modal-close" type="button">${icon("x", "icon icon-sm")}</button>
      </div>
      <div class="modal-content">${bodyHtml}</div>
    </div>
  `;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector(".modal-close")?.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  return { el: overlay, close };
}
function confirmModal(opts) {
  return new Promise((resolve) => {
    const confirmClass = opts.danger ? "btn btn-danger" : "btn btn-primary";
    const { el, close } = openModal(opts.title, `
      <p style="color:var(--text-secondary); margin-bottom: var(--space-2)">${opts.message}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost modal-cancel" type="button">${opts.cancelText ?? "\u0130ptal"}</button>
        <button class="${confirmClass} modal-confirm" type="button">${opts.confirmText ?? "Onayla"}</button>
      </div>
    `);
    el.querySelector(".modal-cancel")?.addEventListener("click", () => {
      close();
      resolve(false);
    });
    el.querySelector(".modal-confirm")?.addEventListener("click", () => {
      close();
      resolve(true);
    });
  });
}

export {
  cellUser,
  paginationControls,
  bindPagination,
  toast,
  openModal,
  confirmModal
};
//# sourceMappingURL=chunk-PCAGHVTK.js.map
