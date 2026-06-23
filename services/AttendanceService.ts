import { createHmac } from 'crypto';
import { BaseService } from '../core/BaseService.js';
import { AppError } from '../core/AppError.js';
import type { AttendanceRepository } from '../repositories/AttendanceRepository.js';
import type { SettingsRepository } from '../repositories/SettingsRepository.js';
import type { OvertimeRepository } from '../repositories/OvertimeRepository.js';
import type { UserRepository } from '../repositories/UserRepository.js';
import type { AttendanceRow, AttendanceStatus } from '../shared/types/attendance.js';
import { emitter } from '../events/emitter.js';

const COOLDOWN_MS = 60_000; // 60 saniye

export class AttendanceService extends BaseService {
  constructor(
    private attendanceRepo: AttendanceRepository,
    private settingsRepo:   SettingsRepository,
    private overtimeRepo?:  OvertimeRepository,
    private userRepo?:      UserRepository,
  ) {
    super();
  }

  async checkIn({
    userId,
    userName,
    companyId,
    type,
    ip,
    qrValue,
    latitude,
    longitude,
    isOffline = false,
  }: {
    userId:     string;
    userName:   string;
    companyId:  string;
    type:       'in' | 'out';
    ip:         string;
    qrValue:    string;
    latitude?:  number;
    longitude?: number;
    isOffline?: boolean;
  }): Promise<AttendanceRow> {
    const settings = await this.settingsRepo.get(companyId);

    // IP kontrolü
    if (settings.office_ip && ip !== settings.office_ip) {
      // Hata kaydını DB'ye yaz
      await this.attendanceRepo.create({
        user_id:       userId,
        user_name:     userName,
        type,
        ip_address:    ip,
        status:        'error',
        error_message: 'Hatalı ağ — sadece iş yeri ağından giriş yapılabilir',
        offline_queued: false,
        is_remote:     false,
      }, companyId);

      throw new AppError('Sadece iş yeri ağından giriş yapılabilir', 403);
    }

    // QR doğrulaması (offline ise atla — offline kayıtlar zaten IP altında)
    if (!isOffline) {
      this._validateQr(qrValue, settings.qr_secret, companyId);
    }

    // Cooldown kontrolü
    const last = await this.attendanceRepo.findLast(userId, companyId);
    if (last) {
      const elapsed = Date.now() - new Date(last.timestamp).getTime();
      if (elapsed < COOLDOWN_MS) {
        const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
        throw new AppError(`Lütfen ${remaining} saniye bekleyin`, 429);
      }
    }

    const log = await this.attendanceRepo.create({
      user_id:        userId,
      user_name:      userName,
      type,
      ip_address:     ip,
      latitude:       latitude ?? null,
      longitude:      longitude ?? null,
      status:         'success',
      is_remote:      false,
      manual_entry:   false,
      offline_queued: isOffline,
    }, companyId);

    const managerId = await this.userRepo?.findById(userId, companyId)
      .then(u => u?.manager_id ?? null).catch(() => null) ?? null;
    emitter.emit('attendance:checkin', { userId, userName, type, companyId, managerId });

    // Çıkış ise otomatik mesai kontrolü — PDKS-main mantığı
    if (type === 'out' && log.status === 'success') {
      this._checkAutoOvertime(userId, userName, companyId, new Date(log.timestamp), settings).catch(() => {/* sessiz hata */});
    }

    return log;
  }

  private async _checkAutoOvertime(
    userId:    string,
    userName:  string,
    companyId: string,
    exitTime:  Date,
    settings:  { shift_end?: string | null; rounding_threshold_minutes?: number | null; },
  ) {
    if (!this.overtimeRepo || !this.userRepo) return;

    const [eH, eM] = (String(settings.shift_end ?? '18:00')).slice(0,5).split(':').map(Number);
    const threshold = settings.rounding_threshold_minutes ?? 30;

    const shiftEnd = new Date(exitTime);
    shiftEnd.setHours(eH, eM, 0, 0);

    // Eşik: vardiya bitişi + rounding threshold
    const thresholdTime = shiftEnd.getTime() + threshold * 60_000;
    if (exitTime.getTime() <= thresholdTime) return;

    const dateStr = exitTime.toISOString().split('T')[0];

    // Aynı gün için zaten mesai kaydı var mı?
    const { rows: existing } = await this.overtimeRepo.findPage({
      companyId, userId, page: 1, limit: 1,
    });
    if (existing.some(r => r.date.toString().startsWith(dateStr))) return;

    // Manager ID
    const user = await this.userRepo.findById(userId, companyId);
    if (!user?.manager_id) return;

    const overtimeHours = parseFloat(
      ((exitTime.getTime() - shiftEnd.getTime()) / 3_600_000).toFixed(1)
    );
    if (overtimeHours <= 0) return;

    await this.overtimeRepo.createOvertime({
      company_id:  companyId,
      user_id:     userId,
      user_name:   userName,
      manager_id:  user.manager_id,
      date:        dateStr,
      hours:       overtimeHours,
      description: `Otomatik Sistem Kaydı (${exitTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} çıkış)`,
    });
  }

