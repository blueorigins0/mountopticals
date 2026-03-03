
-- Add AR-specific image and 3D model URL columns to products
ALTER TABLE public.products ADD COLUMN ar_image text DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN ar_model_url text DEFAULT NULL;
