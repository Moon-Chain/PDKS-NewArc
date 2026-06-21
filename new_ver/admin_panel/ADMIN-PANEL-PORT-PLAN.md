# Admin Paneli — `public/admin/` Port Planı (Detaylı)

> Bu belge [ADMIN-PANEL.md](ADMIN-PANEL.md)'nin Bölüm 6-7'sini tek bir karara göre detaylandırır:
> Admin paneline ait **her şey** `public/admin/` altında, kendi içinde tutarlı "iç proje" gibi
> bir klasörde toplanır. Backend/API/auth/DB **ayrılmaz** — sadece frontend dosyaları gruplanır.

---

## TODO — Kademe Takibi

- [x] Kademe 1 — İskelet: CSS + Registry + Placeholder
- [x] Kademe 2 — Layout: AdminLayout, Sidebar, AdminTopBar
- [x] Kademe 3 — Entry Point + Build/Server Entegrasyonu (boş layout `/admin`'de canlanır)
- [x] Kademe 4 — DashboardPage (mock veriyle)
- [x] Kademe 5 — UsersPage + MovementsPage
- [x] Kademe 6 — LeavesPage + OvertimePage + ApprovalsPage
- [x] Kademe 7 — ReportsPage + HolidaysPage
- [x] Kademe 8 — SettingsPage + AppearanceTweaks ("Görünüm" sekmesi)
- [x] Kademe 9 — AuditLogPage + Backend Audit Endpoint
- [x] Kademe 10 — NotificationsPage + AdminTopBar Bildirim Paneli
- [x] Kademe 11 — Dashboard Backend Bağlama
- [ ] Kademe 12 — Temizlik (`admin-panel-preview/` kaldırılır) (gerek yok kalsın.)

---

## 1. Karar — Neden `public/admin/`

- Önceki taslakta admin dosyaları `public/admin.html`, `public/css/admin.css`,
  `public/ts/admin/` gibi 3 farklı kök klasöre dağılıyordu.
- Bu planda **tamamı `public/admin/` altında**: `index.html`, `css/`, `ts/`, derlenmiş `js/`.
- `express.static('public')` zaten `public/admin/...` → `/admin/...` olarak servis eder,
  ekstra static-mount gerekmez.
- Admin sayfaları paylaşılan çekirdeği (`BasePage`, `ApiClient`, `StateManager`, `Router`,
  `EventBus`) `public/ts/core/...`'dan **import eder** — kod tekrarı yok, tek backend/API/DB.

---

## 2. Klasör Yapısı (Hedef)

```
public/
  admin/
    index.html                 ← admin SPA kabuğu (#admin-app), admin-panel-preview/index.html portu
    css/
      admin.css                ← admin-panel-preview/css/admin.css portu (variable'lar components.css ile hizalı)
    ts/
      app-admin.ts             ← giriş noktası (app.ts'in admin eşleniği)
      moduleRegistry.ts         ← ADMIN_MODULES — preview'daki SIDEBAR/ADMIN_MODULES birebir
      layout/
        AdminLayout.ts          ← sidebar + topbar shell
        Sidebar.ts              ← registry'den otomatik üretim, collapse/rail, locked modüller
        AdminTopBar.ts          ← TopBar.ts + NotificationPanel deseninin admin sürümü
      pages/
        DashboardPage.ts
        UsersPage.ts            ← PWA UsersPage'i extend/yeniden kullan
        MovementsPage.ts
        LeavesPage.ts
        OvertimePage.ts
        ApprovalsPage.ts
        ReportsPage.ts
        HolidaysPage.ts
        SettingsPage.ts         ← + "Görünüm" sekmesi (Tweaks)
        AuditLogPage.ts          ← yeni
        NotificationsPage.ts     ← PWA'dan port
        PlaceholderPage.ts       ← locked modüller (branches/roles/billing) için
      tweaks/
        AppearanceTweaks.ts      ← admin-panel-preview/js/tweaks.js TS portu (localStorage)
    js/                          ← BUILD ÇIKTISI (esbuild), git'e girmez (public/js gibi)
```

**Paylaşılan, taşınmayan dosyalar** (`public/ts/core/*`, `public/ts/components/*`):
admin sayfaları bunlardan relatif olarak import eder, örn.
`public/admin/ts/pages/UsersPage.ts` → `import { BasePage } from '../../../ts/core/BasePage.js'`.

> Not: PWA'daki `UsersPage.ts`, `LeavesPage.ts`, `MovementsPage.ts`, `ApprovalsPage.ts`,
> `OvertimePage.ts`, `SettingsPage.ts`, `NotificationsPage.ts` **kopyalanmaz** — admin sürümleri
> bu sayfaları extend eder veya aynı veri/servis katmanını kullanan yeni `Admin*Page` sınıfları
> olarak `public/admin/ts/pages/` içinde yazılır (sidebar/tablo-ağırlıklı layout farkı nedeniyle
> render genelde yeniden yazılır, ama API çağrıları/`ApiClient` metodları aynen kullanılır).

---

## 3. `build.ts` Değişiklikleri

```typescript
const config: esbuild.BuildOptions = {
  entryPoints: ['public/ts/app.ts', 'public/admin/ts/app-admin.ts'],
  bundle:      true,
  outdir:      'public/js',          // app.ts çıktısı public/js/ altında kalır (mevcut davranış)
  // ...
};
```

esbuild tek `outdir` ile birden fazla entry point'i `outbase`'e göre dağıtır. İki entry point
farklı köklerde (`public/ts` ve `public/admin/ts`) olduğu için **ayrı build config** ile
ikinci bir `esbuild.build()`/`esbuild.context()` çağrısı eklenmesi daha temiz:

```typescript
const adminConfig: esbuild.BuildOptions = {
  ...config,
  entryPoints: ['public/admin/ts/app-admin.ts'],
  outdir:      'public/admin/js',
  chunkNames:  'chunks/[name]-[hash]',
};
```

`copyStaticAssets()`'teki filtre genişletilir — hem `public/ts` hem `public/admin/ts`
kaynak klasörleri `dist/public`'e kopyalanmaz (sadece derlenmiş `js/` kopyalanır):

```typescript
const tsDir      = join('public', 'ts');
const adminTsDir = join('public', 'admin', 'ts');
cpSync('public', 'dist/public', {
  recursive: true,
  filter: (src) =>
    src !== tsDir      && !src.startsWith(tsDir + sep) &&
    src !== adminTsDir && !src.startsWith(adminTsDir + sep),
});
```

`isDev` (watch) modunda her iki config için `esbuild.context(...).watch()` çağrılır.

---

## 4. `server.ts` Değişiklikleri

Mevcut SPA catch-all'dan **önce** eklenir (satır ~154-157'deki `*` → `index.html`
catch-all'unun üstüne):

```typescript
// Admin SPA catch-all — /admin ve /admin/* (API olmayan) → admin/index.html
app.get(/^\/admin(\/.*)?$/, (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin', 'index.html'));
});
```

`express.static(join(__dirname, 'public'))` zaten `public/admin/css/...`,
`public/admin/js/...` dosyalarını `/admin/css/...`, `/admin/js/...` olarak servis eder —
yukarıdaki route'tan önce tanımlı olduğundan statik dosyalar öncelikli yakalanır, sorun yok.

---

## 5. Modül Registry — `public/admin/ts/moduleRegistry.ts`

`admin-panel-preview/js/admin.js`'deki `ADMIN_MODULES` (grup yapısı) + `PAGE_META`
(başlık/alt yazı) birleştirilip TS'e taşınır:

```typescript
export interface AdminModule {
  id: string;
  label: string;
  icon: string;            // lucide icon adı
  path: string;             // '/admin/users'
  permission: string;       // 'user:manage'
  group: 'operasyon' | 'insan-kaynaklari' | 'ayarlar' | 'sistem';
  title: string;            // sayfa başlığı (PAGE_META.title)
  subtitle: string;         // sayfa alt yazısı (PAGE_META.sub)
  locked?: { note: string }; // branches/roles/billing için
  loader: () => Promise<{ default: typeof BasePage }>;
}

export const ADMIN_MODULES: AdminModule[] = [
  // Operasyon
  { id: 'dashboard',  label: 'Genel Bakış', icon: 'layout-dashboard', path: '/admin',           permission: 'dashboard:view',  group: 'operasyon', title: 'Genel Bakış', subtitle: 'Şirketinizin günlük özeti', loader: () => import('./pages/DashboardPage.js').then(m => m.DashboardPage) },
  { id: 'movements',  label: 'Hareketler',  icon: 'clock',            path: '/admin/movements', permission: 'attendance:view', group: 'operasyon', title: 'Hareketler', subtitle: 'Tüm personelin giriş/çıkış kayıtları', loader: () => import('./pages/MovementsPage.js').then(m => m.MovementsPage) },
  { id: 'approvals',  label: 'Onaylar',     icon: 'check-check',      path: '/admin/approvals', permission: 'leave:approve',   group: 'operasyon', title: 'Onaylar', subtitle: 'Bekleyen izin ve mesai talepleri', loader: () => import('./pages/ApprovalsPage.js').then(m => m.ApprovalsPage) },

  // İnsan Kaynakları
  { id: 'users',      label: 'Personel',    icon: 'users',            path: '/admin/users',     permission: 'user:manage',     group: 'insan-kaynaklari', title: 'Personel', subtitle: 'Personel listesi ve yönetimi', loader: () => import('./pages/UsersPage.js').then(m => m.UsersPage) },
  { id: 'leaves',     label: 'İzinler',     icon: 'calendar-days',    path: '/admin/leaves',    permission: 'leave:view',      group: 'insan-kaynaklari', title: 'İzinler', subtitle: 'İzin talepleri ve bakiyeler', loader: () => import('./pages/LeavesPage.js').then(m => m.LeavesPage) },
  { id: 'overtime',   label: 'Mesai',       icon: 'zap',              path: '/admin/overtime',  permission: 'overtime:view',   group: 'insan-kaynaklari', title: 'Mesai', subtitle: 'Mesai talepleri ve kayıtları', loader: () => import('./pages/OvertimePage.js').then(m => m.OvertimePage) },
  { id: 'reports',    label: 'Raporlar',    icon: 'file-spreadsheet', path: '/admin/reports',   permission: 'reports:view',    group: 'insan-kaynaklari', title: 'Raporlar', subtitle: 'Excel raporu indir', loader: () => import('./pages/ReportsPage.js').then(m => m.ReportsPage) },

  // Ayarlar
  { id: 'holidays',   label: 'Tatil Günleri', icon: 'sun',            path: '/admin/holidays',  permission: 'settings:view',   group: 'ayarlar', title: 'Tatil Günleri', subtitle: 'Resmi ve şirket tatilleri', loader: () => import('./pages/HolidaysPage.js').then(m => m.HolidaysPage) },
  { id: 'settings',   label: 'Şirket Ayarları', icon: 'settings',     path: '/admin/settings',  permission: 'settings:manage', group: 'ayarlar', title: 'Şirket Ayarları', subtitle: 'Ofis IP, vardiya, mola kuralları', loader: () => import('./pages/SettingsPage.js').then(m => m.SettingsPage) },

  // Sistem
  { id: 'audit',      label: 'Aktivite Geçmişi', icon: 'history',     path: '/admin/audit',     permission: 'audit:view',      group: 'sistem', title: 'Aktivite Geçmişi', subtitle: 'Kim ne zaman ne yaptı', loader: () => import('./pages/AuditLogPage.js').then(m => m.AuditLogPage) },
  { id: 'branches',   label: 'Şubeler',     icon: 'map-pin',          path: '/admin/branches',  permission: 'branch:manage',   group: 'sistem', title: 'Şubeler', subtitle: 'Şube yönetimi', locked: { note: 'Kademe 1' }, loader: () => import('./pages/PlaceholderPage.js').then(m => m.PlaceholderPage) },
  { id: 'roles',      label: 'Rol & Yetki', icon: 'shield',           path: '/admin/roles',     permission: 'role:manage',     group: 'sistem', title: 'Rol & Yetki', subtitle: 'Özel roller ve izin atamaları', locked: { note: 'Kademe 2' }, loader: () => import('./pages/PlaceholderPage.js').then(m => m.PlaceholderPage) },
  { id: 'billing',    label: 'Plan & Faturalama', icon: 'credit-card', path: '/admin/billing',  permission: 'billing:manage',  group: 'sistem', title: 'Plan & Faturalama', subtitle: 'Abonelik ve fatura yönetimi', locked: { note: 'Kademe 3' }, loader: () => import('./pages/PlaceholderPage.js').then(m => m.PlaceholderPage) },
];
```

`notifications` modülü sidebar'da değil, `AdminTopBar`'daki bildirim panelinde —
PWA'daki `NotificationPanel`/`NotificationsPage` deseniyle aynı (registry'e girmez).

