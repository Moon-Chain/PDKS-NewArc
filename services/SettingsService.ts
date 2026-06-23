import { randomBytes } from 'crypto';
import { BaseService } from '../core/BaseService.js';
import type { SettingsRepository, SettingsRow } from '../repositories/SettingsRepository.js';

export interface UpdateSettingsInput {
  office_ip?: string | null;
  qr_secret?: string;
  company_name?: string;
  work_days_per_week?: number;
  rounding_threshold_minutes?: number;
  shift_start?: string;
  shift_end?: string;
  qr_rotate_interval_hours?: number;
}

export class SettingsService extends BaseService {
  constructor(private settingsRepo: SettingsRepository) {
    super();
  }

  async get(companyId: string): Promise<SettingsRow> {
    return this.settingsRepo.get(companyId);
  }

  async update(companyId: string, data: UpdateSettingsInput): Promise<SettingsRow> {
    try {
      return await this.settingsRepo.update(companyId, data);
    } catch (err: unknown) {
      // PostgreSQL 42703 = "column does not exist" — migration 003 henüz çalıştırılmamış
      if ((err as { code?: string }).code === '42703') {
        const { qr_rotate_interval_hours, ...rest } = data;
        void qr_rotate_interval_hours;
        return this.settingsRepo.update(companyId, rest);
      }
      throw err;
    }
  }

  generateSecret(): string {
    return randomBytes(16).toString('hex');
  }

  async rotateQrSecret(companyId: string): Promise<string> {
    const secret = this.generateSecret();
    await this.settingsRepo.rotateQrSecret(companyId, secret);
    return secret;
  }
}
