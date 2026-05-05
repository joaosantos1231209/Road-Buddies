-- 0002_sp_requests_origin.sql
-- Add optional origin_id to sp_requests table

ALTER TABLE public.sp_requests
  ADD COLUMN IF NOT EXISTS origin_id integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'sp_requests_origin_id_cities_id_fk'
      AND conrelid = 'public.sp_requests'::regclass
  ) THEN
    ALTER TABLE public.sp_requests
      ADD CONSTRAINT sp_requests_origin_id_cities_id_fk
      FOREIGN KEY (origin_id)
      REFERENCES public.cities(id)
      ON DELETE NO ACTION
      ON UPDATE NO ACTION;
  END IF;
END $$;
