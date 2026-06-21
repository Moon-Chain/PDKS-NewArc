import{a as m}from"./chunk-FKJNCFTW.js";import{d as b,e as v}from"./chunk-QWFT4EHO.js";import{a as g,b as u,c as s}from"./chunk-IUADW4UU.js";var f={approve:"onaylad\u0131",reject:"reddetti",update:"g\xFCncelledi",delete:"sildi",create:"olu\u015Fturdu",login:"giri\u015F yapt\u0131"};function p(r,t,n,l,e,i){return`
    <div class="card stat-card stat-theme-${e}${i?" stat-card-clickable":""}" ${i?`data-stat-modal="${i}"`:""}>
      <div class="stat-top">
        <span class="stat-label">${t}</span>
        <span class="stat-icon stat-icon-${e}">${s(r)}</span>
      </div>
      <div class="stat-value tnum">${n}</div>
      <div class="stat-foot">${l}</div>
    </div>`}function h(r,t,n){return`
    <div class="activity-item">
      <div class="activity-dot"></div>
      <div>
        <div class="activity-text"><strong>${r}</strong> ${t}</div>
        <div class="activity-time">${n}</div>
      </div>
    </div>`}function k(r){let t=Math.floor((Date.now()-new Date(r).getTime())/6e4);if(t<1)return"Az \xF6nce";if(t<60)return`${t} dk \xF6nce`;let n=Math.floor(t/60);return n<24?`${n} sa \xF6nce`:`${Math.floor(n/24)} g\xFCn \xF6nce`}function y(r,t){let n={day:"2-digit",month:"2-digit"},l=new Date(r).toLocaleDateString("tr-TR",n),e=new Date(t).toLocaleDateString("tr-TR",n);return l===e?l:`${l} - ${e}`}function w(r){return new Date(r).toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})}var $=class extends u{async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>';let t=null;try{t=await g.get("/api/v1/admin/dashboard")}catch(a){b(a instanceof Error?a.message:"G\xF6sterge paneli y\xFCklenemedi","error")}if(!t){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Veriler y\xFCklenemedi.</p></div>';return}let l=(m.get("profile")?.name??"").split(" ")[0]||"",e=t.pendingLeaves+t.pendingOvertime,i=Math.max(1,...t.departments.map(a=>a.count)),d=new Date().toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric",weekday:"long"}),o=t.totalStaff>0?Math.round(t.present/t.totalStaff*100):0;this.container.innerHTML=`
      <div class="greeting">
        <div>
          <h2>\u0130yi g\xFCnler, ${l}</h2>
          <div class="greeting-sub">\u015Eu an ofiste <strong>${t.present}</strong> ki\u015Fi var \xB7 <strong>${e}</strong> talep onay\u0131n\u0131z\u0131 bekliyor</div>
        </div>
        <div class="greeting-date">${s("calendar-days")} <span>${d}</span></div>
      </div>

      <div class="stat-grid">
        ${p("door-open","\u015Eu An \u0130\xE7eride",`${t.present} / ${t.totalStaff}`,`Personelin %${o}'i ofiste`,"info","inside")}
        ${p("inbox","Bekleyen Onaylar",`${e}`,`${t.pendingLeaves} izin \xB7 ${t.pendingOvertime} mesai talebi`,"warning","pending")}
        ${p("palmtree","Bug\xFCn \u0130zinli",`${t.onLeave}`,t.onLeaveList.map(a=>a.name).join(", ")||"Yok","success","onleave")}
        ${p("users","Toplam Personel",`${t.totalStaff}`,`${t.departments.length} departman`,"accent","total")}
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-title">
            <span>Son Aktiviteler</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/audit">${s("arrow-right","icon icon-sm")} T\xFCm Ge\xE7mi\u015Fi G\xF6r</button>
          </div>
          <div class="activity-list">
            ${t.recentActivity.length===0?'<p style="color:var(--text-muted); padding: var(--space-2) 0">Aktivite kayd\u0131 yok</p>':t.recentActivity.map(a=>h(a.actor,`${f[a.action]??a.action}${a.target_table?" \xB7 "+a.target_table:""}`,k(a.created_at))).join("")}
          </div>
        </div>

        <div class="card">
          <div class="card-title">H\u0131zl\u0131 Eri\u015Fim</div>
          <div style="display:flex; flex-direction:column; gap: var(--space-2)">
            <button class="btn btn-primary" style="justify-content:flex-start" data-nav="/admin/users">${s("user-plus")} Yeni Personel Ekle</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/approvals">${s("inbox")} Bekleyen Onaylar\u0131 G\xF6r</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/reports">${s("download")} Ayl\u0131k Excel Raporu \u0130ndir</button>
            <button class="btn btn-ghost" style="justify-content:flex-start" data-nav="/admin/holidays">${s("calendar-plus")} Tatil G\xFCn\xFC Ekle</button>
          </div>
        </div>
      </div>

      <div class="widget-grid">
        <div class="card">
          <div class="card-title">
            <span>Bekleyen \u0130zin Talepleri</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/approvals">${s("arrow-right","icon icon-sm")}</button>
          </div>
          <div class="widget-list">
            ${t.pendingLeaveRows.length===0?'<p style="color:var(--text-muted); padding: var(--space-2) 0">Bekleyen izin talebi yok</p>':t.pendingLeaveRows.map(a=>`
                  <div class="widget-row">
                    <span>${a.name}</span>
                    <span class="widget-meta">${y(a.start_date,a.end_date)} \xB7 ${a.days} g\xFCn</span>
                  </div>`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/leaves">${s("calendar-days","icon icon-sm")} T\xFCm \u0130zinleri G\xF6r</button>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Yakla\u015Fan Tatiller</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/holidays">${s("arrow-right","icon icon-sm")}</button>
          </div>
          <div class="widget-list">
            ${t.upcomingHolidays.length===0?'<p style="color:var(--text-muted); padding: var(--space-2) 0">Yakla\u015Fan tatil yok</p>':t.upcomingHolidays.map(a=>`
                  <div class="widget-row">
                    <span>${a.name}</span>
                    <span class="widget-meta">${w(a.date)}</span>
                  </div>`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/holidays">${s("sun","icon icon-sm")} T\xFCm Tatilleri G\xF6r</button>
        </div>

        <div class="card">
          <div class="card-title">
            <span>Departman Da\u011F\u0131l\u0131m\u0131</span>
            <button class="btn btn-ghost btn-sm" data-nav="/admin/users">${s("arrow-right","icon icon-sm")}</button>
          </div>
          <div class="widget-list">
            ${t.departments.length===0?'<p style="color:var(--text-muted); padding: var(--space-2) 0">Personel kayd\u0131 yok</p>':t.departments.map(a=>`
                  <div class="widget-row">
                    <span>${a.dept}</span>
                    <div class="dept-bar"><div class="dept-bar-fill" style="width:${a.count/i*100}%"></div></div>
                    <span class="widget-meta">${a.count}</span>
                  </div>`).join("")}
          </div>
          <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" data-nav="/admin/users">${s("users","icon icon-sm")} T\xFCm Personeli G\xF6r</button>
        </div>
      </div>
    `,this.$$("[data-nav]").forEach(a=>{a.addEventListener("click",()=>{let c=a.getAttribute("data-nav");c&&this.navigate(c)})}),this.$$("[data-stat-modal]").forEach(a=>{a.addEventListener("click",()=>{let c=a.getAttribute("data-stat-modal");c&&this.openStatModal(c,t,i)})})}navigate(t){window.router?.navigate(t)}openStatModal(t,n,l){if(t==="inside"){let e=n.presentList.map(d=>`
        <div class="widget-row"><span>${d.name}</span><span class="widget-meta">${d.detail}</span></div>`).join(""),{close:i}=v("\u015Eu An \u0130\xE7eride",`
        <div class="widget-list">${e||'<div class="widget-row"><span class="widget-meta">\u0130\xE7eride kimse yok</span></div>'}</div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${s("clock","icon icon-sm")} T\xFCm Hareketleri G\xF6r</button>
      `);this.bindStatModalNav(i,"/admin/movements")}else if(t==="pending"){let e=n.pendingLeaveRows.map(o=>`
        <div class="widget-row"><span>${o.name}</span><span class="widget-meta">${y(o.start_date,o.end_date)} \xB7 ${o.days} g\xFCn</span></div>`).join(""),i=n.pendingOvertimeRows.map(o=>`
        <div class="widget-row"><span>${o.name}</span><span class="widget-meta">${w(o.date)} \xB7 ${o.hours} saat</span></div>`).join(""),{close:d}=v("Bekleyen Onaylar",`
        <div class="modal-section-title">\u0130zin Talepleri (${n.pendingLeaves})</div>
        <div class="widget-list">${e||'<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
        <div class="modal-section-title">Mesai Talepleri (${n.pendingOvertime})</div>
        <div class="widget-list">${i||'<div class="widget-row"><span class="widget-meta">Bekleyen talep yok</span></div>'}</div>
        <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${s("check-check","icon icon-sm")} Onaylar Sayfas\u0131na Git</button>
      `);this.bindStatModalNav(d,"/admin/approvals")}else if(t==="onleave"){let e=n.onLeaveList.map(d=>`
        <div class="widget-row"><span>${d.name}</span><span class="widget-meta">${d.detail}</span></div>`).join(""),{close:i}=v("Bug\xFCn \u0130zinli",`
        <div class="widget-list">${e||'<div class="widget-row"><span class="widget-meta">Bug\xFCn izinli kimse yok</span></div>'}</div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${s("calendar-days","icon icon-sm")} T\xFCm \u0130zinleri G\xF6r</button>
      `);this.bindStatModalNav(i,"/admin/leaves")}else if(t==="total"){let e=n.departments.map(d=>`
        <div class="widget-row">
          <span>${d.dept}</span>
          <div class="dept-bar"><div class="dept-bar-fill" style="width:${d.count/l*100}%"></div></div>
          <span class="widget-meta">${d.count}</span>
        </div>`).join(""),{close:i}=v("Toplam Personel",`
        <div class="modal-section-title">Departmana G\xF6re</div>
        <div class="widget-list">${e||'<div class="widget-row"><span class="widget-meta">Personel kayd\u0131 yok</span></div>'}</div>
        <div class="modal-section-title">Role G\xF6re</div>
        <div class="widget-list">
          <div class="widget-row"><span>Y\xF6netici</span><span class="widget-meta">${n.roleCounts.admin}</span></div>
          <div class="widget-row"><span>M\xFCd\xFCr</span><span class="widget-meta">${n.roleCounts.mudur}</span></div>
          <div class="widget-row"><span>Tak\u0131m Lideri</span><span class="widget-meta">${n.roleCounts.takim_lideri}</span></div>
          <div class="widget-row"><span>Personel</span><span class="widget-meta">${n.roleCounts.personel}</span></div>
        </div>
        <button class="btn btn-ghost btn-sm" style="width:100%; justify-content:center" id="stat-modal-nav">${s("users","icon icon-sm")} T\xFCm Personeli G\xF6r</button>
      `);this.bindStatModalNav(i,"/admin/users")}}bindStatModalNav(t,n){document.getElementById("stat-modal-nav")?.addEventListener("click",()=>{t(),this.navigate(n)})}};export{$ as DashboardPage};
