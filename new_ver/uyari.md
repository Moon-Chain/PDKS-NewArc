# PDKS-new — Mimari Uyarılar ve Teknik Borç Raporu

> Hazırlanma: 2026-06-17  
> Kapsam: `public/ts/` (PWA) + `public/admin/ts/` (Admin Panel)  
> Amaç: Projenin büyümesi sırasında sorun çıkarabilecek noktalara önceden dikkat çekmek.

---

## 1. Alpine.js Nerede Var, Nerede Yok?

### PWA — `public/ts/` → Alpine.js KULLANIYOR

Aşağıdaki 10 sayfa dosyası + `app.ts` Alpine import eder:

| Dosya | Alpine.data adı |
|-------|----------------|
| `app.ts` | `Alpine.start()` burada çağrılır |
| `pages/HomePage.ts` | `homePage` |
| `pages/LeavesPage.ts` | `leavesPage` |
| `pages/MovementsPage.ts` | `movementsPage` |
| `pages/UsersPage.ts` | `usersPage` |
| `pages/ApprovalsPage.ts` | `approvalsPage` |
| `pages/ProfilePage.ts` | `profilePage` |
| `pages/SettingsPage.ts` | `settingsPage` |
| `pages/LoginPage.ts` | `loginPage` |
| `pages/NotificationsPage.ts` | `notificationsPage` |
| `pages/QRDisplayPage.ts` | `qrDisplayPage` |

**Çalışma şekli:** Her sayfa `BasePage.render()` içinde `this.container.innerHTML = \`...\`` ile büyük bir HTML string üretir, bu string `x-data="sayfaAdi()"` direktifi içerir. Alpine'ın MutationObserver'ı DOM'daki değişikliği yakalayıp reaktiviteyi aktive eder.

### Admin Panel — `public/admin/ts/` → Alpine.js YOK

Admin panel tamamen **saf TypeScript + vanilla DOM** üzerine kurulu:
- `adminUi.ts` → `toast()`, `openModal()`, `cellUser()`, `paginationControls()`, `bindPagination()` helper fonksiyonları
- Sayfalar `BasePage` extends eder, `render()` HTML string üretir, event listener'lar `this.on(...)` veya `el.addEventListener(...)` ile manuel bağlanır
- Alpine bağımlılığı sıfır — admin bundle'a Alpine dahil edilmemiş

**Sonuç:** Admin panel ve PWA, aynı `BasePage` / `Router` / `StateManager` / `ApiClient` çekirdeğini paylaşır ama reaktivite katmanı tamamen farklıdır. Bu kasıtlı bir ayrım olup yerindedir.

---

## 2. Mimari Uyarılar

### 2.1 Tip Güvenliği Delikleri (Orta Risk)

**Sorun:** Alpine direktiflerinin içindeki expression'lar TypeScript tarafından görülmez.

```ts
// LeavesPage.ts — bu string içindeki "row.user_name" TypeScript'e kapalı
`<p x-text="row.user_name"></p>`
```

`LeaveRow` interface'inde `user_name` → `userName` gibi bir rename yapılırsa:
- TypeScript **hata vermez**
- Uygulama **sessizce boş string** gösterir
- Hatayı ancak manuel test veya runtime'da fark edersin

**Büyüdükçe ne olur:** Interface'ler değiştikçe, Alpine expression'larını takip etmek manuel dikkat gerektirir. 20+ sayfa olunca bu yük ciddi artar.

**Önlem:** Interface değişikliklerinde Alpine expression'larını grep ile taramayı alışkanlık edin:
```bash
grep -r "row\.user_name\|row\.userId" public/ts/
```

---

### 2.2 Modal Paterni Ölçeklenmiyor (Yüksek Risk)

**Sorun:** Her sayfanın kendi `document.createElement` + `innerHTML` + manuel event listener modal kodu var.

```
LeavesPage.ts   → openEditModal()    (75 satır vanilla DOM)
LeavesPage.ts   → openDeleteModal()  (55 satır vanilla DOM)
UsersPage.ts    → (muhtemelen benzer)
ApprovalsPage.ts → (muhtemelen benzer)
```

