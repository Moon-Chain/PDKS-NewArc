import type { BasePage } from '../../ts/core/BasePage.js';
import { makeAdminPlaceholder } from './pages/PlaceholderPage.js';

export type AdminModuleGroup = 'operasyon' | 'insan-kaynaklari' | 'ayarlar' | 'sistem';

// Router._render'ın kabul ettiği "sayfa sınıfı" şekli — somut (non-abstract) ctor.
export type AdminPageConstructor = new (container: HTMLElement) => BasePage;

export interface AdminModule {
  id: string;
  label: string;
  icon: string;              // lucide icon adı
  path: string;              // '/admin/users'
  permission: string;        // 'user:manage' — V1'de her zaman true (ADMIN-PANEL.md Bölüm 3)
  group: AdminModuleGroup;
  title: string;             // sayfa başlığı
  subtitle: string;          // sayfa alt yazısı
  locked?: { note: string };
  loader: () => Promise<AdminPageConstructor>;
}

// NOT: Aşağıdaki loader'lar Kademe 4-10'da gerçek sayfalarla değiştirilecek.
// Şimdilik tümü PlaceholderPage'e işaret eder (Kademe 1 — iskelet).
export const ADMIN_MODULES: AdminModule[] = [
  // ── Operasyon ──────────────────────────────────────────────
  {
    id: 'dashboard', label: 'Genel Bakış', icon: 'layout-dashboard', path: '/admin',
    permission: 'dashboard:view', group: 'operasyon',
    title: 'Genel Bakış', subtitle: 'Şirketinizin günlük özeti',
    loader: async () => (await import('./pages/DashboardPage.js')).DashboardPage,
  },
  {
    id: 'movements', label: 'Hareketler', icon: 'clock', path: '/admin/movements',
    permission: 'attendance:view', group: 'operasyon',
    title: 'Hareketler', subtitle: 'Tüm personelin giriş/çıkış kayıtları',
    loader: async () => (await import('./pages/MovementsPage.js')).MovementsPage,
  },
  {
    id: 'approvals', label: 'Onaylar', icon: 'check-check', path: '/admin/approvals',
    permission: 'leave:approve', group: 'operasyon',
    title: 'Onaylar', subtitle: 'Bekleyen izin ve mesai talepleri',
    loader: async () => (await import('./pages/ApprovalsPage.js')).ApprovalsPage,
  },

  // ── İnsan Kaynakları ───────────────────────────────────────
  {
    id: 'users', label: 'Personel', icon: 'users', path: '/admin/users',
    permission: 'user:manage', group: 'insan-kaynaklari',
    title: 'Personel', subtitle: 'Personel listesi ve yönetimi',
    loader: async () => (await import('./pages/UsersPage.js')).UsersPage,
  },
  {
    id: 'leaves', label: 'İzinler', icon: 'calendar-days', path: '/admin/leaves',
    permission: 'leave:view', group: 'insan-kaynaklari',
    title: 'İzinler', subtitle: 'İzin talepleri ve bakiyeler',
    loader: async () => (await import('./pages/LeavesPage.js')).LeavesPage,
  },
  {
    id: 'overtime', label: 'Mesai', icon: 'zap', path: '/admin/overtime',
    permission: 'overtime:view', group: 'insan-kaynaklari',
    title: 'Mesai', subtitle: 'Mesai talepleri ve kayıtları',
    loader: async () => (await import('./pages/OvertimePage.js')).OvertimePage,
  },
  {
    id: 'reports', label: 'Raporlar', icon: 'file-spreadsheet', path: '/admin/reports',
    permission: 'reports:view', group: 'insan-kaynaklari',
    title: 'Raporlar', subtitle: 'Excel raporu indir',
    loader: async () => (await import('./pages/ReportsPage.js')).ReportsPage,
  },

  // ── Ayarlar ────────────────────────────────────────────────
  {
    id: 'holidays', label: 'Tatil Günleri', icon: 'sun', path: '/admin/holidays',
    permission: 'settings:view', group: 'ayarlar',
    title: 'Tatil Günleri', subtitle: 'Resmi ve şirket tatilleri',
    loader: async () => (await import('./pages/HolidaysPage.js')).HolidaysPage,
  },
  {
    id: 'settings', label: 'Şirket Ayarları', icon: 'settings', path: '/admin/settings',
    permission: 'settings:manage', group: 'ayarlar',
    title: 'Şirket Ayarları', subtitle: 'Ofis IP, vardiya, mola kuralları',
    loader: async () => (await import('./pages/SettingsPage.js')).SettingsPage,
  },

  // ── Sistem ─────────────────────────────────────────────────
  {
    id: 'audit', label: 'Aktivite Geçmişi', icon: 'history', path: '/admin/audit',
    permission: 'audit:view', group: 'sistem',
    title: 'Aktivite Geçmişi', subtitle: 'Kim ne zaman ne yaptı',
    loader: async () => (await import('./pages/AuditLogPage.js')).AuditLogPage,
  },
  {
    id: 'branches', label: 'Şubeler', icon: 'map-pin', path: '/admin/branches',
    permission: 'branch:manage', group: 'sistem',
    title: 'Şubeler', subtitle: 'Şube yönetimi',
    locked: { note: 'Kademe 1' },
    loader: () => Promise.resolve(makeAdminPlaceholder('Şube Sistemi',
      'Bu modül Kademe 1 kapsamında eklenecek. Birden fazla şubesi olan şirketler için şube bazlı personel ve hareket filtrelemesi sağlayacak.')),
  },
  {
    id: 'roles', label: 'Rol & Yetki', icon: 'shield', path: '/admin/roles',
    permission: 'role:manage', group: 'sistem',
    title: 'Rol & Yetki', subtitle: 'Özel roller ve izin atamaları',
    locked: { note: 'Kademe 2' },
    loader: () => Promise.resolve(makeAdminPlaceholder('Rol & Yetki Yönetimi',
      'Bu modül Kademe 2 kapsamında eklenecek. RBAC veritabanı (roller, izinler) zaten hazır — bu sayfa admin\'in özel roller oluşturup yetki ataması yapmasını sağlayacak.')),
  },
  {
    id: 'billing', label: 'Plan & Faturalama', icon: 'credit-card', path: '/admin/billing',
    permission: 'billing:manage', group: 'sistem',
    title: 'Plan & Faturalama', subtitle: 'Abonelik ve fatura yönetimi',
    locked: { note: 'Kademe 3' },
    loader: () => Promise.resolve(makeAdminPlaceholder('Plan & Faturalama',
      'Bu modül Kademe 3 (SaaS) kapsamında eklenecek. Abonelik planı, kota ve fatura yönetimi burada olacak.')),
  },
];

export const ADMIN_GROUP_LABELS: Record<AdminModuleGroup, string> = {
  operasyon:          'Operasyon',
  'insan-kaynaklari': 'İnsan Kaynakları',
  ayarlar:            'Ayarlar',
  sistem:             'Sistem',
};

// Sidebar'da görünmeyen, sadece router için ek rotalar (örn. bildirim çanından açılan sayfa).
export const ADMIN_EXTRA_ROUTES: AdminModule[] = [
  {
    id: 'notifications', label: 'Bildirimler', icon: 'bell', path: '/admin/notifications',
    permission: 'dashboard:view', group: 'operasyon',
    title: 'Bildirimler', subtitle: 'Tüm bildirimleriniz',
    loader: async () => (await import('./pages/NotificationsPage.js')).NotificationsPage,
  },
];

export function findAdminModule(path: string): AdminModule | undefined {
  return ADMIN_MODULES.find(m => m.path === path)
      ?? ADMIN_EXTRA_ROUTES.find(m => m.path === path);
}
