-- Run this in the Supabase SQL editor if pending members do not become active
-- after the demo payment flow. It lets the frontend activate the matching
-- users and members rows through one RPC call.

create or replace function public.gymster_activate_member_account(
  target_user_id uuid default null,
  target_member_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_user_id uuid := target_user_id;
  resolved_member_id uuid := target_member_id;
begin
  if resolved_member_id is null and resolved_user_id is not null then
    select member_id
      into resolved_member_id
      from public.members
     where user_id = resolved_user_id
     limit 1;
  end if;

  if resolved_user_id is null and resolved_member_id is not null then
    select user_id
      into resolved_user_id
      from public.members
     where member_id = resolved_member_id
     limit 1;
  end if;

  if resolved_user_id is null or resolved_member_id is null then
    raise exception 'Cannot activate member account without user_id and member_id';
  end if;

  update public.users
     set account_status = 'active',
         updated_at = now()
   where user_id = resolved_user_id;

  update public.members
     set status = 'active',
         join_date = coalesce(join_date, current_date),
         updated_at = now()
   where member_id = resolved_member_id;

  return jsonb_build_object(
    'user_id', resolved_user_id,
    'member_id', resolved_member_id,
    'account_status', 'active',
    'member_status', 'active'
  );
end;
$$;

grant execute on function public.gymster_activate_member_account(uuid, uuid) to anon, authenticated;
