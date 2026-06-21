# Admin / İK Paneli — Mimari Plan (3. Panel)

> Bu belge bir plan dosyasıdır. Uygulamaya geçmeden önce onaylanacaktır.
> İlgili dosyalar: [MIMARI.md](../MIMARI.md), [GELISTIRME.md](../GELISTIRME.md), [ROOT-PANEL.md](../ROOT-PANEL.md)

---

## 1. Panel Nereye Oturuyor?

3 panel net ayrılmalı:

```
Son Kullanıcı PWA   → /            → personel, takim_lideri, mudur (mevcut, bottom-nav, mobil-first)
Admin/İK Paneli     → /admin       → şirket admin'i + ileride özel roller (sidebar, desktop-first)  ← BU PLAN
Root Panel          → ayrı app/port → sistem sahibi (Kademe 4, ROOT-PANEL.md'de tarifli)
```

**Admin paneli ayrı bir uygulama OLMAMALI.** Aynı backend (`server.ts`, aynı `routes/v1/*`, aynı middleware, aynı DB) — sadece:

- Ayrı bir **frontend bundle/giriş noktası** (`/admin` altında, sidebar layout, tablo-ağırlıklı UI)
- Gerekli yerlerde **admin'e özel ek route'lar** (`routes/v1/admin/*` — dashboard istatistikleri, audit log görüntüleme, toplu işlemler gibi normal kullanıcı API'lerinde olmayan şeyler)

**Neden ayrı app değil:** Auth, tenant izolasyonu (`company_id`), JWT, audit log, repository/service katmanı zaten var ve çalışıyor. Root panelin aksine (IP kısıtlı, internete kapalı), admin paneli internete açık olmalı — İK her yerden erişmeli. Bu ikisi farklı güvenlik sınıfı, aynı kategori değil.

---

## 2. Modülerlik — "Modül Kayıt Sistemi" (Çekirdek Fikir)

İleride modül eklenip çıkarılabilmesi şu mekanizmayla sağlanır: **tek bir modül registry'si**. Her modül kendi route'unu, sayfasını, ikonunu ve **gerekli izin anahtarını** tanımlar. Sidebar ve router bu registry'den otomatik üretilir.

```typescript
// public/ts/admin/moduleRegistry.ts
export interface AdminModule {
  id: string;
  label: string;
  icon: string;
  path: string;                 // '/admin/users'
  permission: string;           // 'user:manage' — yoksa menüde görünmez
  loader: () => Promise<{ default: typeof BasePage }>;
  group: 'operasyon' | 'insan-kaynaklari' | 'ayarlar' | 'sistem';
}

export const ADMIN_MODULES: AdminModule[] = [
  { id: 'dashboard',  label: 'Genel Bakış',  icon: 'home',    path: '/admin',           permission: 'dashboard:view',   group: 'operasyon',       loader: () => import('./pages/DashboardPage.js') },
  { id: 'users',      label: 'Personel',     icon: 'users',   path: '/admin/users',     permission: 'user:manage',      group: 'insan-kaynaklari',loader: () => import('./pages/UsersPage.js') },
  { id: 'attendance', label: 'Hareketler',   icon: 'clock',   path: '/admin/movements', permission: 'attendance:view',  group: 'operasyon',       loader: () => import('./pages/MovementsPage.js') },
  { id: 'leaves',     label: 'İzinler',      icon: 'calendar',path: '/admin/leaves',    permission: 'leave:view',       group: 'insan-kaynaklari',loader: () => import('./pages/LeavesPage.js') },
  { id: 'overtime',   label: 'Mesai',        icon: 'zap',     path: '/admin/overtime',  permission: 'overtime:view',    group: 'insan-kaynaklari',loader: () => import('./pages/OvertimePage.js') },
  { id: 'approvals',  label: 'Onaylar',      icon: 'check',   path: '/admin/approvals', permission: 'leave:approve',    group: 'operasyon',       loader: () => import('./pages/ApprovalsPage.js') },
  { id: 'reports',    label: 'Raporlar',     icon: 'file',    path: '/admin/reports',   permission: 'reports:view',     group: 'insan-kaynaklari',loader: () => import('./pages/ReportsPage.js') },
  { id: 'holidays',   label: 'Tatil Günleri',icon: 'sun',     path: '/admin/holidays',  permission: 'settings:view',    group: 'ayarlar',         loader: () => import('./pages/HolidaysPage.js') },
  { id: 'audit',      label: 'Aktivite Geçmişi', icon: 'list',path: '/admin/audit',     permission: 'audit:view',       group: 'sistem',          loader: () => import('./pages/AuditLogPage.js') },
  { id: 'settings',   label: 'Şirket Ayarları', icon: 'cog',  path: '/admin/settings',  permission: 'settings:manage',  group: 'ayarlar',         loader: () => import('./pages/SettingsPage.js') },

  // ── İleride eklenecek, sadece registry'e satır eklenir ──
  // { id: 'branches', label: 'Şubeler', permission: 'branch:manage', ... }   ← Kademe 1
  // { id: 'roles',    label: 'Rol & Yetki', permission: 'role:manage', ... } ← Kademe 2
  // { id: 'company',  label: 'Plan & Faturalama', permission: 'billing:manage', ... } ← Kademe 3
];
```

**Yeni modül eklemek** = registry'e 1 satır + sayfa dosyası. **Çıkarmak** = registry'den satırı sil. Sidebar, router, izin kontrolü hepsi otomatik. Mevcut `Router.ts` / `BasePage` / `ApiClient` altyapısı zaten bu deseni destekliyor — sadece admin'e özgü bir `app-admin.ts` entry point + `AdminLayout` (sidebar) eklenir.

### Klasör Yapısı

```
public/ts/
  app.ts              ← mevcut, son kullanıcı PWA
  admin/
    app-admin.ts      ← admin giriş noktası
    moduleRegistry.ts
    layout/
      AdminLayout.ts  ← sidebar + topbar
      Sidebar.ts      ← ADMIN_MODULES'den otomatik üretir, izinsiz olanı gizler
    pages/
      DashboardPage.ts
      UsersPage.ts    ← mevcut UsersPage'i extend/yeniden kullan
      ...
```

`build.ts`'e ikinci entry point eklenir:

```typescript
entryPoints: ['public/ts/app.ts', 'public/ts/admin/app-admin.ts'],
```

`server.ts`'de `/admin/*` → `public/admin.html` servis edilir (SPA catch-all'un admin versiyonu).

