import{a as k,b as i,d,e as g,f as b}from"./chunk-GK74B4NT.js";import{d as o}from"./chunk-QWFT4EHO.js";import{a as v,b as m,c as u}from"./chunk-IUADW4UU.js";function l(t,a){let e=String(d()[t]);return`<div class="tweak-seg">${a.map(s=>`<button type="button" data-key="${t}" data-val="${s.val}" class="${e===s.val?"active":""}">${s.label}</button>`).join("")}</div>`}function _(){let t=String(d().accent).toLowerCase();return`<div class="tweak-swatches">${k.map(a=>`<button type="button" class="tweak-swatch ${t===a.value.toLowerCase()?"active":""}" style="background:${a.value}" data-key="accent" data-val="${a.value}" title="${a.label}" aria-label="${a.label}"></button>`).join("")}</div>`}function p(t){let a=d()[t]==="on";return`<button type="button" class="tw-toggle ${a?"on":""}" role="switch" aria-checked="${a}" data-toggle="${t}"><span class="tw-knob"></span></button>`}function $(t,a,e,s,n){let r=d()[t];return`
    <div class="tw-slider">
      <input type="range" min="${a}" max="${e}" step="${s}" value="${r}" data-slider="${t}" data-unit="${n}" aria-label="${t}">
      <span class="tw-slider-val">${r}${n}</span>
    </div>`}function A(t){switch(t){case"theme":return'<div class="pv-split"><i></i><b></b></div>';case"contrast":return'<span class="pv-aa" style="-webkit-text-stroke:0.6px var(--text-primary)">Aa</span>';case"accent":return'<span class="pv-chip" style="background:var(--accent)"></span>';case"glow":return'<span class="pv-chip pv-chip-glow" style="background:var(--accent)"></span>';case"tint":return'<span class="pv-card-mini tint"></span>';case"font":return'<span class="pv-aa">Aa</span>';case"uiScale":return'<span class="pv-aa">Aa</span>';case"weight":return'<span class="pv-aa" style="font-weight:800">Aa</span>';case"tracking":return'<span class="pv-track">ABC</span>';case"density":return'<div class="pv-rows"><i></i><i></i><i></i></div>';case"radius":return'<span class="pv-radius"></span>';case"cwidth":return'<div class="pv-page"><i></i><i></i></div>';case"cards":return'<span class="pv-card-mini sh"></span>';case"shadows":return'<span class="pv-card-mini sh"></span>';case"glass":return'<div class="pv-glass"><i></i></div>';case"bg":return'<span class="pv-bg glow"></span>';case"focusring":return'<span class="pv-ring"></span>';case"tstripe":return'<div class="pv-tbl"><i></i><i></i><i></i><i></i></div>';case"thover":return'<div class="pv-tbl"><i></i><i class="hot"></i><i></i><i></i></div>';case"tlines":return'<div class="pv-tbl grid"><i></i><i></i><i></i><i></i></div>';case"motion":return`<span class="pv-motion">${u("zap")}</span>`;case"underline":return'<span class="pv-link">Ba\u011Flant\u0131</span>';default:return""}}function T(t){return`<div class="ck-card">
    <div class="ck-card-top">
      <div class="ck-meta"><strong>${t.title}</strong><span>${t.desc}</span></div>
      <div class="ck-preview">${A(t.key)}</div>
    </div>
    <div class="ck-card-foot">${t.control}</div>
  </div>`}function S(t,a,e){return`<div class="ck-section">
    <span class="ck-sec-ico">${u(t)}</span>
    <strong>${a}</strong>
    <span class="ck-sec-count">${e} ayar</span>
  </div>`}function E(){return'<div class="cockpit-grid">'+[{icon:"contrast",title:"Tema & Kontrast",items:[{key:"theme",title:"Tema",desc:"Koyu, a\xE7\u0131k veya otomatik",control:l("theme",i.theme)},{key:"contrast",title:"Kontrast",desc:"Kenarl\u0131k ve metin keskinli\u011Fi",control:l("contrast",i.contrast)}]},{icon:"palette",title:"Renk",items:[{key:"accent",title:"Vurgu Rengi",desc:"12 marka rengi",control:_()},{key:"glow",title:"Vurgu Parlamas\u0131",desc:"Buton ve \xF6\u011Felerde \u0131\u015F\u0131ma",control:l("glow",i.glow)},{key:"tint",title:"Y\xFCzey Tonu",desc:"Kartlar\u0131 vurguyla boya",control:p("tint")}]},{icon:"type",title:"Tipografi",items:[{key:"font",title:"Yaz\u0131 Tipi",desc:"Aray\xFCz font ailesi",control:l("font",i.font)},{key:"uiScale",title:"UI \xD6l\xE7e\u011Fi",desc:"T\xFCm aray\xFCz boyutu",control:$("uiScale",85,120,1,"%")},{key:"weight",title:"Metin Kal\u0131nl\u0131\u011F\u0131",desc:"Genel yaz\u0131 kal\u0131nl\u0131\u011F\u0131",control:l("weight",i.weight)},{key:"tracking",title:"Harf Aral\u0131\u011F\u0131",desc:"Karakter s\u0131kl\u0131\u011F\u0131",control:l("tracking",i.tracking)}]},{icon:"layout-dashboard",title:"D\xFCzen",items:[{key:"density",title:"Bilgi Yo\u011Funlu\u011Fu",desc:"Bo\u015Fluk ve sat\u0131r s\u0131kl\u0131\u011F\u0131",control:l("density",i.density)},{key:"radius",title:"K\xF6\u015Fe Yuvarlakl\u0131\u011F\u0131",desc:"Kart ve buton k\xF6\u015Feleri",control:l("radius",i.radius)},{key:"cwidth",title:"\u0130\xE7erik Geni\u015Fli\u011Fi",desc:"Sayfa i\xE7erik s\u0131n\u0131r\u0131",control:l("cwidth",i.cwidth)},{key:"cards",title:"Kart Stili",desc:"G\xF6lgeli, d\xFCz veya \xE7er\xE7eveli",control:l("cards",i.cards)}]},{icon:"sparkles",title:"Efektler",items:[{key:"shadows",title:"G\xF6lgeler",desc:"Kart ve buton g\xF6lgeleri",control:p("shadows")},{key:"glass",title:"Cam Efekti",desc:"\xDCst \xE7ubukta bulan\u0131kl\u0131k",control:p("glass")},{key:"bg",title:"Arka Plan",desc:"Sayfa arka plan deseni",control:l("bg",i.bg)},{key:"focusring",title:"Odak Halkas\u0131",desc:"Klavye odak g\xF6stergesi",control:l("focusring",i.focusring)}]},{icon:"table",title:"Tablolar",items:[{key:"tstripe",title:"Zebra Sat\u0131rlar",desc:"Tek/\xE7ift renklendirme",control:p("tstripe")},{key:"thover",title:"Sat\u0131r Vurgusu",desc:"\xDCzerine gelince renklenme",control:p("thover")},{key:"tlines",title:"Izgara \xC7izgileri",desc:"H\xFCcre kenarl\u0131klar\u0131",control:l("tlines",i.tlines)}]},{icon:"accessibility",title:"Eri\u015Filebilirlik & Hareket",items:[{key:"motion",title:"Hareket",desc:"Animasyon ve ge\xE7i\u015Fler",control:l("motion",i.motion)},{key:"underline",title:"Ba\u011Flant\u0131 Alt\u0131 \xC7izgi",desc:"Linkleri alt\u0131 \xE7izili g\xF6ster",control:p("underline")}]}].map(a=>S(a.icon,a.title,a.items.length)+a.items.map(T).join("")).join("")+"</div>"}var L=21;function y(){return`
    <div class="card">
      <div class="cockpit-bar">
        <div class="cockpit-bar-info">
          ${u("sliders-horizontal","icon icon-sm")}
          <strong>Tema &amp; G\xF6r\xFCn\xFCm</strong> \u2014 ${L} ayar, bu cihazda kaydedilir
        </div>
        <div class="cockpit-actions">
          <span class="badge badge-muted">Bu cihazda kaydedilir</span>
          <button class="btn btn-ghost btn-sm" id="appearance-reset">${u("rotate-ccw","icon icon-sm")} S\u0131f\u0131rla</button>
        </div>
      </div>
      <div id="appearance-card-body">${E()}</div>
    </div>
  `}function f(t,a){t.querySelectorAll(".tweak-seg button[data-key], .tweak-swatch[data-key]").forEach(e=>{e.addEventListener("click",()=>{let s=e.dataset.key,n=e.dataset.val;g({[s]:s==="uiScale"?Number(n):n}),a()})}),t.querySelectorAll("[data-toggle]").forEach(e=>{e.addEventListener("click",()=>{let s=e.dataset.toggle,n=d()[s]==="on";g({[s]:n?"off":"on"}),a()})}),t.querySelectorAll('input[type="range"][data-slider]').forEach(e=>{e.addEventListener("input",()=>{let s=e.dataset.slider,n=e.dataset.unit??"";g({[s]:Number(e.value)});let r=e.parentElement?.querySelector(".tw-slider-val");r&&(r.textContent=`${e.value}${n}`)})}),t.querySelector("#appearance-reset")?.addEventListener("click",()=>{b(),a()})}var h=class extends m{constructor(){super(...arguments);this.tab="genel";this.settings=null}async render(){this.container.innerHTML='<div class="card"><p style="color:var(--text-muted)">Y\xFCkleniyor...</p></div>';try{let e=await v.get("/api/v1/settings");this.settings=e.settings}catch(e){o(e instanceof Error?e.message:"Ayarlar y\xFCklenemedi","error")}this.draw()}draw(){if(this.container.innerHTML=`
      <div class="settings-tabs">
        <button class="settings-tab ${this.tab==="genel"?"active":""}" data-tab="genel">Genel</button>
        <button class="settings-tab ${this.tab==="gorunum"?"active":""}" data-tab="gorunum">G\xF6r\xFCn\xFCm</button>
      </div>
      <div id="settings-tab-content">
        ${this.tab==="genel"?this.renderGeneralTab():y()}
      </div>
    `,this.on(".settings-tabs","click",e=>{let s=e.target.closest("[data-tab]");s&&(this.tab=s.dataset.tab,this.draw())}),this.tab==="genel")this.attachGeneralTab();else{let e=this.$("#settings-tab-content");f(e,()=>this.draw())}}renderGeneralTab(){let e=this.settings;return`
      <div class="card">
        <div class="card-title">\u015Eirket Genel Bilgileri</div>
        <form id="settings-form" class="form-grid">
          <div class="form-field">
            <label class="label">\u015Eirket Ad\u0131</label>
            <input class="input" name="company_name" value="${e?.company_name??""}" placeholder="\xD6rn: ABC Yaz\u0131l\u0131m Ltd. \u015Eti." />
          </div>
          <div class="form-field">
            <label class="label">Haftal\u0131k \xC7al\u0131\u015Fma G\xFCn\xFC</label>
            <select class="input" name="work_days_per_week">
              <option value="5" ${e?.work_days_per_week===5?"selected":""}>5 G\xFCn</option>
              <option value="6" ${e?.work_days_per_week===6?"selected":""}>6 G\xFCn</option>
              <option value="7" ${e?.work_days_per_week===7?"selected":""}>7 G\xFCn</option>
            </select>
          </div>
          <div class="form-field">
            <label class="label">Hesaplama Tolerans\u0131 (Dk)</label>
            <input class="input" type="number" name="rounding_threshold_minutes" value="${e?.rounding_threshold_minutes??30}" />
          </div>
          <div class="form-field">
            <label class="label">Mesai Ba\u015Flang\u0131c\u0131</label>
            <input class="input" type="time" name="shift_start" value="${e?.shift_start?.slice(0,5)??"09:00"}" />
          </div>
          <div class="form-field">
            <label class="label">Mesai Biti\u015Fi</label>
            <input class="input" type="time" name="shift_end" value="${e?.shift_end?.slice(0,5)??"18:00"}" />
          </div>
          <div class="form-field">
            <label class="label">\u0130\u015F Yeri IP Adresi</label>
            <input class="input" name="office_ip" value="${e?.office_ip??""}" placeholder="\xD6rn: 176.234.12.34" />
          </div>
          <div class="form-field">
            <label class="label">QR Gizli Anahtar</label>
            <div style="display:flex; gap:var(--space-2)">
              <input class="input" name="qr_secret" value="${e?.qr_secret??""}" placeholder="QR gizli anahtar\u0131" />
              <button type="button" class="btn btn-ghost btn-sm" id="settings-regen-secret">Yenile</button>
            </div>
          </div>
          <div class="form-field" style="grid-column: 1 / -1">
            <button type="submit" class="btn btn-primary">Ayarlar\u0131 Kaydet</button>
          </div>
        </form>
      </div>
    `}attachGeneralTab(){let e=this.$("#settings-form");e?.addEventListener("submit",async s=>{s.preventDefault();let n=new FormData(e),r={};n.forEach((c,w)=>{r[w]=c||null}),r.work_days_per_week&&(r.work_days_per_week=Number(r.work_days_per_week)),r.rounding_threshold_minutes&&(r.rounding_threshold_minutes=Number(r.rounding_threshold_minutes));try{let c=await v.patch("/api/v1/settings",r);this.settings=c.settings,o("Ayarlar kaydedildi","success")}catch(c){o(c instanceof Error?c.message:"Kaydedilemedi","error")}}),this.on("#settings-regen-secret","click",async()=>{try{let s=await v.post("/api/v1/settings/generate-secret",{}),n=this.$('input[name="qr_secret"]');n&&(n.value=s.secret),o("Yeni QR s\u0131rr\u0131 \xFCretildi \u2014 Ayarlar\u0131 kaydetmeyi unutmay\u0131n!","warning")}catch{o("S\u0131r \xFCretilemedi","error")}})}};export{h as SettingsPage};
