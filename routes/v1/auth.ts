import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../services/AuthService.js';
import { UserRepository } from '../../repositories/UserRepository.js';
import { requireAuth } from '../../middleware/auth.js';
import { loginLimiter } from '../../middleware/rateLimit.js';
import { validate, loginSchema, changePasswordSchema } from '../../middleware/validate.js';
import { db } from '../../db/connection.js';
import type { JwtPayload } from '../../middleware/auth.js';

const router = Router();
const authService = new AuthService(new UserRepository());

// POST /api/v1/auth/login
router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const deviceId = req.body.deviceId as string | undefined;
    const { token, profile } = await authService.login({
      personnelId: req.body.personnelId as string,
      password:    req.body.password as string,
      deviceId,
    });

    // Cloudflare / reverse proxy üzerinden erişimde 'lax' gerekli
    // 'strict' bazı proxy senaryolarında cookie'yi blokluyor
    const isHttps = process.env.APP_URL?.startsWith('https://') ?? false;
    res.cookie('pdks_token', token, {
      httpOnly: true,
      secure:   isHttps,
      sameSite: isHttps ? 'none' : 'lax',
      maxAge:   8 * 60 * 60 * 1000,
    });

    res.json({ success: true, profile });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/auth/logout
router.post('/logout', async (req, res) => {
  const token = req.cookies?.pdks_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      await authService.logout(decoded.jti);
    } catch {
      // Token geçersiz — sadece cookie'yi temizle
    }
  }
  res.clearCookie('pdks_token');
  res.json({ success: true });
});

// GET /api/v1/auth/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const userRepo = new UserRepository();
    const user = await userRepo.findById(req.user!.id, req.user!.company_id);
    if (!user) {
      res.clearCookie('pdks_token');
      res.status(401).json({ error: 'Kullanıcı bulunamadı' });
      return;
    }
    const { password_hash: _ph, ...profile } = user;
    res.json(profile);
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/auth/password
router.put('/password', requireAuth, validate(changePasswordSchema), async (req, res, next) => {
  try {
    await authService.changePassword({
      userId:          req.user!.id,
      companyId:       req.user!.company_id,
      currentPassword: req.body.currentPassword as string,
      newPassword:     req.body.newPassword as string,
    });

    // Şifre değişince token'ı geçersiz kıl — logout
    const token = req.cookies?.pdks_token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
        await authService.logout(decoded.jti);
      } catch { /* ignore */ }
    }
    res.clearCookie('pdks_token');
    res.json({ success: true, message: 'Şifre değiştirildi. Lütfen tekrar giriş yapın.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/health
router.get('/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', time: new Date() });
  } catch {
    res.status(503).json({ status: 'db_error' });
  }
});

export default router;