Bu Alpine'ın portal/overlay desteğinin yetersiz kalmasından kaçınmak için yapılmış, anlayışlı bir karar. Ama her sayfanın kendine özgü modal mantığı vardır ve aralarında kod tekrarı büyür.

**Büyüdükçe ne olur:**
- 10. sayfada 10 farklı modal implementasyonu
- Bir modal bug'ı (örn. backdrop tıklaması çalışmıyor) 10 yerde ayrı ayrı düzeltilmesi gerekir
- Stil tutarsızlıkları kaçınılmaz olur

**Önlem — şimdi yapılabilir, Alpine gerektirmez:**

```ts
// Merkezi bir ModalManager yazın
// public/ts/core/ModalManager.ts

export class ModalManager {
  static open(opts: {
    title: string;
    body: string;        // HTML string veya render fn
    actions?: Array<{ label: string; danger?: boolean; onClick: () => void | Promise<void> }>;
    size?: 'sm' | 'md' | 'lg';
  }): { close: () => void } {
    const overlay = document.createElement('div');
    // ... tek bir implementasyon
    // tüm sayfalar bunu kullanır
  }
}
```

Mevcut `Modal.confirm()` zaten bu yönde ama editlable/form modal'lar için de genişletilmeli.

---

### 2.3 Alpine.data Global Namespace (Düşük Risk — Şimdilik)

**Sorun:** `Alpine.data('homePage', ...)`, `Alpine.data('leavesPage', ...)` tüm kayıtlar globaldir.

```ts
// app.ts
Alpine.start(); // global Alpine instance

// Herhangi bir sayfadan:
Alpine.data('homePage', () => ({ ... })); // global kayıt
```

İki geliştirici aynı ismi farklı dosyalarda kullanırsa son yüklenen override eder, hiçbir hata mesajı yoktur.

**Büyüdükçe ne olur:** Sayfa sayısı 20'ye çıkınca ad çakışması riski artar.

**Önlem:** İsimlendirme kuralı koy ve belgele:
- Kural: dosya adı = Alpine.data adı (camelCase, Page suffix ile)
- `pages/LeavesPage.ts` → `Alpine.data('leavesPage', ...)`
- Yeni sayfa ekleyen kişi bu kuralı bilmeli

---

### 2.4 İki Paralel Reaktif Sistem (Orta Risk)

**Sorun:** Alpine'ın kendi reaktivitesi + `StateManager` aynı anda çalışır.

```ts
// StateManager'dan Alpine state'e manuel köprü
async init() {
  this.profile = state.get('profile') as Profile | null;  // kopyalama!
  this.leaveBal = this.profile?.leave_balance ?? 0;
}
```

`state.set('profile', yeniProfil)` yapıldığında Alpine tarafı **otomatik güncellenmez**, sayfanın yeniden init olması ya da manuel `watch` bağlaması gerekir.

**Büyüdükçe ne olur:** Sayfalar arası state senkronizasyonu gerektiren özellikler (örn. profil güncelleme → tüm sayfalara yansıma) implementasyonu karmaşıklaşır.

**Önlem:** Sayfalar arası state için `StateManager.watch()` kullanan bir convention belirle:

```ts
// Sayfa init'inde:
async init() {
  this.profile = state.get('profile');
  // Dışarıdan güncelleme gelirse Alpine state'i de güncelle:
  const unsub = state.watch('profile', (p) => { this.profile = p as Profile; });
  this.$cleanup(() => unsub()); // Alpine 3.x cleanup hook
}
```

---

### 2.5 SSE + Event Listener Cleanup (Yüksek Risk)

**Sorun:** `HomePage.ts`'de SSE ve online/offline listener'ları module-level değişkenlerde tutuluyor.

```ts
// HomePage.ts
let _cleanups: Array<() => void> = [];  // module scope — tehlikeli!
let _cooldownTimer: ReturnType<typeof setInterval> | null = null;

// destroy() çağrılmazsa bunlar asılı kalır
destroy() {
  if (_cooldownTimer) { clearInterval(_cooldownTimer); }
  _cleanups.forEach(fn => fn());
  _cleanups = [];
  super.destroy();
}
```

