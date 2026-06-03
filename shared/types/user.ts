export type RoleName = 'admin' | 'mudur' | 'takim_lideri' | 'personel' | 'deleted';

export interface UserProfile {
  id: string;
  company_id: string;
  personnel_id: string;
  name: string;
  title?: string;
  email?: string;
  role: RoleName;
  manager_id?: string;
  leave_balance: number;
  start_date?: string;
  birth_date?: string;
  can_remote_check_in: boolean;
  allowed_device?: string;
  avatar_path?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRow extends UserProfile {
  password_hash: string;
  device_id?: string;
  token_version: number;
  is_deleted: boolean;
  deleted_at?: string;
}
