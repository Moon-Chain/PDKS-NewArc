import{c as T}from"./chunks/chunk-GK74B4NT.js";import{a as r}from"./chunks/chunk-FKJNCFTW.js";import{a as c,b as $,c as o}from"./chunks/chunk-IUADW4UU.js";var f=class{constructor(e,t){this.current=null;this.routes=e,this.container=t,window.addEventListener("popstate",()=>this._render(location.pathname))}async navigate(e){history.pushState(null,"",e),await this._render(e)}async _render(e){if(e.length>1&&e.endsWith("/")&&(e=e.slice(0,-1)),!r.get("user")&&e!=="/login")return this.navigate("/login");if(r.get("user")&&e==="/login")return this.navigate("/home");let t=this.routes[e]??this.routes["/home"];if(!t){this.container.innerHTML=`
        <div style="padding:40px;text-align:center;color:var(--color-muted)">
          <p>Sayfa bulunamad\u0131</p>
        </div>`;return}this.current?.destroy(),this.container.innerHTML="",this.container.classList.add("page-enter"),setTimeout(()=>this.container.classList.remove("page-enter"),200);let i;try{i=await t()}catch{this.container.innerHTML=`
        <div style="padding:40px;text-align:center">
          <p style="color:var(--color-muted);margin-bottom:16px">Sayfa y\xFCklenemedi.</p>
          <button class="btn btn-primary" onclick="location.reload()">Yenile</button>
        </div>`;return}this.current=new i(this.container),await this.current.render()}};var h=class{constructor(e={}){this.el=null;this.props=e}afterMount(){}mount(e){let t=document.createElement("div");t.innerHTML=this.template();let i=t.firstElementChild;return i&&(e.appendChild(i),this.el=i,this.afterMount()),this}unmount(){this.el?.remove(),this.el=null}$(e){return this.el?.querySelector(e)??null}};function b(n,e){return class extends ${async render(){this.container.innerHTML=`
        <div class="card locked-module">
          <div class="lock-icon">${o("lock","icon icon-lg")}</div>
          <h3>${n}</h3>
          <p>${e}</p>
        </div>
      `}}}var v=[{id:"dashboard",label:"Genel Bak\u0131\u015F",icon:"layout-dashboard",path:"/admin",permission:"dashboard:view",group:"operasyon",title:"Genel Bak\u0131\u015F",subtitle:"\u015Eirketinizin g\xFCnl\xFCk \xF6zeti",loader:async()=>(await import("./chunks/DashboardPage-OPIALCID.js")).DashboardPage},{id:"movements",label:"Hareketler",icon:"clock",path:"/admin/movements",permission:"attendance:view",group:"operasyon",title:"Hareketler",subtitle:"T\xFCm personelin giri\u015F/\xE7\u0131k\u0131\u015F kay\u0131tlar\u0131",loader:async()=>(await import("./chunks/MovementsPage-EU3RJFV5.js")).MovementsPage},{id:"approvals",label:"Onaylar",icon:"check-check",path:"/admin/approvals",permission:"leave:approve",group:"operasyon",title:"Onaylar",subtitle:"Bekleyen izin ve mesai talepleri",loader:async()=>(await import("./chunks/ApprovalsPage-2VEPWBKQ.js")).ApprovalsPage},{id:"users",label:"Personel",icon:"users",path:"/admin/users",permission:"user:manage",group:"insan-kaynaklari",title:"Personel",subtitle:"Personel listesi ve y\xF6netimi",loader:async()=>(await import("./chunks/UsersPage-KSLHMNFV.js")).UsersPage},{id:"leaves",label:"\u0130zinler",icon:"calendar-days",path:"/admin/leaves",permission:"leave:view",group:"insan-kaynaklari",title:"\u0130zinler",subtitle:"\u0130zin talepleri ve bakiyeler",loader:async()=>(await import("./chunks/LeavesPage-FPJL7ASX.js")).LeavesPage},{id:"overtime",label:"Mesai",icon:"zap",path:"/admin/overtime",permission:"overtime:view",group:"insan-kaynaklari",title:"Mesai",subtitle:"Mesai talepleri ve kay\u0131tlar\u0131",loader:async()=>(await import("./chunks/OvertimePage-EF6GVJDA.js")).OvertimePage},{id:"reports",label:"Raporlar",icon:"file-spreadsheet",path:"/admin/reports",permission:"reports:view",group:"insan-kaynaklari",title:"Raporlar",subtitle:"Excel raporu indir",loader:async()=>(await import("./chunks/ReportsPage-EL5VHYXG.js")).ReportsPage},{id:"holidays",label:"Tatil G\xFCnleri",icon:"sun",path:"/admin/holidays",permission:"settings:view",group:"ayarlar",title:"Tatil G\xFCnleri",subtitle:"Resmi ve \u015Firket tatilleri",loader:async()=>(await import("./chunks/HolidaysPage-JZTRIPC6.js")).HolidaysPage},{id:"settings",label:"\u015Eirket Ayarlar\u0131",icon:"settings",path:"/admin/settings",permission:"settings:manage",group:"ayarlar",title:"\u015Eirket Ayarlar\u0131",subtitle:"Ofis IP, vardiya, mola kurallar\u0131",loader:async()=>(await import("./chunks/SettingsPage-REVGLLH3.js")).SettingsPage},{id:"audit",label:"Aktivite Ge\xE7mi\u015Fi",icon:"history",path:"/admin/audit",permission:"audit:view",group:"sistem",title:"Aktivite Ge\xE7mi\u015Fi",subtitle:"Kim ne zaman ne yapt\u0131",loader:async()=>(await import("./chunks/AuditLogPage-KMAI2NEG.js")).AuditLogPage},{id:"branches",label:"\u015Eubeler",icon:"map-pin",path:"/admin/branches",permission:"branch:manage",group:"sistem",title:"\u015Eubeler",subtitle:"\u015Eube y\xF6netimi",locked:{note:"Kademe 1"},loader:()=>Promise.resolve(b("\u015Eube Sistemi","Bu mod\xFCl Kademe 1 kapsam\u0131nda eklenecek. Birden fazla \u015Fubesi olan \u015Firketler i\xE7in \u015Fube bazl\u0131 personel ve hareket filtrelemesi sa\u011Flayacak."))},{id:"roles",label:"Rol & Yetki",icon:"shield",path:"/admin/roles",permission:"role:manage",group:"sistem",title:"Rol & Yetki",subtitle:"\xD6zel roller ve izin atamalar\u0131",locked:{note:"Kademe 2"},loader:()=>Promise.resolve(b("Rol & Yetki Y\xF6netimi","Bu mod\xFCl Kademe 2 kapsam\u0131nda eklenecek. RBAC veritaban\u0131 (roller, izinler) zaten haz\u0131r \u2014 bu sayfa admin'in \xF6zel roller olu\u015Fturup yetki atamas\u0131 yapmas\u0131n\u0131 sa\u011Flayacak."))},{id:"billing",label:"Plan & Faturalama",icon:"credit-card",path:"/admin/billing",permission:"billing:manage",group:"sistem",title:"Plan & Faturalama",subtitle:"Abonelik ve fatura y\xF6netimi",locked:{note:"Kademe 3"},loader:()=>Promise.resolve(b("Plan & Faturalama","Bu mod\xFCl Kademe 3 (SaaS) kapsam\u0131nda eklenecek. Abonelik plan\u0131, kota ve fatura y\xF6netimi burada olacak."))}],x={operasyon:"Operasyon","insan-kaynaklari":"\u0130nsan Kaynaklar\u0131",ayarlar:"Ayarlar",sistem:"Sistem"},P=[{id:"notifications",label:"Bildirimler",icon:"bell",path:"/admin/notifications",permission:"dashboard:view",group:"operasyon",title:"Bildirimler",subtitle:"T\xFCm bildirimleriniz",loader:async()=>(await import("./chunks/NotificationsPage-D5MGCSHE.js")).NotificationsPage}];function M(n){return v.find(e=>e.path===n)??P.find(e=>e.path===n)}var H=["operasyon","insan-kaynaklari","ayarlar","sistem"],y=class extends h{constructor(e){super({}),this.activePath=e}template(){let e=r.get("profile"),t=e?.name??"",i=t.split(" ").map(a=>a[0]).join("").slice(0,2).toUpperCase()||"A",l=e?.role==="admin"?"Tam Yetkili Admin":e?.role??"";return`
      <aside class="sidebar" id="admin-sidebar">
        <div class="sidebar-logo">
          <div class="logo-mark">P</div>
          <div class="logo-text">
            <strong>PDKS Admin</strong>
            <span>Y\xF6netim Paneli</span>
          </div>
        </div>

        <nav class="sidebar-nav">${H.map(a=>{let p=v.filter(s=>s.group===a);return p.length?`
        <div class="nav-group">
          <div class="nav-group-label">${x[a]}</div>
          ${p.map(s=>`
            <div class="nav-item ${s.path===this.activePath?"active":""} ${s.locked?"locked":""}"
                 data-path="${s.locked?"":s.path}"
                 data-label="${s.label}"
                 title="${s.locked?"Hen\xFCz aktif de\u011Fil \u2014 "+s.locked.note:""}">
              <span class="nav-icon">${o(s.icon)}</span>
              <span>${s.label}</span>
              ${s.locked?`<span class="nav-badge">${s.locked.note}</span>`:""}
            </div>
          `).join("")}
        </div>
      `:""}).join("")}</nav>

        <div class="sidebar-footer">
          <div class="user-card">
            <div class="avatar">${i}</div>
            <div class="user-info">
              <strong>${t}</strong>
              <span>${l}</span>
            </div>
            <span class="user-caret">${o("chevrons-up-down","icon icon-sm")}</span>
          </div>
        </div>
      </aside>
    `}afterMount(){this.$$(".nav-item[data-path]").forEach(e=>{let t=e.getAttribute("data-path");t&&e.addEventListener("click",()=>{window.router?.navigate(t)})})}$$(e){return this.el?.querySelectorAll(e)??document.querySelectorAll(".never-match")}setActive(e){this.activePath=e,this.$$(".nav-item").forEach(i=>i.classList.remove("active")),this.$$(".nav-item[data-path]").forEach(i=>{i.getAttribute("data-path")===e&&i.classList.add("active")})}};var L=class{constructor(){this._listeners={}}on(e,t){return this._listeners[e]||(this._listeners[e]=[]),this._listeners[e].push(t),()=>this.off(e,t)}off(e,t){this._listeners[e]=this._listeners[e]?.filter(i=>i!==t)}emit(e,t){this._listeners[e]?.forEach(i=>i(t))}},m=new L;var B={success:"\u2713",error:"\u2717",warning:"\u26A0",info:"\u2139"},D={success:"ap-notif-item--success",error:"ap-notif-item--error",warning:"ap-notif-item--warning",info:"ap-notif-item--info"};function N(n){let e=Math.floor((Date.now()-new Date(n).getTime())/6e4);if(e<1)return"Az \xF6nce";if(e<60)return`${e}dk \xF6nce`;let t=Math.floor(e/60);return t<24?`${t}sa \xF6nce`:`${Math.floor(t/24)}g \xF6nce`}var E=class{constructor(){this.bellEl=null;this.dotEl=null;this.panelEl=null;this.rows=[];this.unread=0;this.open=!1;this.onOutsideClick=e=>{this.panelEl&&(!this.panelEl.contains(e.target)&&!this.bellEl?.contains(e.target)?this.closePanel():document.addEventListener("click",this.onOutsideClick,{once:!0,capture:!0}))}}mount(e,t){this.bellEl=e,this.dotEl=t,e.addEventListener("click",i=>{i.stopPropagation(),this.open?this.closePanel():this.openPanel()}),this.load(),m.on("sse:notification",i=>{this.rows.unshift(i),this.unread++,this.updateDot(),this.open&&this.renderList()})}async load(){try{let e=await c.get("/api/v1/notifications");this.rows=e.rows,this.unread=e.unread,this.updateDot()}catch{}}openPanel(){this.open=!0,this.panelEl||(this.panelEl=document.createElement("div"),this.panelEl.className="ap-notif-panel",document.body.appendChild(this.panelEl)),this.renderList(),setTimeout(()=>{document.addEventListener("click",this.onOutsideClick,{once:!0,capture:!0})},0)}closePanel(){this.open=!1,this.panelEl?.remove(),this.panelEl=null,document.removeEventListener("click",this.onOutsideClick,!0)}renderList(){if(!this.panelEl)return;let e=this.bellEl?.getBoundingClientRect(),t=(e?.bottom??60)+8;if(window.innerWidth<480)this.panelEl.style.top=`${t}px`,this.panelEl.style.left="8px",this.panelEl.style.right="8px",this.panelEl.style.width="auto";else{let a=window.innerWidth-(e?.right??60);this.panelEl.style.top=`${t}px`,this.panelEl.style.left="",this.panelEl.style.right=`${Math.max(4,a-8)}px`,this.panelEl.style.width="360px"}this.panelEl.innerHTML=`
      <div class="ap-notif-panel-header">
        <span class="ap-notif-panel-title">${o("bell","icon icon-sm")} Bildirimler</span>
        <div class="ap-notif-panel-actions">
          ${this.unread>0?`<button class="ap-notif-read-all-btn" id="ap-notif-read-all" type="button">${o("check","icon icon-sm")} T\xFCm\xFCn\xFC Oku</button>`:""}
          <button class="ap-notif-close-btn" id="ap-notif-close" type="button">${o("x","icon icon-sm")}</button>
        </div>
      </div>
      <div class="ap-notif-list">
        ${this.rows.length===0?`<div class="ap-notif-empty">
               <div class="ap-notif-empty-icon">${o("bell","icon icon-lg")}</div>
               <p>Bildirim yok</p>
             </div>`:this.rows.map(a=>`
              <div class="ap-notif-item ${D[a.type]??""} ${a.is_read?"":"ap-notif-item--unread"}"
                   data-id="${a.id}" data-link="${a.link??""}">
                <div class="ap-notif-item-dot">${B[a.type]??"\u2139"}</div>
                <div class="ap-notif-item-body">
                  <p class="ap-notif-item-title">${a.title}</p>
                  <p class="ap-notif-item-msg">${a.message}</p>
                  <p class="ap-notif-item-time">${N(a.created_at)}</p>
                </div>
                <button class="ap-notif-del-btn" data-del="${a.id}" type="button" title="Sil">${o("x","icon icon-sm")}</button>
              </div>
            `).join("")}
      </div>
      <div class="ap-notif-panel-footer">
        <button class="ap-notif-view-all-btn" id="ap-notif-view-all" type="button">T\xFCm\xFCn\xFC G\xF6r</button>
      </div>
    `;let i=this.panelEl.querySelector("#ap-notif-read-all");i&&(i.onclick=async a=>{a.stopPropagation(),await c.post("/api/v1/notifications/read-all",{}).catch(()=>{}),this.rows.forEach(p=>p.is_read=!0),this.unread=0,this.updateDot(),this.renderList()});let l=this.panelEl.querySelector("#ap-notif-close");l&&(l.onclick=()=>this.closePanel()),this.panelEl.querySelectorAll(".ap-notif-item").forEach(a=>{a.onclick=async p=>{if(p.target.closest(".ap-notif-del-btn"))return;let s=a.dataset.id,u=a.dataset.link;if(a.classList.contains("ap-notif-item--unread")){await c.patch(`/api/v1/notifications/${s}/read`,{}).catch(()=>{});let g=this.rows.find(C=>C.id===s);g&&!g.is_read&&(g.is_read=!0,this.unread=Math.max(0,this.unread-1)),this.updateDot(),a.classList.remove("ap-notif-item--unread")}u&&(this.closePanel(),window.router?.navigate(u))}}),this.panelEl.querySelectorAll(".ap-notif-del-btn").forEach(a=>{a.onclick=async p=>{p.stopPropagation();let s=a.dataset.del;await c.delete(`/api/v1/notifications/${s}`).catch(()=>{});let u=this.rows.findIndex(g=>g.id===s);u!==-1&&(this.rows[u].is_read||(this.unread=Math.max(0,this.unread-1)),this.rows.splice(u,1)),this.updateDot(),this.renderList()}});let d=this.panelEl.querySelector("#ap-notif-view-all");d&&(d.onclick=()=>{this.closePanel(),window.router?.navigate("/admin/notifications")})}updateDot(){this.dotEl&&(this.dotEl.style.display=this.unread>0?"":"none")}destroy(){this.closePanel()}};var k=class extends h{constructor(t){super({});this.opts=t;this.notifPanel=null}template(){let t=this.opts.railCollapsed?"panel-left-open":"panel-left-close";return`
      <header class="topbar">
        <div class="topbar-left">
          <button class="btn btn-ghost icon-btn sidebar-toggle" aria-label="Men\xFCy\xFC a\xE7/kapat" id="admin-menu-toggle">
            ${o("menu")}
          </button>
          <button class="topbar-icon rail-toggle" aria-label="Kenar \xE7ubu\u011Funu daralt/geni\u015Flet" title="Kenar \xE7ubu\u011Funu daralt/geni\u015Flet" id="admin-rail-toggle">
            ${o(t)}
          </button>
          <div>
            <h1 id="admin-page-title">${this.opts.title}</h1>
            <div class="topbar-sub" id="admin-page-sub">${this.opts.subtitle}</div>
          </div>
        </div>

        <div class="topbar-search">
          <span class="search-ico">${o("search","icon icon-sm")}</span>
          <input type="text" placeholder="Personel, kay\u0131t veya sayfa ara\u2026" aria-label="Ara" />
          <span class="search-kbd">\u2318K</span>
        </div>

        <div class="topbar-actions">
          <button class="topbar-icon" id="admin-notif-bell" aria-label="Bildirimler" title="Bildirimler">
            ${o("bell")}
            <span class="dot" id="admin-notif-dot" style="display:none"></span>
          </button>
          <button class="topbar-icon" id="admin-logout" aria-label="\xC7\u0131k\u0131\u015F Yap" title="\xC7\u0131k\u0131\u015F Yap">
            ${o("log-out")}
          </button>
        </div>
      </header>
    `}afterMount(){this.$("#admin-menu-toggle")?.addEventListener("click",()=>this.opts.onMenuToggle()),this.$("#admin-rail-toggle")?.addEventListener("click",()=>this.opts.onRailToggle()),this.$("#admin-logout")?.addEventListener("click",async()=>{try{await c.post("/api/v1/auth/logout")}catch{}r.set("user",null),r.set("profile",null),location.href="/login"});let t=this.$("#admin-notif-bell");t&&(this.notifPanel=new E,this.notifPanel.mount(t,this.$("#admin-notif-dot")))}setRailCollapsed(t){let i=this.$("#admin-rail-toggle");i&&(i.innerHTML=o(t?"panel-left-open":"panel-left-close"))}setTitle(t,i){let l=this.$("#admin-page-title"),d=this.$("#admin-page-sub");l&&(l.textContent=t),d&&(d.textContent=i)}};var S="pdks-admin-sidebar",w=class{constructor(e,t){this.sidebarEl=null;this.overlayEl=null;this.railCollapsed=localStorage.getItem(S)==="collapsed";let i=M(t);this.shellEl=document.createElement("div"),this.shellEl.className="admin-shell",this.shellEl.setAttribute("data-sidebar",this.railCollapsed?"collapsed":"expanded"),this.overlayEl=document.createElement("div"),this.overlayEl.className="sidebar-overlay",this.shellEl.appendChild(this.overlayEl),this.sidebar=new y(t),this.sidebar.mount(this.shellEl),this.sidebarEl=this.shellEl.querySelector("#admin-sidebar");let l=document.createElement("div");this.shellEl.appendChild(l),this.topbar=new k({title:i?.title??"",subtitle:i?.subtitle??"",railCollapsed:this.railCollapsed,onMenuToggle:()=>this.toggleMobileSidebar(),onRailToggle:()=>this.toggleRail()}),this.topbar.mount(l),this.contentEl=document.createElement("main"),this.contentEl.className="content page-enter",l.appendChild(this.contentEl),this.overlayEl.addEventListener("click",()=>this.closeMobileSidebar()),e.innerHTML="",e.appendChild(this.shellEl)}setActivePage(e){this.sidebar.setActive(e);let t=M(e);this.topbar.setTitle(t?.title??"",t?.subtitle??""),this.closeMobileSidebar()}toggleRail(){this.railCollapsed=!this.railCollapsed,this.shellEl.setAttribute("data-sidebar",this.railCollapsed?"collapsed":"expanded"),localStorage.setItem(S,this.railCollapsed?"collapsed":"expanded"),this.topbar.setRailCollapsed(this.railCollapsed)}toggleMobileSidebar(){this.sidebarEl?.classList.toggle("open"),this.overlayEl?.classList.toggle("open")}closeMobileSidebar(){this.sidebarEl?.classList.remove("open"),this.overlayEl?.classList.remove("open")}};var A=class{constructor(){this.es=null;this.retryDelay=3e3;this.maxRetry=3e4}connect(){this.es||this._open()}disconnect(){this.es?.close(),this.es=null}_open(){this.es=new EventSource("/api/v1/events",{withCredentials:!0}),this.es.addEventListener("connected",()=>{this.retryDelay=3e3,m.emit("sse:connected",null)}),this.es.addEventListener("attendance",e=>{try{m.emit("sse:attendance",JSON.parse(e.data))}catch{}}),this.es.addEventListener("notification",e=>{try{m.emit("sse:notification",JSON.parse(e.data))}catch{}}),this.es.onerror=()=>{this.es?.close(),this.es=null,m.emit("sse:disconnected",null),setTimeout(()=>this._open(),this.retryDelay),this.retryDelay=Math.min(this.retryDelay*1.5,this.maxRetry)}}},R=new A;T();var _={};for(let n of[...v,...P])_[n.path]=n.loader;async function O(){let n=document.getElementById("admin-app");if(!n)throw new Error("#admin-app bulunamad\u0131");let e=await c.get("/api/v1/auth/me").catch(()=>null);if(!e||!("id"in e)){window.location.href="/login";return}if(e.role!=="admin"){window.location.href="/";return}r.set("user",{id:e.id,role:e.role,company_id:e.company_id}),r.set("profile",e),R.connect();let t=new w(n,location.pathname),i=new f(_,t.contentEl);window.router=i;let l=i.navigate.bind(i);i.navigate=async d=>{await l(d),t.setActivePage(d)},await i._render(location.pathname),t.setActivePage(location.pathname)}window.onerror=(n,e,t,i,l)=>{console.error("[PDKS Admin] Global hata:",{msg:n,src:e,line:t,col:i,err:l})};window.addEventListener("unhandledrejection",n=>{console.error("[PDKS Admin] \u0130\u015Flenmemi\u015F Promise hatas\u0131:",n.reason)});O().catch(n=>{console.error("Admin paneli ba\u015Flat\u0131lamad\u0131:",n);let e=document.getElementById("admin-app");e&&(e.innerHTML=`<div style="padding:40px;text-align:center;color:#ef4444;">
      Admin paneli ba\u015Flat\u0131lamad\u0131. Sayfay\u0131 yenileyin.
    </div>`)});
