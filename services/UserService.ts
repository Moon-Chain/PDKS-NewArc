import bcrypt from 'bcryptjs';
import { BaseService } from '../core/BaseService.js';
import { AppError } from '../core/AppError.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { UserRow } from '../shared/types/user.js';

export interface CreateUserInput {
  personnel_id: string;
  name: string;
  password: string;
  role: string;
  title?: string;
  email?: string;
  manager_id?: string;
  start_date?: string;
  birth_date?: string;
  leave_balance?: number;
  can_remote_check_in?: boolean;
}

export interface UpdateUserInput {
  name?: string;
  title?: string;
  email?: string;
  role?: string;
  manager_id?: string;
  start_date?: string;
  birth_date?: string;
  leave_balance?: number;
  can_remote_check_in?: boolean;
}

type SafeUser = Omit<UserRow, 'password_hash' | 'device_id' | 'token_version'>;

function strip(user: UserRow): SafeUser {
  const { password_hash: _ph, device_id: _di, token_version: _tv, ...safe } = user;
  return safe;
}

export class UserService extends BaseService {
  constructor(private userRepo: UserRepository) {
    super();
  }

  async list(companyId: string, page: number, perPage: number): Promise<{ users: SafeUser[]; total: number; page: number; perPage: number }> {
    const offset = (page - 1) * perPage;
    const [rows, total] = await Promise.all([
      this.userRepo.findAll({ companyId, limit: perPage, offset, orderBy: 'name ASC' }),
      this.userRepo.countActive(companyId),
    ]);
    return { users: rows.map(strip), total, page, perPage };
  }

  async get(companyId: string, userId: string): Promise<SafeUser> {
    const user = await this.userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    return strip(user);
  }

  async create(companyId: string, data: CreateUserInput): Promise<SafeUser> {
    if (!data.personnel_id?.trim()) throw new AppError('Personel ID zorunlu', 400);
    if (!data.name?.trim())         throw new AppError('Ad soyad zorunlu', 400);
    if (!data.password || data.password.length < 4) throw new AppError('Şifre en az 4 karakter olmalı', 400);

    const existing = await this.userRepo.findByPersonnelId(data.personnel_id, companyId);
    if (existing) throw new AppError('Bu personel ID zaten kullanımda', 409);

    const password_hash = await bcrypt.hash(data.password, 12);
    const created = await this.userRepo.create({
      personnel_id:        data.personnel_id.trim(),
      name:                data.name.trim(),
      password_hash,
      role:                (data.role || 'personel') as 'admin' | 'mudur' | 'takim_lideri' | 'personel',
      title:               data.title?.trim() ?? undefined,
      email:               data.email?.trim() ?? undefined,
      manager_id:          data.manager_id ?? undefined,
      start_date:          data.start_date ?? undefined,
      birth_date:          data.birth_date ?? undefined,
      leave_balance:       data.leave_balance ?? 14,
      can_remote_check_in: data.can_remote_check_in ?? false,
    } as Record<string, unknown>, companyId);

    return strip(created);
  }

  async update(companyId: string, userId: string, data: UpdateUserInput): Promise<SafeUser> {
    const user = await this.userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    const updated = await this.userRepo.update(userId, data as Record<string, unknown>, companyId);
    return strip(updated);
  }

  async deactivate(companyId: string, userId: string, requesterId: string): Promise<void> {
    if (userId === requesterId) throw new AppError('Kendinizi pasife alamazsınız', 400);
    const user = await this.userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    await this.userRepo.softDelete(userId, companyId, requesterId);
  }

  async resetPassword(companyId: string, userId: string, newPassword: string): Promise<void> {
    if (!newPassword || newPassword.length < 4) throw new AppError('Şifre en az 4 karakter olmalı', 400);
    const user = await this.userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);
    const password_hash = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { password_hash } as never, companyId);
  }

  async updateAvatar(companyId: string, userId: string, avatarPath: string): Promise<SafeUser> {
    const updated = await this.userRepo.update(userId, { avatar_path: avatarPath } as never, companyId);
    return strip(updated);
  }
}
