ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ar_manual_rotation_deg integer NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.normalize_ar_rotation_deg()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ar_manual_rotation_deg := ((COALESCE(NEW.ar_manual_rotation_deg, 0) % 360) + 360) % 360;
  NEW.ar_manual_rotation_deg := ROUND(NEW.ar_manual_rotation_deg::numeric / 90.0)::integer * 90;

  IF NEW.ar_manual_rotation_deg = 360 THEN
    NEW.ar_manual_rotation_deg := 0;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_normalize_ar_rotation_deg ON public.products;
CREATE TRIGGER trg_normalize_ar_rotation_deg
BEFORE INSERT OR UPDATE OF ar_manual_rotation_deg ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.normalize_ar_rotation_deg();