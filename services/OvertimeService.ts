import { BaseService } from '../core/BaseService.js';
import { AppError } from '../core/AppError.js';
import type { OvertimeRepository } from '../repositories/OvertimeRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { OvertimeRow } from '../shared/types/overtime.js';

export class OvertimeService extends BaseService {
  constructor(
    private overtimeRepo: OvertimeRepository,
    private userRepo:     UserRepository,
  ) { super(); }

  async create(companyId: string, userId: string, data: {
    date: string; hours: number; description: string;
  }): Promise<OvertimeRow> {
    if (!data.date) throw new AppError('Tarih zorunlu', 400);
    if (!data.hours || data.hours <= 0) throw new AppError('Saat 0\'dan büyük olmalı', 400);
    if (!data.description?.trim()) throw new AppError('Açıklama zorunlu', 400);

    const user = await this.userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    return this.overtimeRepo.createOvertime({
      company_id:  companyId,
      user_id:     userId,
      user_name:   user.name,
      manager_id:  user.manager_id ?? userId,
      date:        data.date,
      hours:       data.hours,
      description: data.description.trim(),
    });
  }

  async list(companyId: string, role: string, userId: string, query: {
    page?: number; limit?: number; status?: string; targetUserId?: string;
  }): Promise<{ rows: OvertimeRow[]; total: number; page: number; limit: number }> {
    const { page, limit } = this.paginate(query.page, query.limit);
    const isAdmin = role === 'admin';
    const isMudur = role === 'mudur' || role === 'takim_lideri';

    const result = await this.overtimeRepo.findPage({
      companyId,
      userId:    isAdmin ? query.targetUserId : (isMudur ? undefined : userId),
      managerId: isMudur ? userId : undefined,
      status:    query.status,
      page, limit,
    });
    return { ...result, page, limit };
  }

  async approve(companyId: string, approverId: string, approverRole: string, id: string): Promise<OvertimeRow> {
    const ot = await this.overtimeRepo.findById(id, companyId);
    if (!ot) throw new AppError('Mesai talebi bulunamadı', 404);
    if (ot.status !== 'pending') throw new AppError('Sadece bekleyen talepler onaylanabilir', 409);
    if (approverRole !== 'admin' && ot.manager_id !== approverId)
      throw new AppError('Bu talep size ait değil', 403);
    const updated = await this.overtimeRepo.updateStatus(id, companyId, 'approved');
    if (!updated) throw new AppError('Güncelleme başarısız', 500);
    return updated;
  }

  async reject(companyId: string, approverId: string, approverRole: string, id: string): Promise<OvertimeRow> {
    const ot = await this.overtimeRepo.findById(id, companyId);
    if (!ot) throw new AppError('Mesai talebi bulunamadı', 404);
    if (ot.status !== 'pending') throw new AppError('Sadece bekleyen talepler reddedilebilir', 409);
    if (approverRole !== 'admin' && ot.manager_id !== approverId)
      throw new AppError('Bu talep size ait değil', 403);
    const updated = await this.overtimeRepo.updateStatus(id, companyId, 'rejected');
    if (!updated) throw new AppError('Güncelleme başarısız', 500);
    return updated;
  }

  async cancel(companyId: string, userId: string, id: string): Promise<void> {
    const ot = await this.overtimeRepo.findById(id, companyId);
    if (!ot) throw new AppError('Mesai talebi bulunamadı', 404);
    if (ot.user_id !== userId) throw new AppError('Bu talep size ait değil', 403);
    if (ot.status !== 'pending') throw new AppError('Sadece bekleyen talepler iptal edilebilir', 409);
    await this.overtimeRepo.cancelOvertime(id, companyId, userId);
  }
}