V1'de `permission` alanı **her zaman true** döner (Bölüm 3, ADMIN-PANEL.md) — `Sidebar.ts`
yine de registry'den `permission` okuyup `requirePermission`/`permissionCache` hazır
olduğunda otomatik filtrelenecek şekilde yazılır.

---

## 6. Sayfa Portu — Sıra ve Eşleme

| # | Modül | Dosya | Veri kaynağı | Not |
|---|---|---|---|---|
| 1 | `dashboard` | `pages/DashboardPage.ts` | `GET /api/v1/admin/dashboard` (yeni) | İlk port — registry/layout/router testi |
| 2 | `users` | `pages/UsersPage.ts` | `GET /api/v1/users` (mevcut) | PWA UsersPage mantığı, admin tablo UI |
| 3 | `movements` | `pages/MovementsPage.ts` | `GET /api/v1/attendance` (mevcut) | — |
| 4 | `approvals` | `pages/ApprovalsPage.ts` | `GET /api/v1/leaves`, `/api/v1/overtime` (pending) | — |
| 5 | `leaves` | `pages/LeavesPage.ts` | `GET /api/v1/leaves` (mevcut) | — |
| 6 | `overtime` | `pages/OvertimePage.ts` | `GET /api/v1/overtime` (mevcut) | — |
| 7 | `reports` | `pages/ReportsPage.ts` | `ExcelService` üzerinden `/api/v1/reports` | Sadece UI |
| 8 | `holidays` | `pages/HolidaysPage.ts` | `GET /api/v1/holidays` (mevcut) | — |
| 9 | `settings` + tweaks | `pages/SettingsPage.ts` + `tweaks/AppearanceTweaks.ts` | `GET/PUT /api/v1/settings` + `localStorage` | "Görünüm" sekmesi |
| 10 | `audit` | `pages/AuditLogPage.ts` | `GET /api/v1/admin/audit-log` (yeni) | Filtreli + sayfalı |
| 11 | bildirimler | `pages/NotificationsPage.ts` + `AdminTopBar` paneli | `GET /api/v1/notifications` (mevcut) | PWA deseni |
| — | `branches`/`roles`/`billing` | `pages/PlaceholderPage.ts` | — | Kilitli kart (Kademe 1/2/3) |

