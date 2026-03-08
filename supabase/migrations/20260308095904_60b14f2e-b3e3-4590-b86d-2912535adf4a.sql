ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS ar_flip_front_back boolean NOT NULL DEFAULT false;