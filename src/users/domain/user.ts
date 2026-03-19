export interface User {
  id: number;
  user_name: string;
  email: string;
  is_active: boolean;
  email_verified: boolean;
  failed_login_attempts: number;
  locked_until: Date | null;
  last_login_at: Date | null;
  password_changed_at: Date;
  created_at: Date;
  updated_at: Date;
}
