import { Router } from 'express';
import { requireAuth } from '../../../middleware/auth.js';
import { requirePermission } from '../../../middleware/roles.js';
import { AttendanceRepository } from '../../../repositories/AttendanceRepository.js';
import { LeaveRepository } from '../../../repositories/LeaveRepository.js';
import { OvertimeRepository } from '../../../repositories/OvertimeRepository.js';
import { HolidayRepository } from '../../../repositories/HolidayRepository.js';
import { UserRepository } from '../../../repositories/UserRepository.js';
import { AuditRepository } from '../../../repositories/AuditRepository.js';
import { SettingsRepository } from '../../../repositories/SettingsRepository.js';
import type { Request, Response, NextFunction } from 'express';

const router = Router();

const attendanceRepo = new AttendanceRepository();
const leaveRepo      = new LeaveRepository();
const overtimeRepo   = new OvertimeRepository();
const holidayRepo    = new HolidayRepository();
const userRepo       = new UserRepository();
const auditRepo      = new AuditRepository();
const settingsRepo   = new SettingsRepository();

router.use(requireAuth);

// GET /api/v1/admin/dashboard — Genel Bakış sayfası için canlı özet veriler
router.get('/', requirePermission('dashboard:view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { company_id: companyId } = req.user!;

    const settings = await settingsRepo.get(companyId);
    const todayStats = await attendanceRepo.getTodayStats(companyId, settings.shift_start);

    const [pendingLeaves, pendingOvertime, users, activity] = await Promise.all([
      leaveRepo.findPage({ companyId, status: 'pending', page: 1, limit: 5 }),
      overtimeRepo.findPage({ companyId, status: 'pending', page: 1, limit: 5 }),
      userRepo.findActive(companyId),
      auditRepo.findPage({ companyId, page: 1, limit: 6 }),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const thisYear = new Date().getFullYear();
    const [holidaysThisYear, holidaysNextYear] = await Promise.all([
      holidayRepo.findByYear(companyId, thisYear),
      holidayRepo.findByYear(companyId, thisYear + 1),
    ]);
    const upcomingHolidays = [...holidaysThisYear, ...holidaysNextYear]
      .filter(h => h.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 3);

    const deptCounts = new Map<string, number>();
    for (const u of users) {
      const key = u.title?.trim() || 'Belirtilmemiş';
      deptCounts.set(key, (deptCounts.get(key) ?? 0) + 1);
    }
    const departments = [...deptCounts.entries()]
      .map(([dept, count]) => ({ dept, count }))
      .sort((a, b) => b.count - a.count);

    const roleCounts = { admin: 0, mudur: 0, takim_lideri: 0, personel: 0 };
    for (const u of users) {
      if (u.role in roleCounts) roleCounts[u.role as keyof typeof roleCounts]++;
    }

    res.json({
      success: true,
      present:    todayStats.present,
      presentList: todayStats.presentList,
      onLeave:    todayStats.onLeave,
      onLeaveList: todayStats.onLeaveList,
      totalStaff: todayStats.totalStaff,
      pendingLeaves:   pendingLeaves.total,
      pendingOvertime: pendingOvertime.total,
      pendingLeaveRows: pendingLeaves.rows.map(l => ({
        name: l.user_name, start_date: l.start_date, end_date: l.end_date, days: l.days,
      })),
      pendingOvertimeRows: pendingOvertime.rows.map(o => ({
        name: o.user_name, date: o.date, hours: o.hours,
      })),
      upcomingHolidays: upcomingHolidays.map(h => ({ name: h.name, date: h.date })),
      departments,
      roleCounts,
      recentActivity: activity.rows.map(a => ({
        actor: a.actor_name, action: a.action, target_table: a.target_table, created_at: a.created_at,
      })),
    });
  } catch (err) { next(err); }
});

export default router;
