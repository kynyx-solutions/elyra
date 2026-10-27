-- ============================================================
-- ELYRA ADMIN: database schema, security rules and storage.
-- Run ONCE in Supabase: Dashboard → SQL Editor → New query →
-- paste this whole file → Run. Then run seed.sql.
--
-- BEFORE RUNNING: replace OWNER_EMAIL_HERE (near the bottom)
-- with the email address the owner will log in with.
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- helpers ----------
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------- staff & roles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text default '',
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now()
);

create table if not exists public.staff_invites (
  email text primary key,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  invited_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'owner');
$$;

-- Only invited emails get dashboard access when they sign up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv record;
begin
  select * into inv from staff_invites where lower(email) = lower(new.email);
  if found then
    insert into profiles (id, email, role, full_name)
    values (new.id, new.email, inv.role, coalesce(new.raw_user_meta_data->>'full_name', ''))
    on conflict (id) do nothing;
    delete from staff_invites where lower(email) = lower(new.email);
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- catalogue ----------
create table if not exists public.products (
  id text primary key,                          -- SKU, e.g. ELR-R001
  name text not null,
  category text not null check (category in ('rings','earrings','pendants','bracelets','bridal','mangalsutra')),
  occasions text[] not null default '{}',
  description text not null default '',
  shape text not null default '',
  cut text not null default '',
  size text not null default '',
  engraving boolean not null default false,
  featured boolean not null default false,
  made_to_order boolean not null default true,
  status text not null default 'active' check (status in ('active','hidden','sold_out')),
  stock integer not null default 0 check (stock >= 0),
  images text[] not null default '{}',
  colour_images jsonb not null default '{}'::jsonb,
  custom jsonb not null,
  sort integer not null default 100,
  sample boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists products_touch on public.products;
create trigger products_touch before update on public.products for each row execute function public.touch_updated_at();

-- ---------- blog ----------
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text not null default '',
  body text not null default '',                -- Markdown
  cover_image text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','published')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  author_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists posts_touch on public.posts;
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();

-- ---------- reviews / testimonials ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  city text default '',
  text text not null,
  stars integer not null default 5 check (stars between 1 and 5),
  source text not null default 'Google',
  published boolean not null default true,
  sort integer not null default 100,
  images text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ---------- site settings, rates, alerts ----------
create table if not exists public.settings (
  key text primary key check (key in ('site','pricing','alerts','home')),
  value jsonb not null,
  updated_at timestamptz not null default now()
);
drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings for each row execute function public.touch_updated_at();

-- ---------- customers ----------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  city text,
  ring_size text,
  birthday date,
  anniversary date,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists customers_phone_key on public.customers (phone) where phone is not null and phone <> '';
drop trigger if exists customers_touch on public.customers;
create trigger customers_touch before update on public.customers for each row execute function public.touch_updated_at();

-- ---------- leads (enquiries, consultations, bespoke requests, order clicks) ----------
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type text not null check (type in ('enquiry','consultation','bespoke','order','call')),
  status text not null default 'new' check (status in ('new','contacted','quoted','won','lost')),
  name text,
  phone text,
  email text,
  city text,
  source_page text,
  product_id text,
  product_name text,
  config jsonb,
  estimated_price numeric,
  details jsonb not null default '{}'::jsonb,
  photos text[] not null default '{}',
  follow_up date,
  notes text,
  assigned_to uuid references public.profiles(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null
);
create index if not exists leads_created_idx on public.leads (created_at desc);
create index if not exists leads_status_idx on public.leads (status);
drop trigger if exists leads_touch on public.leads;
create trigger leads_touch before update on public.leads for each row execute function public.touch_updated_at();

-- ---------- orders ----------
create sequence if not exists public.order_no_seq;
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_no text unique,
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  product_id text references public.products(id) on delete set null,
  description text not null default '',
  config jsonb,
  amount numeric not null default 0,
  advance_paid numeric not null default 0,
  status text not null default 'quoted' check (status in ('quoted','confirmed','in_production','ready','dispatched','delivered','cancelled')),
  due_date date,
  tracking text,
  notes text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.set_order_no() returns trigger
language plpgsql as $$
begin
  if new.order_no is null or new.order_no = '' then
    new.order_no := 'ELY-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_no_seq')::text, 4, '0');
  end if;
  return new;
end $$;
drop trigger if exists orders_no on public.orders;
create trigger orders_no before insert on public.orders for each row execute function public.set_order_no();
drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();