`destroy()` çağrılmazsa (örn. router hızlı geçiş, hata) `_cooldownTimer` ve SSE listener'lar hafızada asmaya devam eder.

**Module-level variable ek tehlike:** Aynı sayfaya iki kez gidilirse (SPA routing) `_cleanups` dolu gelir, önceki cleanup'lar kaybolur.

**Önlem:** Module-level değişkeni instance'a taşı:

```ts
export class HomePage extends BasePage {
  private _cleanups: Array<() => void> = [];  // instance scope — güvenli
  private _cooldownTimer: ReturnType<typeof setInterval> | null = null;

  destroy() {
    if (this._cooldownTimer) clearInterval(this._cooldownTimer);
    this._cleanups.forEach(fn => fn());
    super.destroy();
  }
}
```

Bu değişiklik **kritik** ve hemen yapılabilir.

---

### 2.6 HTML String Template Bakım Yükü (Uzun Vadeli Risk)

**Sorun:** Her sayfa yüzlerce satır HTML string içerir.

```ts
this.container.innerHTML = `
  <div class="lv-page" x-data="leavesPage()" x-init="init()">
    <!-- 700 satır HTML string -->
  </div>
`;
```

- IDE'nin HTML intellisense'i çalışmaz (string içinde)
- Hatalı kapatılmış tag'lar runtime'da sessizce kırılır
- `${I_FILE}` gibi SVG inline enjeksiyonları okunabilirliği düşürür

**Önlem (şimdi değil ama ileride):** SVG'leri ayrı constant dosyasına çek, kritik template parçalarını fonksiyonlara böl. Büyük bir mimari değişiklik gerektirmez.

---

## 3. Sorun Yaratmayacak Şeyler

Bunlar **endişe edilmesi gerekmeyen** alanlardır:

| Alan | Neden Sorun Değil |
|------|------------------|
| Yeni PWA sayfası ekleme | `BasePage` extends + `Alpine.data` → sorunsuz pattern |
| Yeni API endpoint | `ApiClient.get/post/patch` üzerinden → sorunsuz |
| Yeni rol/yetki | `state.get('user').role` kontrolü → her yerde aynı |
| Admin panel genişletme | Alpine yok, saf TS, `adminUi.ts` helper'ları hazır |
| Yeni bildirim türü | SSE + `bus.on('sse:...')` → genişletmeye hazır |
| PWA özelliği ekleme | ServiceWorker + IndexedDB altyapısı yerleşik |
| Lazy route ekleme | `routes` objesine bir satır + dynamic import → bitti |

---

## 4. Öncelik Sırası

Aşağıdaki sırayla ele alınması önerilir:

### Hemen yapılabilir (kod değişikliği küçük, risk büyük)
1. **`HomePage._cleanups` ve `_cooldownTimer`'ı module scope'tan instance scope'a taşı** → bellek sızıntısı riski ortadan kalkar
2. **Diğer sayfalarda da benzer module-level state varsa instance'a çek**

### Kısa vadede (yeni özellik eklemeden önce)
3. **`ModalManager` utility yaz** → form/edit modalları için merkezi implementasyon, tüm sayfalar kullanır
4. **Interface değişiklik conventions'ı belgele** → Alpine expression'larında grep alışkanlığı

### Uzun vadede (proje 2x büyüyünce)
5. **SVG + büyük template parçalarını fonksiyonlara çek** → okunabilirlik
6. **`StateManager.watch()` + Alpine cleanup hook entegrasyonu** → sayfalar arası state senkronizasyonu

---

## 5. Özet

```
Alpine.js kullanımı:  SADECE PWA (public/ts/) — 10 sayfa + app.ts
Admin panel:          Alpine YOK — saf TypeScript + vanilla DOM

Kritik risk:          HomePage module-level cleanup değişkenleri
Orta risk:            Modal kod tekrarı (her sayfada ayrı implementasyon)
Düşük risk:           Alpine global namespace, tip güvenliği delikleri

Tavsiye:              Alpine'da kal, önce cleanup bug'ını düzelt,
                      sonra merkezi ModalManager yaz.
                      Solid.js'e geçiş bu proje için gereksiz yük.
```
