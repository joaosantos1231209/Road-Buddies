-- 0001_business_rules_updates.sql
-- Business rules update: trips, cities, and new sp_requests table

BEGIN;

-- 1) trips updates
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS vehicle_type text,
  ADD COLUMN IF NOT EXISTS trip_vehicle_details text,
  ADD COLUMN IF NOT EXISTS hidden boolean NOT NULL DEFAULT false;

-- Ensure origin_id and destination_id columns exist as integer references to cities(id)
ALTER TABLE public.trips
  ADD COLUMN IF NOT EXISTS origin_id integer,
  ADD COLUMN IF NOT EXISTS destination_id integer;

-- Ensure foreign keys exist (only add if missing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trips_origin_id_cities_id_fk'
      AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE public.trips
      ADD CONSTRAINT trips_origin_id_cities_id_fk
      FOREIGN KEY (origin_id)
      REFERENCES public.cities(id)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'trips_destination_id_cities_id_fk'
      AND conrelid = 'public.trips'::regclass
  ) THEN
    ALTER TABLE public.trips
      ADD CONSTRAINT trips_destination_id_cities_id_fk
      FOREIGN KEY (destination_id)
      REFERENCES public.cities(id)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
  END IF;
END $$;

-- 2) cities updates
ALTER TABLE public.cities
  ADD COLUMN IF NOT EXISTS is_office boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 3) sp_requests table
CREATE TABLE IF NOT EXISTS public.sp_requests (
  id serial PRIMARY KEY,
  user_id varchar(128) NOT NULL,
  destination_id integer NOT NULL,
  date_needed timestamptz NOT NULL,
  justification text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sp_requests_user_id_users_id_fk
    FOREIGN KEY (user_id)
    REFERENCES public.users(id)
    ON DELETE CASCADE,
  CONSTRAINT sp_requests_destination_id_cities_id_fk
    FOREIGN KEY (destination_id)
    REFERENCES public.cities(id)
    ON DELETE NO ACTION
    ON UPDATE NO ACTION
);

-- Optional but useful indexes for common filtering
CREATE INDEX IF NOT EXISTS sp_requests_user_id_idx ON public.sp_requests(user_id);
CREATE INDEX IF NOT EXISTS sp_requests_destination_id_idx ON public.sp_requests(destination_id);
CREATE INDEX IF NOT EXISTS sp_requests_date_needed_idx ON public.sp_requests(date_needed);

COMMIT;
