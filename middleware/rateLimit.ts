import rateLimit from 'express-rate-limit';

// Redis yok — MemoryStore kullanılıyor (tek instance için yeterli)
// Çok instance'da Redis gerekir

export const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla istek. Bir dakika bekleyin.' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Çok fazla başarısız deneme. 15 dakika bekleyin.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Çok fazla yükleme isteği.' },
});
