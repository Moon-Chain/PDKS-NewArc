export interface Company {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  max_users: number;
  is_active: boolean;
  trial_ends_at?: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CompanyRow extends Company {
  // DB row — same as Company for now
}
