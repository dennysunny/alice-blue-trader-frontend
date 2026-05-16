/**
 * Supabase Configuration
 *
 * SETUP STEPS:
 * 1. Go to https://supabase.com → New Project (free)
 * 2. After creation → Settings → API
 * 3. Copy "Project URL" and "anon public" key
 * 4. Set as environment variables in your Render/Vercel deployments:
 *      SUPABASE_URL=https://xxxx.supabase.co
 *      SUPABASE_ANON_KEY=eyJhbGc...
 *
 * SQL SCHEMA (run in Supabase SQL Editor):
 * ─────────────────────────────────────────────────────────────────
 *
 * create table daily_reports (
 *   id               uuid default gen_random_uuid() primary key,
 *   user_id          text not null,
 *   date             date not null,
 *   total_trades     int  not null default 0,
 *   winning_trades   int  not null default 0,
 *   losing_trades    int  not null default 0,
 *   breakeven_trades int  not null default 0,
 *   total_pnl        numeric not null default 0,
 *   gross_profit     numeric not null default 0,
 *   gross_loss       numeric not null default 0,
 *   total_brokerage  numeric not null default 0,
 *   total_quantity   int  not null default 0,
 *   max_drawdown     numeric not null default 0,
 *   notes            text,
 *   created_at       timestamptz default now(),
 *   updated_at       timestamptz default now(),
 *   unique (user_id, date)
 * );
 *
 * create table trades (
 *   id               uuid default gen_random_uuid() primary key,
 *   user_id          text not null,
 *   date             date not null,
 *   instrument_id    text not null,
 *   trading_symbol   text not null,
 *   exchange         text not null,
 *   transaction_type text not null,
 *   product          text not null,
 *   quantity         int  not null,
 *   buy_price        numeric not null default 0,
 *   sell_price       numeric not null default 0,
 *   pnl              numeric not null default 0,
 *   brokerage        numeric not null default 0,
 *   order_id         text,
 *   created_at       timestamptz default now()
 * );
 *
 * create table trading_rules (
 *   id                    uuid default gen_random_uuid() primary key,
 *   user_id               text not null unique,
 *   max_trades_per_day    int  not null default 5,
 *   max_loss_per_day      numeric not null default 2000,
 *   max_loss_per_trade    numeric not null default 500,
 *   max_quantity_per_trade int  not null default 50,
 *   target_per_day        numeric,
 *   notes                 text,
 *   updated_at            timestamptz default now()
 * );
 *
 * -- Enable RLS (Row Level Security) — only users see their own data
 * alter table daily_reports  enable row level security;
 * alter table trades         enable row level security;
 * alter table trading_rules  enable row level security;
 *
 * -- Policies (using Alice Blue userId as the identifier)
 * create policy "own_data" on daily_reports  for all using (user_id = current_setting('app.user_id', true));
 * create policy "own_data" on trades         for all using (user_id = current_setting('app.user_id', true));
 * create policy "own_data" on trading_rules  for all using (user_id = current_setting('app.user_id', true));
 * ─────────────────────────────────────────────────────────────────
 */

import { environment } from '../../../environments/environment';

export const SUPABASE_CONFIG = {
  url: import.meta.env['SUPABASE_URL'] || environment.SUPABASE_URL,
  anonKey: import.meta.env['SUPABASE_ANON_KEY'] || environment.SUPABASE_ANON_KEY,
} as const;
