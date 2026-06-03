import { BaseRepository } from '../core/BaseRepository.js';
import type { UserRow } from '../shared/types/user.js';

export class UserRepository extends BaseRepository<UserRow> {
  constructor() {
    super('users');
  }

  async findByPersonnelId(personnelId: string, companyId: string): Promise<UserRow | null> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT * FROM users
       WHERE personnel_id = $1 AND company_id = $2 AND role != 'deleted' AND is_deleted = false`,
      [personnelId, companyId]
    );
    return rows[0] || null;
  }

  async findByPersonnelIdGlobal(personnelId: string): Promise<UserRow | null> {
    const { rows } = await this.db.query<UserRow>(
      `SELECT * FROM users
       WHERE personnel_id = $1 AND role != 'deleted' AND is_deleted = false`,
      [personnelId]
    );
    return rows[0] || null;
  }

  async findByManager(managerId: string, companyId: string): Promise<UserRow[]> {
    return this.findAll({
      companyId,
      conditions: [{ column: 'manager_id', value: managerId }],
    });
  }

  async findActive(companyId: string): Promise<UserRow[]> {
    return this.findAll({ companyId });
  }

  async countActive(companyId: string): Promise<number> {
    return this.count(companyId);
  }

  async deductLeaveBalance(userId: string, companyId: string, days: number): Promise<void> {
    await this.db.query(
      `UPDATE users SET leave_balance = GREATEST(0, leave_balance - $1)
       WHERE id = $2 AND company_id = $3`,
      [days, userId, companyId]
    );
  }
}
