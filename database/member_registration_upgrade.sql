-- database/member_registration_upgrade.sql

-- 1. Add new columns to members table
alter table public.members add column if not exists occupation text;
alter table public.members add column if not exists address text;
alter table public.members add column if not exists citizen_id text;

-- 2. Create case-insensitive unique constraints
-- email
drop index if exists idx_users_email_lower;
create unique index idx_users_email_lower on public.users (lower(email));
-- username
drop index if exists idx_users_username_lower;
create unique index idx_users_username_lower on public.users (lower(username)) where username is not null and username <> '';

-- 3. Create partial unique constraints for phone and citizen_id
drop index if exists idx_users_phone_number_unique;
create unique index idx_users_phone_number_unique on public.users (phone_number) where phone_number is not null and phone_number <> '';

drop index if exists idx_members_citizen_id_unique;
create unique index idx_members_citizen_id_unique on public.members (citizen_id) where citizen_id is not null and citizen_id <> '';

-- 4. Member Code Sequence and generation function
create sequence if not exists public.member_code_seq start 1;

create or replace function public.generate_member_code()
returns text as $$
declare
  new_code text;
  is_unique boolean;
begin
  loop
    new_code := 'MB-' || lpad(nextval('public.member_code_seq')::text, 6, '0');
    select not exists (
      select 1 from public.members where upper(member_code) = new_code
    ) into is_unique;
    
    exit when is_unique;
  end loop;
  return new_code;
end;
$$ language plpgsql;

-- 5. Case-insensitive unique validation for member_code
drop index if exists idx_members_member_code_lower;
create unique index idx_members_member_code_lower on public.members (lower(member_code)) where member_code is not null and member_code <> '';

-- 6. Backfill existing members who are missing a member_code
do $$
declare
  r record;
begin
  for r in (select member_id from public.members where member_code is null or member_code = '') loop
    update public.members
    set member_code = public.generate_member_code()
    where member_id = r.member_id;
  end loop;
end;
$$;

-- 7. RPC Transaction for creating User and Member profile atomically
create or replace function public.gymster_create_user_and_member_transaction(
  p_email text,
  p_username text,
  p_password_hash text,
  p_first_name text,
  p_last_name text,
  p_phone_number text,
  p_date_of_birth date,
  p_gender text,
  p_citizen_id text,
  p_occupation text,
  p_address text,
  p_member_code text,
  p_health_notes text
) returns jsonb as $$
declare
  v_user_id uuid;
  v_member_id uuid;
  v_member_code text;
begin
  -- Normalize email, username
  p_email := lower(trim(p_email));
  p_username := lower(trim(p_username));
  if p_username = '' then p_username := null; end if;
  
  -- Handle member_code
  v_member_code := upper(trim(p_member_code));
  if v_member_code = '' or v_member_code is null then
    v_member_code := public.generate_member_code();
  else
    -- Validate staff code
    if v_member_code !~ '^[A-Z0-9][A-Z0-9-]{3,31}$' then
      raise exception 'Invalid member code format';
    end if;
    
    -- Check uniqueness explicitly to return friendly error
    if exists (select 1 from public.members where upper(member_code) = v_member_code) then
      raise exception 'Member code % already exists', v_member_code;
    end if;
  end if;

  -- Create user
  insert into public.users (
    email, username, password_hash, first_name, last_name, phone_number, date_of_birth, gender, role, account_status
  ) values (
    p_email, p_username, p_password_hash, trim(p_first_name), trim(p_last_name), nullif(trim(p_phone_number), ''), p_date_of_birth, p_gender, 'member', 'active'
  ) returning user_id into v_user_id;

  -- Create member
  insert into public.members (
    user_id, member_code, health_notes, join_date, status, occupation, address, citizen_id
  ) values (
    v_user_id, v_member_code, trim(p_health_notes), current_date, 'active', trim(p_occupation), trim(p_address), nullif(trim(p_citizen_id), '')
  ) returning member_id into v_member_id;

  return jsonb_build_object(
    'user_id', v_user_id, 
    'member_id', v_member_id, 
    'member_code', v_member_code
  );
end;
$$ language plpgsql security definer;
