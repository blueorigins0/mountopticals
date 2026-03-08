ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS ar_fit_scale numeric NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS ar_fit_y_offset numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ar_fit_tilt_multiplier numeric NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.products.ar_fit_scale IS 'Per-product AR fit scale multiplier. Default 1.';
COMMENT ON COLUMN public.products.ar_fit_y_offset IS 'Per-product AR vertical offset multiplier relative to eye distance. Default 0.';
COMMENT ON COLUMN public.products.ar_fit_tilt_multiplier IS 'Per-product AR tilt multiplier for roll/2D angle. Default 1.';