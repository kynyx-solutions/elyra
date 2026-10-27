-- Homepage content: notification bar, section images and review photos.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run. Safe to run again.

-- 1. Allow a "home" settings row (notification bar + homepage images)
alter table public.settings drop constraint if exists settings_key_check;
alter table public.settings add constraint settings_key_check check (key in ('site','pricing','alerts','home'));

-- Visitors can read it; any admin (owner or staff) can change it, like the rates
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select using (key in ('site','pricing','home') or public.is_admin());
drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings for insert with check (public.is_owner() or (key in ('pricing','home') and public.is_admin()));
drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings for update using (public.is_owner() or (key in ('pricing','home') and public.is_admin())) with check (public.is_owner() or (key in ('pricing','home') and public.is_admin()));

-- 2. Photos on customer reviews (up to 3 per review)
alter table public.reviews add column if not exists images text[] not null default '{}';
