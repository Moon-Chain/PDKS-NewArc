import { BaseService } from '../core/BaseService.js';
import { AppError } from '../core/AppError.js';
import type { LeaveRepository } from '../repositories/LeaveRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { LeaveRow } from '../shared/types/leave.js';
import { countWorkDays } from '../shared/holidays.js';

export class LeaveService extends BaseService {
  constructor(
    private leaveRepo: LeaveRepository,
    private userRepo:  UserRepository,
  ) {
    super();
  }

  async create(
    companyId: string,
    userId:    string,
    data: {
      start_date: string;
      end_date:   string;
      reason:     string;
      type:       string;
    }
  ): Promise<LeaveRow> {
    this._validateDates(data.start_date, data.end_date);
    if (!['annual', 'report', 'excuse'].includes(data.type)) {
      throw new AppError('Geçersiz izin türü', 400);
    }
    if (!data.reason?.trim()) throw new AppError('Açıklama zorunlu', 400);

    const days = this._countDays(data.start_date, data.end_date);

    const user = await this.userRepo.findById(userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    // Yıllık izin için bakiye kontrolü
    if (data.type === 'annual' && user.leave_balance < days) {
      throw new AppError(
        `Yetersiz izin bakiyesi. Mevcut: ${user.leave_balance} gün, Talep: ${days} gün`,
        422
      );
    }

    // Yönetici ID — yoksa kendi ID'si (admin/mudur kendi kendini onaylayabilir)
    const managerId = user.manager_id ?? userId;

    return this.leaveRepo.createLeave({
      company_id: companyId,
      user_id:    userId,
      user_name:  user.name,
      manager_id: managerId,
      start_date: data.start_date,
      end_date:   data.end_date,
      days,
      reason:     data.reason.trim(),
      type:       data.type,
    });
  }

  async createBackdated(
    companyId: string,
    actorId:   string,
    data: {
      userId:     string;
      start_date: string;
      end_date:   string;
      reason:     string;
      type:       string;
    }
  ): Promise<LeaveRow> {
    const s = new Date(data.start_date);
    const e = new Date(data.end_date);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) throw new AppError('Geçersiz tarih', 400);
    if (e < s) throw new AppError('Bitiş tarihi başlangıç tarihinden önce olamaz', 400);
    if (!['annual', 'report', 'excuse'].includes(data.type)) throw new AppError('Geçersiz izin türü', 400);
    if (!data.reason?.trim()) throw new AppError('Açıklama zorunlu', 400);

    const days = this._countDays(data.start_date, data.end_date);
    const user = await this.userRepo.findById(data.userId, companyId);
    if (!user) throw new AppError('Kullanıcı bulunamadı', 404);

    if (data.type === 'annual' && user.leave_balance < days) {
      throw new AppError(
        `Yetersiz izin bakiyesi. Mevcut: ${user.leave_balance} gün, Talep: ${days} gün`, 422
      );
    }

    const leave = await this.leaveRepo.createLeave({
      company_id: companyId,
      user_id:    data.userId,
      user_name:  user.name,
      manager_id: user.manager_id ?? actorId,
      start_date: data.start_date,
      end_date:   data.end_date,
      days,
      reason:     data.reason.trim(),
      type:       data.type,
    });

    // Anında onayla — admin tarafından girilen geçmiş izin
    const approved = await this.leaveRepo.updateStatus(leave.id, companyId, 'approved');
    if (data.type === 'annual') await this._deductBalance(data.userId, companyId, days);

    return approved ?? leave;
  }

  async list(
    companyId: string,
    role:      string,
    userId:    string,
    query: { page?: number; limit?: number; status?: string; targetUserId?: string }
  ): Promise<{ rows: LeaveRow[]; total: number; page: number; limit: number }> {
    const { page, limit } = this.paginate(query.page, query.limit);
    const isAdmin = role === 'admin';
    const isMudur = role === 'mudur' || role === 'takim_lideri';

    const result = await this.leaveRepo.findPage({
      companyId,
      userId:    isAdmin ? query.targetUserId : (isMudur ? undefined : userId),
      managerId: isMudur ? userId : undefined,
      status:    query.status,
      page,
      limit,
    });

    return { ...result, page, limit };
  }

  async approve(
    companyId:    string,
    approverId:   string,
    approverRole: string,
    id:           string,
  ): Promise<LeaveRow> {
    const leave = await this.leaveRepo.findById(id, companyId);
    if (!leave) throw new AppError('İzin talebi bulunamadı', 404);
    if (leave.status !== 'pending') throw new AppError('Sadece bekleyen talepler onaylanabilir', 409);

    this._checkApproverAccess(approverRole, approverId, leave);

    const updated = await this.leaveRepo.updateStatus(id, companyId, 'approved');
    if (!updated) throw new AppError('Güncelleme başarısız', 500);

    // Yıllık izin bakiyesini düş
    if (leave.type === 'annual') {
      await this._deductBalance(leave.user_id, companyId, leave.days);
    }

    return updated;
  }

  async reject(
    companyId:    string,
    approverId:   string,
    approverRole: string,
    id:           string,
  ): Promise<LeaveRow> {
    const leave = await this.leaveRepo.findById(id, companyId);
    if (!leave) throw new AppError('İzin talebi bulunamadı', 404);
    if (leave.status !== 'pending') throw new AppError('Sadece bekleyen talepler reddedilebilir', 409);

    this._checkApproverAccess(approverRole, approverId, leave);

    const updated = await this.leaveRepo.updateStatus(id, companyId, 'rejected');
    if (!updated) throw new AppError('Güncelleme başarısız', 500);
    return updated;
  }

  async cancel(companyId: string, userId: string, id: string): Promise<void> {
    const leave = await this.leaveRepo.findById(id, companyId);
    if (!leave) throw new AppError('İzin talebi bulunamadı', 404);
    if (leave.user_id !== userId) throw new AppError('Bu talep size ait değil', 403);
    if (leave.status !== 'pending') throw new AppError('Sadece bekleyen talepler iptal edilebilir', 409);

    await this.leaveRepo.cancelLeave(id, companyId, userId, 'Kullanıcı tarafından iptal edildi');
  }

  private _checkApproverAccess(role: string, approverId: string, leave: LeaveRow) {
    if (role === 'admin') return;
    if (role === 'mudur' || role === 'takim_lideri') {
      if (leave.manager_id !== approverId) {
        throw new AppError('Bu talep sizin ekibinize ait değil', 403);
      }
      return;
    }
    throw new AppError('Onaylama yetkisi yok', 403);
  }

  private async _deductBalance(userId: string, companyId: string, days: number) {
    await this.userRepo.deductLeaveBalance(userId, companyId, days);
  }

  private _validateDates(start: string, end: string) {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) throw new AppError('Geçersiz tarih', 400);
    if (e < s) throw new AppError('Bitiş tarihi başlangıç tarihinden önce olamaz', 400);
  }

  private _countDays(start: string, end: string): number {
    // Pazar ve resmi tatil günleri dahil edilmez — PDKS-main mantığı
    return countWorkDays(start, end);
  }
}