---

## 3. Yetki Sistemi — Dinamik RBAC'a Geçiş (Kademe 2'nin Çekirdeğini Öne Çekmek)

Şu anki `middleware/roles.ts` statik bir `Record<string, Set<string>>`. Admin panelinde "Rol & Yetki" modülü olacaksa, bu **DB tabanlı** olmalı. Kademe 2'nin tamamını şimdi yapmadan, **şemayı şimdi kurup statik map'i DB'den okuyan bir katmana sarmak** önerilir. Böylece admin paneli ilk günden RBAC-ready olur, ama UI'sı (Rol Yönetimi sayfası) Kademe 2'de eklenir.

### Yeni Tablolar (migration `003_rbac.sql`)

```sql
-- İzin tanımları — sabit katalog, kod tarafında da referans alınır
CREATE TABLE IF NOT EXISTS permissions (
  id          SERIAL PRIMARY KEY,
  key         VARCHAR(50) UNIQUE NOT NULL,   -- 'user:manage', 'leave:approve'
  module      VARCHAR(30) NOT NULL,          -- 'users','leaves','settings'...
  label       VARCHAR(100) NOT NULL          -- "Personel Yönetimi"
);

-- Roller — sistem rolleri (company_id NULL) + şirkete özel roller
CREATE TABLE IF NOT EXISTS roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES companies(id) ON DELETE CASCADE,  -- NULL = sistem rolü
  name        VARCHAR(50) NOT NULL,          -- 'admin','mudur', veya 'muhasebe_muduru'
  label       VARCHAR(100) NOT NULL,
  is_system   BOOLEAN DEFAULT false,         -- sistem rolleri silinemez
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT  REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- users.role enum'u kalsın (geriye uyumluluk + UI gruplaması),
-- ama özel rol ataması için opsiyonel FK eklenir
ALTER TABLE users ADD COLUMN custom_role_id UUID REFERENCES roles(id) ON DELETE SET NULL;
```

### Geçiş Stratejisi