---

## 7. Backend İhtiyaçları (V1 minimum, MD Bölüm 3/7.5 ile aynı)

- `routes/v1/admin/dashboard.ts` → `requirePermission('dashboard:view')`,
  bugünkü giriş/çıkış sayısı, bekleyen onay sayısı, izinli personel sayısı, son N aktivite.
- `routes/v1/admin/audit.ts` → `requirePermission('audit:view')`,
  `audit_log` tablosundan filtreli (`actor`, `action`, `date range`) + sayfalı okuma,
  `AuditRepository.findPage()` eklenir.
- `server.ts`: `app.use('/api/v1/admin', adminRoute)` — tek router altında birleşir.
- RBAC (`003_rbac.sql`, DB-backed `requirePermission`) — ADMIN-PANEL.md Bölüm 3'teki plan
  değişmeden geçerli; admin paneli klasörü ile bağımsız.

---

## 8. Kademeler — Parça Parça Uygulama

Her kademe **bağımsız bir oturumda** yapılabilecek şekilde tanımlandı: kapsam, dokunulacak
dosyalar, ön koşul (önceki kademe) ve "bitti" kriteri içerir. Bir AI ajanı bu belgeyi ve
ilgili kademe numarasını alıp tek başına tamamlayabilmeli.

### Kademe 1 — İskelet: CSS + Registry + Placeholder
**Ön koşul:** yok (ilk kademe)
**Kapsam:**
- `public/admin/css/admin.css` — `admin-panel-preview/css/admin.css`'ten **referans alınarak**
  yeniden yazılır; renk/spacing/radius değerleri `public/css/components.css` ve `style.css`'teki
  mevcut custom property'lerle (`--accent`, `--bg-card`, `--radius-md` vb.) hizalanır.