  async getStatus(userId: string, companyId: string): Promise<AttendanceStatus> {
    const last = await this.attendanceRepo.findLast(userId, companyId);
    const isInside = last?.type === 'in';
    let cooldownMs = 0;

    if (last) {
      const elapsed = Date.now() - new Date(last.timestamp).getTime();
      cooldownMs = Math.max(0, COOLDOWN_MS - elapsed);
    }

    return { isInside, lastEntry: last, cooldownMs };
  }

  async getTodayLogs(userId: string, companyId: string): Promise<AttendanceRow[]> {
    return this.attendanceRepo.findToday(companyId, userId);
  }

  async getPage(
    companyId: string,
    role: string,
    userId: string,
    query: { page?: number; limit?: number; month?: string; targetUserId?: string }
  ): Promise<{ rows: AttendanceRow[]; total: number; page: number; limit: number }> {
    const { page, limit } = this.paginate(query.page, query.limit);
    const isAdmin = role === 'admin';
    const isMudur = role === 'mudur';

    const result = await this.attendanceRepo.findPage({
      companyId,
      userId:    isAdmin ? query.targetUserId : (isMudur ? undefined : userId),
      managerId: isMudur ? userId : undefined,
      page,
      limit,
      month: query.month,
    });
    return { ...result, page, limit };
  }

  async getTodayStats(companyId: string) {
    const settings   = await this.settingsRepo.get(companyId);
    const shiftStart = settings.shift_start
      ? String(settings.shift_start).slice(0, 5)
      : '09:00';
    const tolerance  = settings.rounding_threshold_minutes ?? 0;
    return this.attendanceRepo.getTodayStats(companyId, shiftStart, tolerance);
  }

  async getPendingManual(companyId: string) {
    return this.attendanceRepo.findPendingManual(companyId);
  }

  async approveManual(id: string, companyId: string) {
    return this.attendanceRepo.approveManual(id, companyId);
  }

  async createManual(data: {
    companyId: string; userId: string; userName: string;
    type: 'in' | 'out'; timestamp: string; ipAddress?: string;
  }): Promise<AttendanceRow> {
    return this.attendanceRepo.createManual({
      company_id: data.companyId, user_id: data.userId, user_name: data.userName,
      type: data.type, timestamp: data.timestamp, ip_address: data.ipAddress ?? null,
    });
  }

  async updateRecord(id: string, companyId: string, data: { type?: 'in' | 'out'; timestamp?: string }): Promise<AttendanceRow | null> {
    return this.attendanceRepo.updateRecord(id, companyId, data);
  }

  async deleteRecord(id: string, companyId: string, deletedBy: string): Promise<void> {
    await this.attendanceRepo.softDeleteRecord(id, companyId, deletedBy);
  }

  async getQrValue(companyId: string): Promise<{ value: string; expiresIn: number }> {
    const settings = await this.settingsRepo.get(companyId);
    const window   = Math.floor(Date.now() / 30_000);
    const token    = this._hmacWindow(settings.qr_secret, companyId, window);
    const expiresIn = 30 - (Math.floor(Date.now() / 1000) % 30);

    return { value: `PDKS:${companyId}:${token}`, expiresIn };
  }

  private _validateQr(qrValue: string, secret: string, companyId: string) {
    if (!qrValue) throw new AppError('QR kodu gerekli', 400);

    const parts = qrValue.split(':');
    if (parts.length !== 3 || parts[0] !== 'PDKS' || parts[1] !== companyId) {
      throw new AppError('Geçersiz QR kodu', 400);
    }

    const token  = parts[2];
    const window = Math.floor(Date.now() / 30_000);

    // Mevcut pencere + önceki pencere (30 sn tolerans)
    const valid = [window, window - 1, window + 1].some(
      (w) => this._hmacWindow(secret, companyId, w) === token
    );

    if (!valid) throw new AppError('QR kodu süresi dolmuş veya geçersiz', 400);
  }

  private _hmacWindow(secret: string, companyId: string, window: number): string {
    return createHmac('sha256', secret)
      .update(`${companyId}:${window}`)
      .digest('hex')
      .slice(0, 8);
  }
}
