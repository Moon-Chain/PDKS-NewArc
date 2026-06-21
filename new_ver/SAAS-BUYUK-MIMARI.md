# SaaS ve Büyük Ölçek — İleride Bakılacaklar

Bu belgede şu an uygulanmayan, ileriye dönük notlar var.
PDKS ana uygulaması tamamlandıktan sonra bu listeye bakılacak.

---

## Yatay Ölçek (Horizontal Scaling)

### Sorun

Şu an tek sunucu. Yük arttığında tek seçenek: sunucuyu büyüt (vertical).
Yatay büyüme (birden fazla sunucu) için şunlar çözülmeli:

**SSE (Gerçek Zamanlı) → Redis Pub/Sub**
```
Şu an:
  Kullanıcı A → Sunucu 1'e bağlı SSE
  Event geldi → Sunucu 2'de işlendi → Sunucu 1'deki SSE habersiz

Çözüm:
  Her sunucu Redis kanalını dinler
  Event geldi → Redis'e yayınla → Tüm sunucular alır → Kendi SSE'lerine gönderir
```

```typescript
// Gelecekte: events/redisPubSub.ts
import { redis } from '../db/redis.js';
const subscriber = redis.duplicate();
await subscriber.subscribe('pdks:events');
subscriber.on('message', (channel, message) => {
  const { userId, event, data } = JSON.parse(message);
  pushToUser(userId, event, data);  // Yerel SSE bağlantılarına gönder
});

// Event fırlatırken Redis'e yayınla
await redis.publish('pdks:events', JSON.stringify({ userId, event, data }));
```

**Dosya Depolama → R2/S3 (Zaten Planlandı)**
`uploads/` disk'te olduğu sürece yatay ölçek olmaz. R2 entegrasyonu
MIMARI.md'de var, Cloudflare R2 bu sorunu çözer.

**Load Balancer → Nginx/Cloudflare**
```nginx
upstream pdks {
  server 127.0.0.1:3000;
  server 127.0.0.1:3001;
  # SSE için sticky session şart
  ip_hash;  # Aynı IP → aynı sunucu
}
```

---

## SSE Ölçek Sorunu

1000 aktif kullanıcı = 1000 açık HTTP bağlantısı.
Node.js kaldırır ama load balancer eklenince sorun çıkar.

**Çözüm seçenekleri:**
- Nginx ip_hash (sticky session) — basit ama yük dengelemez
- Redis Pub/Sub — her sunucu tüm event'leri alır, kendi kullanıcılarına dağıtır
- Socket.IO + Redis adapter — otomatik halleder ama bağımlılık artar

**Şimdilik:** Tek sunucu, sorun yok. 500+ aktif kullanıcıda Redis Pub/Sub gerekir.

---

## Şirket Başına Rate Limit

Şu an rate limit global IP bazlı. Bir şirket API'yi kötüye kullanırsa
diğer şirketleri de etkiler.

```typescript
// Gelecekte: middleware/rateLimit.ts
export const tenantLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      500,  // Şirket başına 500 istek/dakika
  keyGenerator: (req) => `tenant:${req.user?.company_id}`,
  store: new RedisStore({ ... }),
});
```

---

## KVKK / Kişisel Veri Silme

Türk veri koruma kanununa göre kullanıcı verisinin silinmesini talep edebilir.

**Gerekli akış:**
```
1. Kullanıcı "hesabımı sil" talep eder
2. Admin onaylar
3. Sistem kişisel verileri anonymize eder (siler değil — audit için log kalır)
4. attendance, leave vb. kayıtlar tutulur ama kişisel bilgi temizlenir
```

```sql
-- Anonymize sorgusu (gelecekte)
UPDATE users SET
  name          = 'Silinmiş Kullanıcı',
  email         = NULL,
  personnel_id  = 'deleted_' || id,
  password_hash = 'DELETED',
  push_subscription = NULL,
  avatar_path   = NULL,
  device_id     = NULL,
  role          = 'deleted',
  deleted_at    = NOW()
WHERE id = $1;
```

---

## SaaS Özellikleri (Şimdi Gerekmez)

### Self-Servis Şirket Kaydı
- Şirket formu doldur → e-posta doğrula → hesap açılır
- Admin elle açmak zorunda kalmaz
- Gerekli: e-posta sistemi + onboarding wizard

### Faturalama / Abonelik
- Stripe veya Iyzico entegrasyonu
- Plan: Starter (50 kişi), Pro (200 kişi), Enterprise (sınırsız)
- Aylık/yıllık ödeme
- Fatura PDF oluşturma

### Onboarding Wizard
- Şirket açıldığında: "İlk yöneticini ekle → Personelleri ekle → QR kodu yazdır"
- Adım adım kurulum

### Şirket Kullanım İstatistikleri
- Aylık aktif kullanıcı
- En çok kullanılan özellik
- API çağrı sayısı

### Plan Yükseltme/Düşürme
- Admin planını değiştirebilir
- Kota aşımında otomatik uyarı

### Deneme Süresi Yönetimi
- 14 günlük trial
- Trial bitmeden 3 gün önce e-posta uyarısı
- Trial bitince sisteme erişim kapanır

---

## İleride Eklenebilecek Özellikler

### Full-Text Search
- PostgreSQL `tsvector` ile Türkçe arama
- Personel adı, notlar, izin açıklaması arama

### Mobil Uygulama
- PWA iOS'ta kısıtlı (push bildirimi iOS 16.4+ gerekiyor)
- React Native ile gerçek native app
- Kamera erişimi daha güvenilir

### Background Sync iOS
- iOS Safari desteklemiyor
- Çözüm yok — iOS kullanıcılara "internet gerekli" uyarısı ver

### Feature Flag Yönetim UI'ı
- Admin panelinde özellik aç/kapat
- Belirli şirketlere beta özellik sun
- A/B test grubu tanımla

### BullMQ Tam Uygulama
- Queue dashboard (hangi görevler bekliyor, hata verenler)
- Retry stratejisi
- Dead letter queue (başarısız görevleri arşivle)

### AI Servisleri
- Zaten event emitter'a hazır
- `emitter.on('attendance:anomaly', aiService.analyze)`
- İzin taleplerini otomatik analiz
- Devam anomali tespiti ("bu personel 3 aydır Pazartesi geç geliyor")
- Yönetici için haftalık özet rapor

### Root Panel
- Detaylar: ROOT-PANEL.md
- PDKS tamamlandıktan sonra

### Horizontal Scaling (Tam)
- Docker Swarm veya Kubernetes
- Redis Pub/Sub SSE için
- Nginx load balancer
- Shared R2 storage (zaten planlandı)

---

## Öncelik Sırası (İleriye Dönük)

```
1. PDKS tamamla (Faz 0-3)
2. Root panel yaz
3. KVKK veri silme mekanizması
4. Şirket başına rate limit
5. BullMQ tam uygulama
6. Self-servis kayıt + e-posta
7. Faturalama (Stripe)
8. Onboarding
9. AI servisleri
10. Mobil uygulama
11. Horizontal scaling
```

---

*Not tarihi: 2026-06-01*
