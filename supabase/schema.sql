-- WearQuote database schema for Supabase.
-- Run this once in the Supabase SQL editor (Project -> SQL Editor -> New query).

-- Designers: one row per designer, linked 1:1 to a Supabase Auth user.
create table if not exists public.designers (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  specialty text not null default '',
  bio text not null default '',
  photo_url text,
  created_at timestamptz not null default now()
);

-- Portfolio items: many per designer.
create table if not exists public.portfolio_items (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.designers (id) on delete cascade,
  image_url text not null,
  title text not null default '',
  description text not null default '',
  created_at timestamptz not null default now()
);

-- Quote requests submitted by clients.
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  client_email text not null,
  materials text[] not null default '{}',
  comments text not null default '',
  photo_urls text[] not null default '{}',
  designer_ids uuid[] not null default '{}',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.designers enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.quotes enable row level security;

-- Designers are public to browse; only the owner can create/edit their own row.
create policy "Designers are publicly readable" on public.designers
  for select using (true);

create policy "Designers can insert their own profile" on public.designers
  for insert with check (auth.uid() = id);

create policy "Designers can update their own profile" on public.designers
  for update using (auth.uid() = id);

-- Portfolio items are public to browse; only the owning designer can manage them.
create policy "Portfolio items are publicly readable" on public.portfolio_items
  for select using (true);

create policy "Designers can insert their own portfolio items" on public.portfolio_items
  for insert with check (auth.uid() = designer_id);

create policy "Designers can update their own portfolio items" on public.portfolio_items
  for update using (auth.uid() = designer_id);

create policy "Designers can delete their own portfolio items" on public.portfolio_items
  for delete using (auth.uid() = designer_id);

-- Quotes: anyone (including anonymous clients) can submit a quote request.
-- Only a designer who was targeted by the request can read it.
create policy "Anyone can submit a quote request" on public.quotes
  for insert with check (true);

-- An empty designer_ids array means "sent to all designers" (broadcast).
create policy "Designers can read quotes addressed to them" on public.quotes
  for select using (
    auth.uid() is not null
    and (auth.uid() = any (designer_ids) or designer_ids = '{}')
  );

-- Storage buckets: create these in the Supabase dashboard (Storage -> New bucket),
-- both set to "Public bucket" so uploaded images can be displayed with a plain URL:
--   1. portfolio      (designer portfolio photos)
--   2. quote-photos   (reference photos clients attach to a quote request)
--
-- Then add these storage policies (Storage -> policies, or via SQL below) so each
-- designer can only manage files inside a folder named after their own user id
-- (e.g. portfolio/<designer_id>/photo.jpg), while clients can upload anonymously
-- into quote-photos but never overwrite or delete existing files.

create policy "Portfolio images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'portfolio');

create policy "Designers can upload to their own portfolio folder"
  on storage.objects for insert
  with check (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Designers can delete from their own portfolio folder"
  on storage.objects for delete
  using (
    bucket_id = 'portfolio'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Quote photos are publicly readable"
  on storage.objects for select
  using (bucket_id = 'quote-photos');

create policy "Anyone can upload a quote photo"
  on storage.objects for insert
  with check (bucket_id = 'quote-photos');
