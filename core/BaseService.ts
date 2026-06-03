import { AppError } from './AppError.js';
import type { JwtPayload } from '../middleware/auth.js';

export class BaseService {
  assertAdmin(user: JwtPayload) {
    if (user.role !== 'admin')
      throw new AppError('Bu işlem için admin yetkisi gerekli', 403);
  }

  assertAdminOrMudur(user: JwtPayload) {
    if (user.role !== 'admin' && user.role !== 'mudur')
      throw new AppError('Bu işlem için yönetici yetkisi gerekli', 403);
  }

  assertSelfOrAdmin(user: JwtPayload, targetId: string) {
    if (user.role !== 'admin' && user.id !== targetId)
      throw new AppError('Sadece kendi bilgilerinizi düzenleyebilirsiniz', 403);
  }

  paginate(page?: string | number, limit?: string | number) {
    const p = Math.max(1, parseInt(String(page || 1)));
    const l = Math.min(100, Math.max(1, parseInt(String(limit || 50))));
    return { page: p, limit: l, offset: (p - 1) * l };
  }
}
