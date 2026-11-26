-- NewSmart Homes — Supabase PostgreSQL & Storage Schema
-- Run this SQL script in your Supabase Project SQL Editor to initialize tables and storage.

create extension if not exists "pgcrypto";

-- 1. Properties Table
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null check (category in ('Luxury Homes', 'Land & Plots', 'Estate Developments', 'Commercial')),
  location text not null,
  price bigint not null check (price >= 0),
  price_label text,
  bedrooms integer default 0,
  bathrooms integer default 0,
  area_sqm text not null default '',
  title_document text not null default 'Certificate of Occupancy',
  availability text not null default 'Available' check (availability in ('Available', 'Under Offer', 'Sold Out')),
  featured boolean not null default false,
  description text not null,
  features jsonb not null default '[]'::jsonb,
  image_url text not null,
  gallery_urls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Visitor Enquiries Table
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  interest text not null default 'General Enquiry',
  property_id uuid references public.properties(id) on delete set null,
  property_title text,
  message text not null,
  status text not null default 'New' check (status in ('New', 'Contacted', 'Closed')),
  created_at timestamptz not null default now()
);

-- 3. Admin Settings Table (stores first-run scrypt password hash when ADMIN_PASSWORD env is unset)
create table if not exists public.admin_settings (
  id text primary key,
  password_hash text not null,
  updated_at timestamptz not null default now()
);

-- 4. Row Level Security
alter table public.properties enable row level security;
alter table public.enquiries enable row level security;
alter table public.admin_settings enable row level security;

-- Public read access for properties
drop policy if exists "Public can read properties" on public.properties;
create policy "Public can read properties"
  on public.properties for select
  using (true);

-- Public can submit enquiries
drop policy if exists "Public can insert enquiries" on public.enquiries;
create policy "Public can insert enquiries"
  on public.enquiries for insert
  with check (true);

-- Note: Admin mutations and enquiry reads are executed server-side via Express
-- using SUPABASE_SERVICE_ROLE_KEY, keeping admin credentials and customer PII protected.

-- 5. Storage Bucket for Property Photos
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

drop policy if exists "Public read property-images" on storage.objects;
create policy "Public read property-images"
  on storage.objects for select
  using (bucket_id = 'property-images');
