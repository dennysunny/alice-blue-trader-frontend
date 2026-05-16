import { environment } from '../../../environments/environment';

export const SUPABASE_CONFIG = {
  url: environment.SUPABASE_URL,
  anonKey: environment.SUPABASE_ANON_KEY,
} as const;
