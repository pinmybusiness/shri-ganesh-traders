-- ============================================================
-- ROLES: Admin aur Staff  (Supabase SQL Editor me paste karke Run)
--
-- profiles table har login user ka role rakhti hai.
--   role = 'admin'  -> sab kuch kar sakta hai
--   role = 'staff'  -> limited (default)
-- ============================================================

create table if not exists profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'staff',   -- 'admin' | 'staff'
  name       text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Har user apna profile (role) padh sake
drop policy if exists "read own profile" on profiles;
create policy "read own profile" on profiles
  for select to authenticated using (auth.uid() = id);

-- Naya user banega to auto profile (default = staff)
-- NOTE: search_path + public. zaroori hai, warna "Database error creating new user" aata hai.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Jo users pehle se hain unka profile bana do
insert into profiles (id, name)
select id, email from auth.users
on conflict (id) do nothing;

-- ============================================================
-- ⬇️ ADMIN set karo: yahan apna (malik ka) login email daalo
-- ============================================================
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'ganeshenterprisessmp83@gmail.com');

-- Baaki sab 'staff' rahenge (default).
-- Staff ka naya login Supabase > Authentication > Add user se banao
-- (woh apne aap staff ban jayega).

-- Check: kaun kya hai
-- select p.role, u.email from profiles p join auth.users u on u.id = p.id;

-- Done! ✅
