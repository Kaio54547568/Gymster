alter table public.equipment drop constraint if exists equipment_status_check;

alter table public.equipment
add constraint equipment_status_check check (
  status in ('active', 'in_use', 'broken', 'under_maintenance', 'retired')
);
