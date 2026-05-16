import { environment } from '../../../environments/environment';

export const SUPABASE_CONFIG = {
  url: import.meta.env['VITE_SUPABASE_URL'] || environment.SUPABASE_URL,
  anonKey: import.meta.env['VITE_SUPABASE_ANON_KEY'] || environment.SUPABASE_ANON_KEY,
} as const;
