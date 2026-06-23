import {
  toast
} from "./chunk-PCAGHVTK.js";
import {
  BasePage,
  api,
  icon
} from "./chunk-5NLMPZFQ.js";

// public/admin/ts/pages/NotificationsPage.ts
var TYPE_ICON = { success: "\u2713", error: "\u2717", warning: "\u26A0", info: "\u2139" };
var TYPE_CLASS = {
  success: "ap-notif-item--success",
  error: "ap-notif-item--error",
  warning: "ap-notif-item--warning",
  info: "ap-notif-item--info"
};
function timeAgo(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 6e4);
  if (m < 1) return "Az \xF6nce";
  if (m < 60) return `${m}dk \xF6nce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa \xF6nce`;
  return `${Math.floor(h / 24)}g \xF6nce`;
}
function dayKey(dt) {
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}
function dayLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const todayKey = dayKey(/* @__PURE__ */ new Date());
  const yest = /* @__PURE__ */ new Date();
  yest.setDate(yest.getDate() - 1);
  if (key === todayKey) return `Bug\xFCn \xB7 ${dt.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`;
  if (key === dayKey(yest)) return `D\xFCn \xB7 ${dt.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`;
  const diff = Math.floor((Date.now() - dt.getTime()) / 864e5);
  if (diff < 7) return `${dt.toLocaleDateString("tr-TR", { weekday: "long" })} \xB7 ${dt.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}`;
  return dt.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
}
function groupByDay(rows) {
  const map = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const key = dayKey(new Date(r.created_at));
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a)).map(([key, rows2]) => ({ dayKey: key, label: dayLabel(key), rows: rows2 }));
}
var NotificationsPage = class extends BasePage {
  constructor() {
    super(...arguments);
    this.rows = [];
  }
  async render() {
    this.container.innerHTML = `<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>`;
    await this.load();
  }
  async load() {
    try {
      const res = await api.get("/api/v1/notifications?limit=100");
      this.rows = res.rows;
    } catch (err) {
      toast(err instanceof Error ? err.message : "Bildirimler y\xFCklenemedi", "error");
      this.rows = [];
    }
    this.draw();
  }
  draw() {
    const unread = this.rows.filter((n) => !n.is_read).length;
    const groups = groupByDay(this.rows);
    this.container.innerHTML = `
      <div class="ap-np-page">
        ${unread > 0 ? `
          <div class="ap-np-toolbar">
            <button class="ap-np-read-all-btn" id="np-read-all" type="button">${icon("check", "icon icon-sm")} T\xFCm\xFCn\xFC Okundu \u0130\u015Faretle</button>
          </div>` : ""}
        ${groups.length === 0 ? `<div class="card ap-notif-empty">
               <div class="ap-notif-empty-icon">${icon("bell", "icon icon-lg")}</div>
               <p>Bildirim yok</p>
             </div>` : groups.map((g) => `
              <div class="ap-np-group">
                <div class="ap-np-day-label">${g.label}</div>
                <div class="card ap-np-group-card">
                  ${g.rows.map((n) => `
                    <div class="ap-notif-item ap-np-full-item ${TYPE_CLASS[n.type] ?? ""} ${n.is_read ? "" : "ap-notif-item--unread"}"
                         data-id="${n.id}" data-link="${n.link ?? ""}">
                      <div class="ap-notif-item-dot">${TYPE_ICON[n.type] ?? "\u2139"}</div>
                      <div class="ap-notif-item-body">
                        <div class="ap-np-item-row">
                          <p class="ap-notif-item-title">${n.title}</p>
                          <span class="ap-notif-item-time">${timeAgo(n.created_at)}</span>
                        </div>
                        <p class="ap-notif-item-msg">${n.message}</p>
                      </div>
                      <button class="ap-notif-del-btn" data-del="${n.id}" type="button" title="Sil">${icon("x", "icon icon-sm")}</button>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
      </div>
    `;
    this.on("#np-read-all", "click", async () => {
      await api.post("/api/v1/notifications/read-all", {}).catch(() => {
      });
      this.rows.forEach((r) => r.is_read = true);
      this.draw();
    });
    this.container.querySelectorAll(".ap-notif-item").forEach((item) => {
      item.addEventListener("click", async (e) => {
        if (e.target.closest(".ap-notif-del-btn")) return;
        const id = item.dataset.id;
        const link = item.dataset.link;
        if (item.classList.contains("ap-notif-item--unread")) {
          await api.patch(`/api/v1/notifications/${id}/read`, {}).catch(() => {
          });
          const row = this.rows.find((r) => r.id === id);
          if (row) row.is_read = true;
          item.classList.remove("ap-notif-item--unread");
        }
        if (link) {
          window.router?.navigate(link);
        }
      });
    });
    this.container.querySelectorAll(".ap-notif-del-btn").forEach((btn) => {
      btn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const id = btn.dataset.del;
        await api.delete(`/api/v1/notifications/${id}`).catch(() => {
        });
        this.rows = this.rows.filter((r) => r.id !== id);
        this.draw();
      });
    });
  }
};
export {
  NotificationsPage
};
//# sourceMappingURL=NotificationsPage-TFE6JPIN.js.map
