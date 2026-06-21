# PDKS — Geliştirici Kurulum Kılavuzu

Yeni biri projeyi sıfırdan nasıl çalıştırır.

---

## Gereksinimler

```
Node.js  20+    → https://nodejs.org (LTS sürümü)
Git             → https://git-scm.com
Docker          → PostgreSQL ve Redis için (opsiyonel, direkt kurulum da olur)
```

Kontrol:
```bash
node --version   # v20.x.x olmalı
npm --version    # 10.x.x olmalı
git --version
docker --version
```

---

## 1. Projeyi İndir

```bash
git clone https://github.com/kullanici/pdks.git
cd pdks
npm install
```

---

## 2. Veritabanı Kur

### Seçenek A — Docker ile (Önerilen, 1 komut)

```bash
docker run -d \
  --name pdks-postgres \
  -e POSTGRES_USER=pdks \
  -e POSTGRES_PASSWORD=pdks123 \
  -e POSTGRES_DB=pdks \
  -p 5432:5432 \
  postgres:16-alpine

docker run -d \
  --name pdks-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Seçenek B — Direkt Kurulum

PostgreSQL: https://www.postgresql.org/download/
Redis: https://redis.io/download/

Kurulumdan sonra veritabanı oluştur:
```bash
psql -U postgres -c "CREATE DATABASE pdks;"
psql -U postgres -c "CREATE USER pdks WITH PASSWORD 'pdks123';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE pdks TO pdks;"
```

---

## 3. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
```

`.env` dosyasını düzenle:

```env
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# JWT — rastgele bir string, en az 64 karakter
JWT_SECRET=development_secret_buraya_gercek_bir_string_koy_en_az_64_karakter

# PostgreSQL
DATABASE_URL=postgresql://pdks:pdks123@localhost:5432/pdks

# Redis
REDIS_URL=redis://localhost:6379

# Push Bildirimleri — VAPID anahtarı üret (aşağıda anlatıldı)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=mailto:dev@localhost

# Sentry — geliştirmede boş bırakılabilir
SENTRY_DSN=

# Cloudflare R2 — geliştirmede boş bırak, uploads/ klasörü kullanılır
R2_ENDPOINT=
R2_ACCESS_KEY=
R2_SECRET_KEY=
R2_BUCKET=
R2_PUBLIC_URL=
```

### VAPID Anahtarı Üret

```bash
npx web-push generate-vapid-keys
```

Çıkan `Public Key` ve `Private Key` değerlerini .env'e yapıştır.

---

## 4. Migration Çalıştır

```bash
npm run migrate
```

Bu komut `db/migrations/` klasöründeki SQL dosyalarını sırayla çalıştırır
ve `_migrations` tablosunda hangisinin çalıştırıldığını kaydeder.

Başarılı çıktı:
```
✓ 001_companies.sql
✓ 002_initial_schema.sql
✓ 003_rls_policies.sql
Migration tamamlandı.
```

---

## 5. Seed Verisi Yükle

```bash
npm run seed
```

Bu komut şunları oluşturur:
- Test şirketi: `PDKS Test A.Ş.` (slug: `test`)
- Admin kullanıcı: personnelId `admin`, şifre `admin123`

---

## 6. Frontend Derle (Dev Modu)

```bash
npm run build:watch
```

Bu komut TypeScript dosyalarını `public/js/bundle.js`'e derler ve
her değişiklikte otomatik yeniden derler. Arka planda çalışsın.

---

## 7. Sunucuyu Başlat

Yeni terminal aç:

```bash
npm run dev
```

Açılış çıktısı:
```
PDKS çalışıyor → http://localhost:3000
DB bağlantısı hazır
Redis bağlantısı hazır
```

Tarayıcıdan aç: http://localhost:3000

---

## 8. Giriş Yap

```
Personnel ID : admin
Şifre        : admin123
```

---

## 9. Testleri Çalıştır

```bash
npm test                # Tüm testler
npm run test:watch      # Değişiklikleri izle
npm test -- --coverage  # Test kapsamı raporu
```

---

## Sık Kullanılan Komutlar

```bash
npm run dev          # Sunucu + esbuild watch (geliştirme)
npm run build        # Production build
npm start            # Production sunucusu başlat
npm run migrate      # DB migration çalıştır
npm run seed         # Test verisi yükle
npm test             # Testleri çalıştır
npm run backup       # DB yedek al
```

---

## Sorun Giderme

### PostgreSQL bağlantı hatası
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
Docker container çalışıyor mu?
```bash
docker ps  # pdks-postgres görünmeli
docker start pdks-postgres
```

### Redis bağlantı hatası
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
```bash
docker start pdks-redis
```

### Migration hatası — tablo zaten var
```bash
# _migrations tablosundaki kaydı sil, tekrar çalıştır
psql $DATABASE_URL -c "DELETE FROM _migrations WHERE filename='002_initial_schema.sql';"
npm run migrate
```

### Port kullanımda
```
Error: listen EADDRINUSE :::3000
```
```bash
# Portu kullanan process'i bul ve öldür
npx kill-port 3000
```

### VAPID anahtarı eksik
Push bildirimler çalışmaz ama sistem çalışmaya devam eder.
.env'de VAPID_PUBLIC_KEY ve VAPID_PRIVATE_KEY dolu olmalı.

---

## Production Deploy (Coolify)

1. Coolify → New Service → Docker Compose
2. `docker-compose.yml` dosyasını kullan
3. Environment Variables bölümüne `.env` içeriğini yapıştır
4. PostgreSQL: Coolify → Databases → New → PostgreSQL 16
5. Redis: Coolify → Databases → New → Redis 7
6. Volumes: `/app/uploads` → Coolify persistent storage
7. Deploy

Detay için: [ROOT-PANEL.md](ROOT-PANEL.md)

---

*Kılavuz tarihi: 2026-06-01*
