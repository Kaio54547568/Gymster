create or replace function public.validate_package_change_request()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.package_change_requests
    where member_id = new.member_id
      and status = 'pending'
      and package_change_request_id is distinct from new.package_change_request_id
  ) then
    raise exception 'You already have a pending package request';
  end if;

  if exists (
    select 1 from public.member_packages
    where member_id = new.member_id
      and status in ('pending_payment', 'pending_activation')
  ) then
    raise exception 'PENDING_ACTIVATION_EXISTS';
  end if;

  return new;
end;
$$;

drop trigger if exists check_package_change_request on public.package_change_requests;
create trigger check_package_change_request
before insert or update on public.package_change_requests
for each row execute function public.validate_package_change_request();
