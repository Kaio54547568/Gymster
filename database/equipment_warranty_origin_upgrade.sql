-- Add columns (nullable first so we can backfill existing rows)
alter table public.equipment add column if not exists origin text;
alter table public.equipment add column if not exists warranty_expiry_date date;

-- Backfill existing records
update public.equipment
set origin = coalesce(origin, 'Unknown'),
    warranty_expiry_date = coalesce(warranty_expiry_date, purchase_date, current_date);

-- Set not null constraints
alter table public.equipment alter column origin set not null;
alter table public.equipment alter column warranty_expiry_date set not null;

-- Add check constraint ensuring warranty expiry date is not before purchase date
alter table public.equipment drop constraint if exists check_warranty_expiry_after_purchase;
alter table public.equipment add constraint check_warranty_expiry_after_purchase check (
  purchase_date is null or warranty_expiry_date >= purchase_date
);