-- ============================================================
-- SECURITY (Row Level Security)
-- Visitors (anon): read active products, published posts and reviews,
-- public settings; submit leads. Everything else needs an admin login.
-- ============================================================
alter table public.profiles      enable row level security;
alter table public.staff_invites enable row level security;
alter table public.products      enable row level security;
alter table public.posts         enable row level security;
alter table public.reviews       enable row level security;
alter table public.settings      enable row level security;
alter table public.customers     enable row level security;
alter table public.leads         enable row level security;
alter table public.orders        enable row level security;

-- profiles
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update using (id = auth.uid() or public.is_owner()) with check (id = auth.uid() or public.is_owner());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete using (public.is_owner() and id <> auth.uid());

-- staff invites (owner only)
drop policy if exists invites_owner on public.staff_invites;
create policy invites_owner on public.staff_invites for all using (public.is_owner()) with check (public.is_owner());

-- products
drop policy if exists products_public_read on public.products;
create policy products_public_read on public.products for select using (status <> 'hidden' or public.is_admin());
drop policy if exists products_admin_write on public.products;
create policy products_admin_write on public.products for all using (public.is_admin()) with check (public.is_admin());

-- posts
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts for select using (status = 'published' or public.is_admin());
drop policy if exists posts_admin_write on public.posts;
create policy posts_admin_write on public.posts for all using (public.is_admin()) with check (public.is_admin());

-- reviews
drop policy if exists reviews_public_read on public.reviews;
create policy reviews_public_read on public.reviews for select using (published or public.is_admin());
drop policy if exists reviews_admin_write on public.reviews;
create policy reviews_admin_write on public.reviews for all using (public.is_admin()) with check (public.is_admin());

-- settings: site, pricing and home (notification bar, homepage images) are public; alerts are private.
-- Any admin can update rates and homepage content; only the owner can change site settings and alerts.
drop policy if exists settings_read on public.settings;
create policy settings_read on public.settings for select using (key in ('site','pricing','home') or public.is_admin());
drop policy if exists settings_insert on public.settings;
create policy settings_insert on public.settings for insert with check (public.is_owner() or (key in ('pricing','home') and public.is_admin()));
drop policy if exists settings_update on public.settings;
create policy settings_update on public.settings for update using (public.is_owner() or (key in ('pricing','home') and public.is_admin())) with check (public.is_owner() or (key in ('pricing','home') and public.is_admin()));

-- customers & orders: admins only
drop policy if exists customers_admin on public.customers;
create policy customers_admin on public.customers for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists orders_admin on public.orders;
create policy orders_admin on public.orders for all using (public.is_admin()) with check (public.is_admin());

-- leads: anyone can submit a NEW lead; only admins can read or change them.
drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads for insert to anon, authenticated
  with check (status = 'new' and notes is null and assigned_to is null and customer_id is null and follow_up is null);
drop policy if exists leads_admin_read on public.leads;
create policy leads_admin_read on public.leads for select using (public.is_admin());
drop policy if exists leads_admin_update on public.leads;
create policy leads_admin_update on public.leads for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists leads_admin_delete on public.leads;
create policy leads_admin_delete on public.leads for delete using (public.is_admin());

-- ============================================================
-- STORAGE
-- media:        public product and blog images (admins upload)
-- lead-uploads: private customer photos from "You dream it, we create it"
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif','image/avif'])
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lead-uploads', 'lead-uploads', false, 10485760, array['image/jpeg','image/png','image/webp','image/heic','image/heif','image/gif'])
on conflict (id) do nothing;

drop policy if exists media_public_read on storage.objects;
create policy media_public_read on storage.objects for select using (bucket_id = 'media');
drop policy if exists media_admin_insert on storage.objects;
create policy media_admin_insert on storage.objects for insert with check (bucket_id = 'media' and public.is_admin());
drop policy if exists media_admin_update on storage.objects;
create policy media_admin_update on storage.objects for update using (bucket_id = 'media' and public.is_admin());
drop policy if exists media_admin_delete on storage.objects;
create policy media_admin_delete on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

drop policy if exists leads_upload_insert on storage.objects;
create policy leads_upload_insert on storage.objects for insert to anon, authenticated with check (bucket_id = 'lead-uploads');
drop policy if exists leads_upload_read on storage.objects;
create policy leads_upload_read on storage.objects for select using (bucket_id = 'lead-uploads' and public.is_admin());
drop policy if exists leads_upload_delete on storage.objects;
create policy leads_upload_delete on storage.objects for delete using (bucket_id = 'lead-uploads' and public.is_admin());

-- ============================================================
-- FIRST OWNER: replace with the owner's login email, then they sign up
-- at <your site>/admin/#/signup with that email to get full access.
-- ============================================================
insert into public.staff_invites (email, role) values ('kynyxsolutions@gmail.com', 'owner')
on conflict (email) do update set role = 'owner';