- `public/admin/ts/moduleRegistry.ts` — Bölüm 5'teki `ADMIN_MODULES` (henüz tüm `loader`lar
  mevcut olmayan sayfalara işaret edecek, sorun değil — sonraki kademelerde dosyalar oluşacak).
- `public/admin/ts/pages/PlaceholderPage.ts` — `BasePage`'i extend eden, "Bu modül Kademe X'te
  eklenecek" mesajı gösteren basit sayfa (preview'daki `lockedModule()` görünümünün TS portu).
**Bitti kriteri:** Bu üç dosya derlenebilir (henüz build'e bağlı değil, sadece TS syntax/tip
hatası yok); registry içe aktarıldığında tip hatası vermiyor (diğer `loader`lar Kademe 4-9'da
oluşacak dosyalara işaret ettiği için bu kademede `// TODO` veya tüm loader'ları
`PlaceholderPage`'e işaret eden geçici haliyle yazılabilir, Kademe 4-9'da güncellenir).

### Kademe 2 — Layout: AdminLayout, Sidebar, AdminTopBar
**Ön koşul:** Kademe 1 (registry + css)
**Kapsam:**
- `public/admin/ts/layout/Sidebar.ts` — `ADMIN_MODULES`'den grup başlıkları + linkleri üretir,
  `locked` modüller kilit ikonuyla gösterilir, collapse/rail durumu (preview'daki sidebar
  davranışı referans).
