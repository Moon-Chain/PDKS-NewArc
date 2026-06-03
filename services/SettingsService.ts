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
}

export class SettingsService extends BaseService {
  constructor(private settingsRepo: SettingsRepository) {
    super();
  }

  async get(companyId: string): Promise<SettingsRow> {
    return this.settingsRepo.get(companyId);
  }

  async update(companyId: string, data: UpdateSettingsInput): Promise<SettingsRow> {
    return this.settingsRepo.update(companyId, data);
  }

  generateSecret(): string {
    return randomBytes(16).toString('hex');
  }
}
