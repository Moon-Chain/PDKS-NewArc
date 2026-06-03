export const EVENTS = {
  ATTENDANCE_CHECKIN:   'attendance:checkin',
  ATTENDANCE_CHECKOUT:  'attendance:checkout',
  LEAVE_REQUESTED:      'leave:requested',
  LEAVE_APPROVED:       'leave:approved',
  LEAVE_REJECTED:       'leave:rejected',
  OVERTIME_REQUESTED:   'overtime:requested',
  OVERTIME_APPROVED:    'overtime:approved',
  NOTIFICATION_CREATED: 'notification:created',
} as const;

export const SSE_EVENTS = {
  ATTENDANCE:    'attendance',
  NEW_APPROVAL:  'new-approval',
  NOTIFICATION:  'notification',
  TEAM_MOVEMENT: 'team-movement',
} as const;

export const PAGINATION = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT:     100,
} as const;

export const FILE_LIMITS = {
  AVATAR_BYTES: 2 * 1024 * 1024,
  ATTACH_BYTES: 5 * 1024 * 1024,
} as const;

export const TOKEN_TTL = {
  JWT_SECONDS:   8 * 60 * 60,
  RESET_SECONDS: 60 * 60,
} as const;

export const ROLES = {
  ADMIN:       'admin',
  MUDUR:       'mudur',
  TAKIM:       'takim_lideri',
  PERSONEL:    'personel',
} as const;
