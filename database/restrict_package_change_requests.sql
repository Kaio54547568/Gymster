-- Create function to validate package change requests
create or replace function public.validate_package_change_request()
returns trigger
language plpgsql
as $$
declare
  active_pkg_end_date date;
  active_pkg_days_remaining integer;
  has_pending_req boolean;
  has_queued_pkg boolean;
begin
  -- 1. Check if the member already has a pending package change request
  select exists (
    select 1
    from public.package_change_requests
    where member_id = new.member_id
      and status = 'pending'
      and package_change_request_id is distinct from new.package_change_request_id
  ) into has_pending_req;

  if has_pending_req then
    raise exception 'Bạn đã có một yêu cầu đổi/gia hạn gói đang chờ xử lý.';
  end if;

  -- 2. Check if the member has a queued future package (status = 'pending_payment' or active starting in the future)
  select exists (
    select 1
    from public.member_packages
    where member_id = new.member_id
      and (
        status = 'pending_payment'
        or (status = 'active' and start_date > current_date)
      )
  ) into has_queued_pkg;

  if has_queued_pkg then
    raise exception 'Bạn đã có một gói tập đang chờ thanh toán hoặc gói tập tương lai đã được lên lịch.';
  end if;

  -- 3. Check if the member has an active package and if it has more than 5 days remaining
  select end_date into active_pkg_end_date
  from public.member_packages
  where member_id = new.member_id
    and status = 'active'
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  order by created_at desc
  limit 1;

  if active_pkg_end_date is not null then
    active_pkg_days_remaining := active_pkg_end_date - current_date;
    if active_pkg_days_remaining > 5 then
      raise exception 'Gói hiện tại của bạn còn nhiều hơn 5 ngày (% ngày). Bạn chỉ được gửi yêu cầu gia hạn hoặc đổi gói khi gói hiện tại còn tối đa 5 ngày.', active_pkg_days_remaining;
    end if;
  end if;

  return new;
end;
$$;

-- Drop trigger if exists and create it
drop trigger if exists check_package_change_request on public.package_change_requests;
create trigger check_package_change_request
before insert on public.package_change_requests
for each row execute function public.validate_package_change_request();