- `public/admin/ts/layout/AdminTopBar.ts` — kullanıcı adı/rol, bildirim ikonu (panel içeriği
  Kademe 9'da), sayfa başlığı/alt yazısı (`moduleRegistry`'deki `title`/`subtitle`).
- `public/admin/ts/layout/AdminLayout.ts` — Sidebar + AdminTopBar + içerik alanını birleştiren
  shell `BaseComponent`/sınıf.
**Bitti kriteri:** Bu üç sınıf izole olarak (henüz mount edilmeden) derlenir; `AdminLayout`
bir DOM elementine mount edildiğinde sidebar + topbar iskeletini render eder (görsel doğrulama
Kademe 3'te `/admin` ayağa kalkınca yapılacak).

### Kademe 3 — Entry Point + Build/Server Entegrasyonu (Boş Layout Canlanır)
**Ön koşul:** Kademe 1 + 2
**Kapsam:**
- `public/admin/index.html` — `#admin-app` kök elementi, `css/admin.css` ve derlenmiş
  `js/app-admin.js` referansları.
- `public/admin/ts/app-admin.ts` — `app.ts`'in admin eşleniği: `AdminLayout`'u mount eder,
  `Router`'ı `moduleRegistry`'den üretilen route map'iyle başlatır, `/api/v1/auth/me` ile
  kullanıcıyı çeker (PWA'daki `init()` deseni).
- `build.ts` — Bölüm 3'teki ikinci esbuild config (`public/admin/ts/app-admin.ts` →
  `public/admin/js`) + `copyStaticAssets` filtresine `public/admin/ts` eklenir.
- `server.ts` — Bölüm 4'teki `/admin(/.*)?` catch-all → `public/admin/index.html`.
**Bitti kriteri:** `npm run build` (veya dev watch) sonrası `/admin` adresine girildiğinde
sidebar + topbar + boş içerik alanı görünür, konsol hatası yok. Dashboard route'u
`PlaceholderPage` veya boş `DashboardPage` gösterebilir.

### Kademe 4 — DashboardPage (mock veriyle)
**Ön koşul:** Kademe 3
**Kapsam:**
- `public/admin/ts/pages/DashboardPage.ts` — preview'daki dashboard kartlarının (bugünkü
  giriş/çıkış, bekleyen onay, izinli personel, son aktiviteler) `BasePage` portu, **mock
  veriyle** (gerçek endpoint Kademe 12'de bağlanır).
- `moduleRegistry.ts`'deki `dashboard` loader'ı bu dosyaya işaret edecek şekilde güncellenir.
**Bitti kriteri:** `/admin` ana sayfası mock verilerle dashboard kartlarını gösterir.

### Kademe 5 — UsersPage + MovementsPage
**Ön koşul:** Kademe 3
**Kapsam:**
- `public/admin/ts/pages/UsersPage.ts` — `GET /api/v1/users`, admin tablo UI (PWA
  `UsersPage.ts`'teki API çağrıları/CRUD mantığı referans, render admin layout'a göre).
- `public/admin/ts/pages/MovementsPage.ts` — `GET /api/v1/attendance`.
- `moduleRegistry.ts`'de ilgili loader'lar güncellenir.
**Bitti kriteri:** `/admin/users` ve `/admin/movements` gerçek API verisiyle tablo gösterir,
PWA tarafındaki ilgili sayfalarda regresyon yok (ayrı dosyalar, ortak kod sadece `core/`'dan).

### Kademe 6 — LeavesPage + OvertimePage + ApprovalsPage
**Ön koşul:** Kademe 3 (Kademe 5 ile paralel yapılabilir)
**Kapsam:**
- `public/admin/ts/pages/LeavesPage.ts` — `GET /api/v1/leaves`.
- `public/admin/ts/pages/OvertimePage.ts` — `GET /api/v1/overtime`.
- `public/admin/ts/pages/ApprovalsPage.ts` — `GET /api/v1/leaves` + `/api/v1/overtime`
  (pending filtre), onay/red aksiyonları.
- `moduleRegistry.ts` güncellenir.
**Bitti kriteri:** Üç route da gerçek veriyle çalışır, onay/red aksiyonları PWA'daki
`ApprovalsPage` ile aynı endpoint'leri kullanır.

### Kademe 7 — ReportsPage + HolidaysPage
**Ön koşul:** Kademe 3
**Kapsam:**
- `public/admin/ts/pages/ReportsPage.ts` — `ExcelService` üzerinden `/api/v1/reports`
  (sadece UI, indirme tetikleme).
- `public/admin/ts/pages/HolidaysPage.ts` — `GET /api/v1/holidays`.
- `moduleRegistry.ts` güncellenir.
**Bitti kriteri:** Rapor indirme butonu dosya indirir; tatil günleri listesi gerçek veriyle
gösterilir.

### Kademe 8 — SettingsPage + AppearanceTweaks ("Görünüm" sekmesi)
**Ön koşul:** Kademe 3
**Kapsam:**
- `public/admin/ts/pages/SettingsPage.ts` — `GET/PUT /api/v1/settings` (ofis IP, vardiya,
  mola kuralları — PWA `SettingsPage.ts` referans).
- `public/admin/ts/tweaks/AppearanceTweaks.ts` — `admin-panel-preview/js/tweaks.js`'in TS
  portu, `localStorage` tabanlı (tema/yoğunluk/köşe/accent/sidebar/motion/shadow/tint/glow/
  ui-scale/font), "Görünüm" sekmesi olarak `SettingsPage` içine entegre edilir.
- `moduleRegistry.ts` güncellenir.
**Bitti kriteri:** Ayarlar formu mevcut API ile okur/yazar; Görünüm sekmesindeki ayarlar
`<html>` üzerinde `data-*` attribute'ları olarak uygulanır ve `localStorage`'da kalıcı.

### Kademe 9 — AuditLogPage + Backend Audit Endpoint
**Ön koşul:** Kademe 3
**Kapsam:**
- Backend: `routes/v1/admin/audit.ts` (`requirePermission('audit:view')`,
  `audit_log` tablosundan filtreli + sayfalı okuma) + `AuditRepository.findPage()`.
- `server.ts`: `app.use('/api/v1/admin', adminRoute)`.
- `public/admin/ts/pages/AuditLogPage.ts` — filtre formu (actor/action/tarih aralığı) +
  sayfalı tablo, yeni endpoint'e bağlı.
- `moduleRegistry.ts` güncellenir.
**Bitti kriteri:** `/admin/audit` filtrelenebilir, sayfalanabilir gerçek audit log verisi
gösterir.

### Kademe 10 — NotificationsPage + AdminTopBar Bildirim Paneli
**Ön koşul:** Kademe 2 + 3
**Kapsam:**
- `public/admin/ts/pages/NotificationsPage.ts` — PWA `NotificationsPage.ts`/
  `NotificationPanel.ts` deseninin admin portu, `GET /api/v1/notifications`.
- `AdminTopBar.ts`'deki bildirim ikonu bu panele bağlanır (Kademe 2'de iskelet, burada
  gerçek veri).
**Bitti kriteri:** Topbar bildirim ikonu gerçek bildirim sayısını/listesini gösterir.

### Kademe 11 — Dashboard Backend Bağlama
**Ön koşul:** Kademe 4 + Kademe 9 (audit router zaten varsa aynı router'a eklenebilir)
**Kapsam:**
- `routes/v1/admin/dashboard.ts` (`requirePermission('dashboard:view')`) — bugünkü
  giriş/çıkış sayısı, bekleyen onay sayısı, izinli personel, son N aktivite (mevcut
  repository'lerden `COUNT`/`LIMIT`).
- `DashboardPage.ts` mock veriden bu endpoint'e geçirilir.
**Bitti kriteri:** `/admin` dashboard kartları gerçek, canlı verilerle güncellenir.

### Kademe 12 — Temizlik
**Ön koşul:** Kademe 1-11 tamamlandı, `/admin` tüm modülleriyle çalışıyor
**Kapsam:**
- `admin-panel-preview/` klasörü silinir (içeriği `public/admin/`'e taşındı/yeniden yazıldı).
- RBAC (`003_rbac.sql`, DB-backed `requirePermission`) — ADMIN-PANEL.md Bölüm 3, bu plandan
  bağımsız ayrı bir iş olarak ele alınabilir (admin paneli "tam yetkili admin" varsayımıyla
  zaten çalışır).
**Bitti kriteri:** Repo'da admin'e ait kod sadece `public/admin/` + ilgili `routes/v1/admin/*`
altında; preview klasörü yok.

---

## 9. Kademe Bağımlılık Özeti

```
1 (iskelet) → 2 (layout) → 3 (entry/build/server, /admin canlanır)
                                  │
        ┌──────────┬──────────┬──┴───────┬──────────┬───────────┐
        4(dash-mock) 5(users/mov) 6(leaves/ot/appr) 7(reports/hol) 8(settings) 9(audit)
                                                                              │
                                                                      10(notifications, ön koşul 2+3)
                                                                              │
                                                              11(dashboard backend, ön koşul 4+9)
                                                                              │
                                                                      12(temizlik)
```

4-9 arası kademeler birbirinden bağımsız, paralel/farklı sıralarda yapılabilir — tek ortak
ön koşulları Kademe 3'ün tamamlanmış olmasıdır.

---

*Plan tarihi: 2026-06-14*
