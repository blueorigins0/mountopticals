
-- Create trigger for auto-creating profiles on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create custom product attributes system
CREATE TABLE public.product_attribute_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_attribute_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attribute types" ON public.product_attribute_types FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view attribute types" ON public.product_attribute_types FOR SELECT USING (true);

CREATE TABLE public.product_attribute_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  attribute_type_id uuid NOT NULL REFERENCES public.product_attribute_types(id) ON DELETE CASCADE,
  label text NOT NULL,
  value_text text NOT NULL,
  value_image text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.product_attribute_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attribute values" ON public.product_attribute_values FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Anyone can view attribute values" ON public.product_attribute_values FOR SELECT USING (true);
