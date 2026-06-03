import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { BaseService } from '../core/BaseService.js';
import { AppError } from '../core/AppError.js';
import { db } from '../db/connection.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import { TOKEN_TTL } from '../shared/constants.js';

export interface LoginInput {
  personnelId: string;
  password: string;
  deviceId?: string;
}

export class AuthService extends BaseService {
  constructor(private userRepo: UserRepository) {
    super();
  }

  async login({ personnelId, password, deviceId }: LoginInput) {
    // personnelId global unique — şirket login'de 0a'da globalden bakıyoruz
    const user = await this.userRepo.findByPersonnelIdGlobal(personnelId);
    if (!user) throw new AppError('Hatalı ID veya şifre', 401);

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new AppError('Hatalı ID veya şifre', 401);

    if (user.role === 'deleted') throw new AppError('Hesap pasif', 403);

    // Personel rol: cihaz kontrolü
    if (user.role === 'personel' && user.device_id && deviceId && user.device_id !== deviceId) {
      throw new AppError('Bu hesap farklı bir cihaza tanımlı', 403);
    }

    // İlk giriş: cihazı kaydet
    if (user.role === 'personel' && !user.device_id && deviceId) {
      await this.userRepo.update(user.id, { device_id: deviceId } as never, user.company_id);
    }

    const jti = randomUUID();
    const token = jwt.sign(
      {
        id:         user.id,
        role:       user.role,
        company_id: user.company_id,
        jti,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '8h' }
    );

    const { password_hash: _ph, ...profile } = user;
    return { token, profile, jti };
  }

  async logout(jti: string) {
    await db.query(
      `INSERT INTO token_blacklist (jti, expires_at)
       VALUES ($1, NOW() + interval '${TOKEN_TTL.JWT_SECONDS} seconds')
       ON CONFLICT (jti) DO NOTHING`,
      [jti]
    );

    // Süresi dolmuş tokenları temizle (arka planda)
    db.query(`DELETE FROM token_blacklist WHERE expires_at < NOW()`).catch(() => {});
  }

  async changePassword({ userId, companyId, currentPassword, newPassword }: {
    userId: string;
    companyId: string;
    currentPassword: string;
    newPassword: string;
  }) {
    const user = await this.userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) throw new AppError('Mevcut şifre hatalı', 401);

    if (newPassword.length < 4) throw new AppError('Şifre en az 4 karakter olmalı', 400);

    const hash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { password_hash: hash } as never, companyId);
  }
}
