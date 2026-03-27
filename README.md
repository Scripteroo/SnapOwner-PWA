# SnapOwner – PWA

Instant property intelligence from your phone.

## Setup

```bash
npm install
cp .env.example .env.local  # add Supabase keys (optional for PoC)
npm run dev
```

## Supabase (optional)

```sql
create table properties (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  photo_url text,
  created_at timestamptz default now()
);
alter table properties enable row level security;
create policy "Users can insert" on properties for insert with check (true);
create policy "Users can read" on properties for select using (true);
```

Enable Anonymous Sign-ins in Supabase Auth settings.

## Deploy

Push to GitHub → import in Vercel → auto-deploys.

## Logo

Place your custom logo at `public/logo.png`.