1. `permissions` tablosuna mevcut tüm izin anahtarlarını seed et (`user:view`, `leave:approve`, vb. — zaten `middleware/roles.ts`'de listeli).
2. `roles` tablosuna 4 sistem rolünü (`admin`, `mudur`, `takim_lideri`, `personel`) `is_system=true, company_id=NULL` olarak seed et.
3. `role_permissions`'ı mevcut `ROLE_PERMISSIONS` map'i ile doldur.
4. `middleware/roles.ts` → `requirePermission()` artık şunu yapar:
   - `user.custom_role_id` varsa → o role'ün `role_permissions`'ına bak
   - yoksa → `user.role` adına eşleşen sistem rolüne bak
   - Sonuç **cache'lenir** (rol değişmeden sorgu tekrarlanmaz)

```typescript
// middleware/roles.ts — yeni hali
export function requirePermission(permission: string) {
  return async (req, res, next) => {
    const perms = await permissionCache.getForUser(req.user); // DB'den, cache'li
    if (perms.has('*') || perms.has(permission)) return next();
    next(new AppError('Bu işlem için yetkiniz yok', 403));
  };
}
```

Bu değişiklik **API davranışını değiştirmez** (aynı izinler, aynı sonuç) — sadece kaynağı koddan DB'ye taşır. Admin paneli "Rol & Yetki" modülü geldiğinde (Kademe 2), sadece `roles` / `role_permissions` üzerinde CRUD yapan bir sayfa eklenir, **middleware'e dokunulmaz**.

### V1 Yetki Stratejisi — "Tam Yetkili Hesap" ile Başlangıç

İnce taneli izin UI'sı (kimin neyi görüp göremeyeceği) Kademe 2'ye kadar bekleyebilir. V1'de admin paneli şu şekilde çalışır:

- `roles` tablosunda `admin` sistem rolü `role_permissions` üzerinden **tüm** `permissions` kayıtlarına sahip olur (ya da kısayol olarak `permissions.has('*')` özel değeri — kod tarafında zaten destekleniyor).
- Admin paneline giriş **sadece `role = 'admin'`** (veya `custom_role_id` → tam yetkili rol) ile yapılır. `mudur` / `takim_lideri` gibi roller şimdilik admin paneline erişemez — onlar PWA'dan onaylama/görüntüleme yapmaya devam eder.
- Sidebar/registry'deki `permission` alanları **zaten yazılır** (bkz. Bölüm 2), ama V1'de admin için her zaman `true` döner — yani tüm modüller görünür. Kod değişmeden, sadece `role_permissions` verisi değiştiğinde davranış değişir.
- Sonuç: RBAC şeması, `requirePermission()` middleware'i ve sidebar'ın izin-bazlı render mantığı **gün 1'de canlı**, ama "kim neyi göremez" sorusu henüz kısıtlanmamış — sadece tek bir tam yetkili hesapla yönetiliyor.

**Sonraki adım (talebe göre, Kademe 2'den önce de yapılabilir):**
1. Şirkete özel roller oluşturulur (`company_id` dolu, örn. "İK Uzmanı", "Şube Müdürü").
2. Bu rollere `role_permissions` üzerinden **alt küme** izinler atanır (örn. `user:view` var ama `user:manage` yok → personeli görür, düzenleyemez).
3. Admin paneli sidebar'ı bu kullanıcılar için otomatik daralır — registry zaten `permission` kontrolü yapıyor, ekstra kod gerekmez.
4. `users.custom_role_id` ile bu kullanıcılara rol atanır.

Yani DB ve middleware **ilk günden RBAC'a hazır**; "kim neyi görür/göremez" ayarı ileride sadece **veri** (rol + izin eşlemesi) değişikliği ile yapılır, kod/şema değişikliği gerekmez.

---

## 4. Admin Paneli Modülleri (V1 — Mevcut Servislerle Hemen Yapılabilir)

| Modül | Kaynak | Yeni Backend İhtiyacı |
|---|---|---|
| **Genel Bakış (Dashboard)** | Yeni | `GET /api/v1/admin/dashboard` — bugün giriş/çıkış sayısı, bekleyen onay sayısı, izinli personel, son aktiviteler |
| **Personel Yönetimi** | `UsersPage` zaten var | Yok — mevcut `/api/v1/users` yeterli |
| **Hareketler** | `MovementsPage` zaten var | Yok |
| **İzin/Mesai Yönetimi** | `LeavesPage`, `OvertimePage`, `ApprovalsPage` var | Yok |
| **Raporlar (Excel)** | `ExcelService` var | Yok, sadece UI |
| **Tatil Günleri** | `HolidayRepository` var | Yok |
| **Şirket Ayarları** | `SettingsPage` var | Yok |
| **Aktivite Geçmişi (Audit Log)** | `audit_log` tablosu var ama **görüntüleme endpoint'i yok** | `GET /api/v1/admin/audit-log` (filtreli, sayfalı) |

V1 admin paneli için backend'de tek gerçek yeni iş: `routes/v1/admin/dashboard.ts` ve `routes/v1/admin/audit.ts` (+ ufak repository metodları). Geri kalanı **mevcut sayfaların admin layout'una taşınması/yeniden kullanılması**.

---

## 5. Aşamalı Yol Haritası (Mevcut Kademe Tablosuna Entegrasyon)

```
Yeni Kademe: "0g — Admin Paneli v1"   (1.5-2 hafta, Kademe 0f'den sonra, Kademe 1'den önce)

  1. db/migrations/003_rbac.sql (permissions, roles, role_permissions, custom_role_id) + seed
     → admin sistem rolüne TÜM izinler atanır (tam yetkili hesap)
  2. middleware/roles.ts → DB-backed requirePermission (cache'li), davranış aynı kalır
  3. routes/v1/admin/dashboard.ts + AuditRepository.findPage()
  4. public/ts/admin/ (AdminLayout, Sidebar, moduleRegistry, app-admin.ts)
  5. build.ts → ikinci entry point, server.ts → /admin/* statik servis
  6. Mevcut sayfaları admin layout altında yeniden kullan (Users, Leaves, Movements, Settings...)
  7. AuditLogPage.ts (yeni)
  8. DashboardPage.ts (yeni)

Kademe 1 (Şubeler) — değişmeden devam:
  - BranchesPage admin paneline modül olarak eklenir (registry'e 1 satır)

Kademe 2 (RBAC UI) — artık küçülür çünkü şema + middleware Kademe 0g'de hazır:
  - Sadece RolesPage.ts (admin panelinde "Rol & Yetki" modülü) eklenir
  - Personel formuna "özel rol" dropdown'u

Kademe 4 (Root Panel) — değişmeden, ayrı uygulama olarak kalır
```

---

## 6. Preview Karşılaştırması — `admin-panel-preview/` Analizi

`admin-panel-preview/` (statik HTML/CSS/vanilla-JS tasarım prototipi) ile bu plan **modül kapsamı açısından ~%90 örtüşüyor**: registry'deki 10 V1 modülü + 3 kilitli "ileride" modülü (Şubeler/Rol&Yetki/Plan&Faturalama), grup adları (Operasyon / İnsan Kaynakları / Ayarlar / Sistem) ve `permission` anahtarları (`dashboard:view`, `user:manage`, `leave:approve`, vb.) birebir eşleşiyor. Buna karşın **implementasyon düzeyinde örtüşme ~%0** — preview tamamen mock-data üzerinde çalışan statik bir kabuk; `BasePage`/`Router`/`ApiClient`/`StateManager` kullanmıyor, TypeScript değil.

### 6.1 Eksikler (preview → gerçek koda taşınırken eklenmesi gerekenler)

| # | Eksik | Nerede ele alınacak |
|---|---|---|
| 1 | `public/ts/admin/` altında TS giriş noktası, layout, registry, sayfa sınıfları yok | Bölüm 7 |
| 2 | Sayfalar `BasePage`'i extend etmiyor, kendi hash-router'ını kullanıyor | Bölüm 7.3 |
| 3 | Tüm veri mock dizilerden geliyor (`USERS`, `MOVEMENTS`, `LEAVES`, `NOTIFICATIONS`...) — gerçek `ApiClient` çağrısı yok | Bölüm 7.3 |
| 4 | `GET /api/v1/admin/dashboard` endpoint'i yok | Bölüm 7.6 |
| 5 | `GET /api/v1/admin/audit-log` endpoint'i yok (audit_log tablosu var, okuma endpoint'i yok) | Bölüm 7.6 |
| 6 | `build.ts`'de admin için 2. entry point yok | Bölüm 7.4 |
| 7 | `server.ts`'de `/admin/*` route'u yok (şu an `*` catch-all sadece `public/index.html` döndürüyor) | Bölüm 7.4 |
| 8 | Permission alanları sadece görsel etiket — `requirePermission()` ile bağlı değil, sidebar gerçek role göre filtrelenmiyor | V1'de "tam yetkili admin" varsayımıyla bilinçli olarak ertelendi (Bölüm 3) |
| 9 | Bildirim sistemi (`admin-panel-preview`'a eklendi) bu plan dosyasında hiç tanımlı değildi — backend tarafı PWA'daki `notificationsRoute` ile aynı, admin'e özel ek backend gerekmiyor | Bölüm 7.3 (NotificationsPage portu) |
| 10 | "Tweaks / Görsel Ayarlar" cockpit'i bu plandışı — kalıcı konumu belirsiz | Bölüm 6.2 |

### 6.2 Fazlalık: "Tweaks / Görsel Ayarlar"

Preview'a eklenen tema/yoğunluk/köşe/accent/sidebar/motion/shadow/tint/glow/ui-scale/font cockpit'i bu MD'de tanımlı değildi. Kullanıcı bunu **ileride Root Panel'e taşımayı** planlıyor (sistem geneli marka/görünüm varsayılanları, Kademe 4 — `ROOT-PANEL.md`). V1 için karar:

- Şimdilik **"Şirket Ayarları" (`settings`) modülü içine "Görünüm" sekmesi** olarak taşınır, `localStorage` tabanlı çalışır (preview'daki `tweaks.js` mantığı aynen — `data-*` attribute'ları `<html>` üzerinde).
- Kalıcılık katmanı **company-scoped** değil, **kullanıcı/tarayıcı-scoped** kalır (V1'de DB'ye yazılmaz) — Root Panel'e taşınırken `companies` tablosuna `ui_theme JSONB` gibi bir alan eklenip admin tarafı sadece "varsayılanı oku" moduna geçirilir.
- Bu nedenle `AppearanceTweaks` kodu **kendi modülü** olarak izole yazılır (`public/ts/admin/tweaks/`) — Root Panel'e taşınması "dosyayı kopyala + kalıcılık katmanını DB'ye bağla" kadar basit olsun.

---

## 7. Giydirme Kılavuzu — Preview'dan `public/ts/admin/`'e Port

### 7.1 Mimari Kararlar

- **TS + class mimarisi**: Her sayfa `BasePage`'i extend eder (PWA tarafındaki gibi). Preview'daki `PAGES.xxx = () => "html string"` fonksiyonları → `AdminXxxPage extends BasePage { async render() { ... } }`.
- **Alpine.js**: Mevcut PWA'da `Alpine.start()` zaten global olarak çalışıyor (`app.ts`). Admin tarafında da aynı global Alpine kullanılır — özellikle **deklaratif, lokal UI durumu** gereken yerlerde (dropdown açık/kapalı, tab seçimi, filtre formu, modal state) `x-data`/`x-show`/`x-model` kullanılır; preview'daki elle `classList`/`style` manipülasyonu yerine. Liste/tablo render'ı (büyük veri) gibi yerlerde Alpine değil, `BasePage` + doğrudan DOM/template string tercih edilir (PWA'daki `UsersPage`/`LeavesPage` deseniyle aynı).
- **Modülerlik**: `ADMIN_MODULES` registry tek doğruluk kaynağı. Sidebar, router ve (ileride) izin filtresi bu diziden üretilir — preview'daki `SIDEBAR` grupları registry'ye 1:1 taşınır.
- **Bağlama**: Admin paneli **ayrı uygulama değil** — aynı `ApiClient`, `StateManager`, `EventBus`, mevcut `/api/v1/*` route'larına bağlanır. Sadece ayrı bir bundle/giriş noktası (`/admin`).
- **Çalışma alanı**: Yeni kod `public/ts/admin/` altında, CSS `public/css/admin.css` altında izole edilir (mevcut `style.css`/`components.css`'teki CSS custom property'leri — `--accent`, `--bg-card`, `--radius-md` vb. — **aynı isimlerle** yeniden kullanılır ki Tweaks cockpit'i ileride hem PWA hem admin'de tutarlı çalışsın).

### 7.2 Klasör/Dosya Planı

```
public/
  admin.html                      ← yeni — index.html'in admin kabuğu (id="admin-app" vb.)
  css/
    admin.css                     ← preview'daki admin.css buraya taşınır (variable'lar components.css ile uyumlu)
  ts/
    admin/
      app-admin.ts                ← giriş noktası (app.ts'in admin eşleniği)
      moduleRegistry.ts           ← ADMIN_MODULES (Bölüm 2)
      layout/
        AdminLayout.ts            ← sidebar + topbar shell, class
        Sidebar.ts                ← registry'den otomatik üretim, collapse/rail durumu
        AdminTopBar.ts            ← TopBar.ts + NotificationPanel.ts deseninin admin sürümü
      pages/
        DashboardPage.ts
        UsersPage.ts               ← PWA'daki UsersPage'i extend/yeniden kullan
        MovementsPage.ts
        LeavesPage.ts
        OvertimePage.ts
        ApprovalsPage.ts
        ReportsPage.ts
        HolidaysPage.ts
        SettingsPage.ts           ← + "Görünüm" sekmesi (Tweaks)
        AuditLogPage.ts            ← yeni
        NotificationsPage.ts       ← PWA'dakiyle aynı desen, admin layout'a bağlı
      tweaks/
        AppearanceTweaks.ts        ← preview'daki tweaks.js TS portu (localStorage)
```

### 7.3 Sayfa Portu — Sıra ve Eşleme

Her satır: preview `PAGES.xxx` → `AdminXxxPage`. Veri kaynağı sütunu hangi `ApiClient` çağrısının mock diziyi değiştireceğini gösterir.

| Sıra | Modül (id) | Yeni dosya | Veri kaynağı | Not |
|---|---|---|---|---|
| 1 | `dashboard` | `DashboardPage.ts` | `GET /api/v1/admin/dashboard` (yeni) | İlk port edilecek — registry/layout/router'ı test eder |
| 2 | `users` | `UsersPage.ts` | mevcut `GET /api/v1/users` | PWA'daki `UsersPage.ts` admin layout altında yeniden kullanılabilir (route farkı dışında değişiklik az) |
| 3 | `movements` | `MovementsPage.ts` | mevcut `GET /api/v1/attendance` | PWA'daki ile aynı |
| 4 | `approvals` | `ApprovalsPage.ts` | mevcut `GET /api/v1/leaves`, `/api/v1/overtime` (pending) | PWA'daki ile aynı |
| 5 | `leaves` | `LeavesPage.ts` | mevcut `GET /api/v1/leaves` | PWA'daki ile aynı |
| 6 | `overtime` | `OvertimePage.ts` | mevcut `GET /api/v1/overtime` | PWA'daki ile aynı |
| 7 | `reports` | `ReportsPage.ts` | mevcut `ExcelService` üzerinden `/api/v1/reports` | Sadece UI |
| 8 | `holidays` | `HolidaysPage.ts` | mevcut `GET /api/v1/holidays` | — |
| 9 | `settings` + Tweaks | `SettingsPage.ts` + `tweaks/AppearanceTweaks.ts` | mevcut `GET/PUT /api/v1/settings` + `localStorage` | "Görünüm" sekmesi Tweaks cockpit'ini barındırır |
| 10 | `audit` | `AuditLogPage.ts` | `GET /api/v1/admin/audit-log` (yeni) | Filtreli + sayfalı |
| 11 | bildirimler | `NotificationsPage.ts` + `AdminTopBar`'daki panel | mevcut `GET /api/v1/notifications` | PWA'daki `NotificationPanel.ts`/`NotificationsPage.ts` deseni birebir taşınır |
| — | `branches`/`roles`/`billing` | — | — | Preview'daki kilitli kart aynen kalır (Kademe 1/2/3) |

### 7.4 `build.ts` / `server.ts` Değişiklikleri

```typescript
// build.ts
entryPoints: ['public/ts/app.ts', 'public/ts/admin/app-admin.ts'],
```

```typescript
// server.ts — SPA catch-all'dan ÖNCE eklenir
app.get(/^\/admin(\/.*)?$/, (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin.html'));
});
```

`public/admin.html`, `public/index.html`'in kopyası olur ama `#app` yerine `#admin-app`, `<script src="/js/app-admin.js">` ve `css/admin.css` referansı taşır. `manifest.json`/SW kapsamı PWA ile çakışmasın diye admin için ayrı bir `<link rel="manifest">` gerekmez (admin masaüstü, PWA değil).

### 7.5 Yeni Backend İhtiyaçları (V1 için minimum)

- `routes/v1/admin/dashboard.ts` → `requirePermission('dashboard:view')`, bugünkü giriş/çıkış sayısı, bekleyen onay sayısı, izinli personel sayısı, son N aktivite (mevcut repository'lerden `COUNT`/`LIMIT` sorguları).
- `routes/v1/admin/audit.ts` → `requirePermission('audit:view')`, `audit_log` tablosundan filtreli (`actor`, `action`, `date range`) + sayfalı (`limit`/`offset`) okuma. `AuditRepository.findPage()` eklenir.
- Her iki route `server.ts`'e `app.use('/api/v1/admin', adminRoute)` şeklinde tek router altında toplanabilir.

### 7.6 Uygulama Sırası (Özet Checklist)

1. `public/css/admin.css` taşı + değişken adlarını `components.css` ile hizala
2. `moduleRegistry.ts` — preview `SIDEBAR` → `ADMIN_MODULES`
3. `AdminLayout.ts`, `Sidebar.ts`, `AdminTopBar.ts` (+ bildirim paneli portu)
4. `app-admin.ts` + `public/admin.html` + `build.ts`/`server.ts` değişiklikleri → boş layout ayağa kalkmalı
5. `DashboardPage.ts` (mock veriyle, sonra `GET /api/v1/admin/dashboard` hazır olunca bağlanır)
6. Tablo sayfaları (Users/Movements/Leaves/Overtime/Approvals/Reports/Holidays) — gerçek API'lere bağlı, PWA sayfalarından yeniden kullanım
7. `SettingsPage.ts` + `tweaks/AppearanceTweaks.ts` ("Görünüm" sekmesi)
8. `AuditLogPage.ts` + backend `routes/v1/admin/audit.ts`
9. `NotificationsPage.ts` + `AdminTopBar` bildirim paneli (PWA deseninden port)
10. `DashboardPage.ts`'i gerçek `routes/v1/admin/dashboard.ts`'e bağla

---

## 8. Klasör Yapısı Kararı — `public/admin/` (Detaylı Plan: ADMIN-PANEL-PORT-PLAN.md)

Bölüm 7'deki dosya planı revize edildi: admin'e ait **tüm frontend dosyaları**
(`index.html`, `css/`, `ts/`, derlenmiş `js/`) `public/` kökünde dağınık değil,
**tek bir `public/admin/` alt-ağacında** toplanır — kendi içinde tutarlı bir "iç proje" gibi:

```
public/admin/
  index.html
  css/admin.css
  ts/ (app-admin.ts, moduleRegistry.ts, layout/, pages/, tweaks/)
  js/  ← build çıktısı
```

- `express.static('public')` bunu otomatik `/admin/...` olarak servis eder.
- Backend/API/auth/DB **ayrılmaz** — admin sayfaları `public/ts/core/*` (BasePage, ApiClient,
  StateManager, Router, EventBus) üzerinden paylaşılan altyapıyı import eder.
- Detaylı klasör ağacı, `build.ts`/`server.ts` değişiklikleri, modül registry tanımı,
  sayfa port sırası ve checklist: **[ADMIN-PANEL-PORT-PLAN.md](ADMIN-PANEL-PORT-PLAN.md)**.

---

## Özet — Neden Bu Yapı Doğru

- **Modüler**: Yeni modül = registry'e 1 satır + 1 sayfa dosyası. Kaldırmak = 1 satır silmek.
- **İleriye dönük**: RBAC şeması Kademe 2'den önce devreye girer ama API/middleware davranışını bozmaz; Kademe 2 sadece UI ekler.
- **Tek backend, tek DB**: Audit log, tenant izolasyonu, auth — hepsi zaten var, tekrar yazılmaz.
- **İK/Admin kullanımı**: Sidebar + tablo ağırlıklı desktop UI, ama aynı `BasePage`/`ApiClient`/`StateManager` çekirdeğini kullanır — iki ayrı kod tabanı değil, iki "yüz".

---

*Plan tarihi: 2026-06-12*
