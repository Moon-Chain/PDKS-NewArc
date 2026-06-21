# Geliştirme Notları

## PostgreSQL Bağlantısı

Şifre belirlediysen:
```env
DATABASE_URL=postgresql://postgres:SIFREN@localhost:5432/pdks
```

Şifre belirlemediysen (trust mode):
```env
DATABASE_URL=postgresql://postgres:@localhost:5432/pdks
```

Port: 5432
Kullanıcı: postgres
Veritabanı: pdks

## Redis

Şu an yok — sonra eklenecek.
Token blacklist için DB tablosu kullanılacak.
Cache şimdilik atlanacak.
Hazır olunca: Upstash (upstash.com) ücretsiz plan.

## Servis Adı

postgresql-x64-18

---

## Claude için Geliştirme Kuralı

**Her sayfa veya bileşen yazılmadan önce PDKS-main kaynak kodu okunacak.**

- PDKS-main React + Tailwind kullanıyor, PDKS-new Vanilla JS + custom CSS.
- Tailwind class'larını CSS'e çevirirken detay kaybı yaşanabiliyor.
- Bu yüzden: önce `src/App.tsx` veya ilgili bileşen okunur, sonra yazılır.
- "Yakın görünüyor" diyerek geçmek yok — birebir aynı olacak.
- Kullanıcı tek tek fark edip söylemek zorunda kalmamalı.
