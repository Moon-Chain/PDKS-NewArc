import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

import { logger } from './core/Logger.js';
import { requestId } from './middleware/requestId.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { AppError } from './core/AppError.js';
import { db } from './db/connection.js';
import { apiLogger } from './middleware/apiLogger.js';

import authRoute          from './routes/v1/auth.js';
import attendanceRoute    from './routes/v1/attendance.js';
import eventsRoute        from './routes/v1/events.js';
import usersRoute         from './routes/v1/users.js';
import settingsRoute      from './routes/v1/settings.js';
import leavesRoute        from './routes/v1/leaves.js';
import overtimeRoute      from './routes/v1/overtime.js';
import notificationsRoute from './routes/v1/notifications.js';
import pushRoute          from './routes/v1/push.js';
import holidaysRoute      from './routes/v1/holidays.js';
import reportsRoute       from './routes/v1/reports.js';
import adminRoute         from './routes/v1/admin/index.js';

// Event dinleyicilerini başlat
import './events/setup.js';

// Scheduled jobs
import { startAbsentReminder } from './jobs/absentReminder.js';
import { startQrRotation }    from './jobs/qrRotation.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3000');

const app = express();

// Cloudflare / reverse proxy arkasında çalışıyoruz
// X-Forwarded-For header'ına güven (rate limit + gerçek IP için)
app.set('trust proxy', 1);

// Güvenlik
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      // Alpine.js ifade değerlendirmesi için 'unsafe-eval' gerekli
      // (new Function() kullanır — x-text, @click, :class vb.)
      scriptSrc:     ["'self'", "'unsafe-eval'", 'cdn.jsdelivr.net',
                      'static.cloudflareinsights.com'],  // Cloudflare analytics
      scriptSrcAttr: ["'unsafe-inline'"],  // inline onclick vb. için
      styleSrc:      ["'self'", "'unsafe-inline'"],
      imgSrc:        ["'self'", 'data:', 'blob:'],
      fontSrc:       ["'self'"],
      connectSrc:    ["'self'", 'blob:', 'cloudflareinsights.com', 'api.ipify.org'],
      workerSrc:     ["'self'"],
      manifestSrc:   ["'self'"],
      frameSrc:      ["'none'"],
      objectSrc:     ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// ALLOWED_ORIGINS: virgülle ayrılmış ek originler (Cloudflare, ngrok vb.)
const _extraOrigins = (process.env.ALLOWED_ORIGINS ?? '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // direkt istek / SSR

    // Yerel geliştirme
    if (origin.startsWith('http://localhost')) return callback(null, true);
    if (origin.startsWith('http://127.'))      return callback(null, true);
    if (origin.startsWith('http://192.168.'))  return callback(null, true);
    if (origin.startsWith('http://10.'))       return callback(null, true);

    // Tünel araçları
    if (origin.includes('ngrok'))              return callback(null, true);
    if (origin.includes('trycloudflare.com'))  return callback(null, true);
    if (origin.includes('cloudflareaccess.com')) return callback(null, true);

    // .env'den APP_URL
    if (process.env.APP_URL && origin === process.env.APP_URL) return callback(null, true);

    // .env'den ALLOWED_ORIGINS (virgülle ayrılmış)
    if (_extraOrigins.includes(origin)) return callback(null, true);

    callback(new Error('CORS: izin verilmedi'));
  },
  credentials: true,
}));

// Temel middleware
app.use(requestId);
// ngrok "Browser Warning" sayfasını atla
app.use((_req, res, next) => { res.setHeader('ngrok-skip-browser-warning', 'true'); next(); });
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(apiLogger);

// Erişim logu
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    if (!req.path.startsWith('/api/')) return;
    logger.info('HTTP', {
      method: req.method,
      url:    req.url,
      status: res.statusCode,
      ms:     Date.now() - start,
      reqId:  req.requestId,
    });
  });
  next();
});

// Rate limit — tüm API
app.use('/api/', globalLimiter);

// CSS — asla cache'lenmesin (geliştirme sürecinde sık değişiyor)
app.use('/css', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
});

// sw.js — tarayıcı yeni versiyonu hemen görsün
app.use('/sw.js', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  next();
});

// Statik dosyalar
app.use(express.static(join(__dirname, 'public')));
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Health check — Uptime Robot izlemesi için
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// API routes
app.use('/api/v1/auth',          authRoute);
app.use('/api/v1/attendance',    attendanceRoute);
app.use('/api/v1/events',        eventsRoute);
app.use('/api/v1/users',         usersRoute);
app.use('/api/v1/settings',      settingsRoute);
app.use('/api/v1/leaves',        leavesRoute);
app.use('/api/v1/overtime',      overtimeRoute);
app.use('/api/v1/notifications', notificationsRoute);
app.use('/api/v1/push',          pushRoute);
app.use('/api/v1/holidays',      holidaysRoute);
app.use('/api/v1/reports',       reportsRoute);
app.use('/api/v1/admin',         adminRoute);

// Admin SPA catch-all — /admin ve /admin/* (statik dosya olmayan) admin.html döner
app.get(/^\/admin(\/.*)?$/, (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'admin', 'index.html'));
});

// SPA catch-all — API olmayan her URL index.html döner
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint bulunamadı' });
});

// Global hata handler
app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const error = err as AppError & { status?: number };
  const status = error.status || 500;
  const message = error.message || 'Sunucu hatası';

  if (status >= 500) {
    logger.error('unhandled_error', {
      message,
      stack: error.stack,
      reqId: req.requestId,
      url:   req.url,
    });
  }

  res.status(status).json({
    error: message,
    requestId: req.requestId,
  });
});

// Graceful shutdown
const server = app.listen(PORT, () => {
  logger.info(`PDKS çalışıyor → http://localhost:${PORT}`);
  startAbsentReminder();
  startQrRotation();
});

async function shutdown(signal: string) {
  logger.info(`${signal} alındı — kapatılıyor`);
  server.close(async () => {
    await db.end();
    logger.info('DB bağlantısı kapatıldı');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown zaman aşımı');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

export default app;
