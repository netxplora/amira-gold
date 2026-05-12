
-- Categories
CREATE TABLE public.jewelry_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.jewelry_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads jewelry categories" ON public.jewelry_categories
  FOR SELECT USING (active OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin manages jewelry categories" ON public.jewelry_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Purity enum
CREATE TYPE public.jewelry_purity AS ENUM ('18k', '22k', '24k');
CREATE TYPE public.making_charge_type AS ENUM ('fixed', 'percent');
CREATE TYPE public.jewelry_order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled');

-- Products
CREATE TABLE public.jewelry_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.jewelry_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  sku TEXT NOT NULL UNIQUE,
  description TEXT,
  weight_grams NUMERIC NOT NULL CHECK (weight_grams > 0),
  purity public.jewelry_purity NOT NULL,
  making_charge_type public.making_charge_type NOT NULL DEFAULT 'percent',
  making_charge_value NUMERIC NOT NULL DEFAULT 10,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  thumbnail_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jewelry_products_category ON public.jewelry_products(category_id);
CREATE INDEX idx_jewelry_products_active ON public.jewelry_products(active) WHERE deleted_at IS NULL;

ALTER TABLE public.jewelry_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active jewelry" ON public.jewelry_products
  FOR SELECT USING ((active = true AND deleted_at IS NULL) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin manages jewelry" ON public.jewelry_products
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_jewelry_products_updated_at
  BEFORE UPDATE ON public.jewelry_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Orders (kept separate from `orders` table which is for gold investment)
CREATE TABLE public.jewelry_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status public.jewelry_order_status NOT NULL DEFAULT 'pending',
  subtotal_usd NUMERIC NOT NULL DEFAULT 0,
  shipping_usd NUMERIC NOT NULL DEFAULT 0,
  total_usd NUMERIC NOT NULL DEFAULT 0,
  gold_rate_usd_per_gram NUMERIC NOT NULL,
  delivery_full_name TEXT NOT NULL,
  delivery_phone TEXT,
  delivery_address TEXT NOT NULL,
  delivery_country TEXT,
  courier_id UUID REFERENCES public.couriers(id),
  tracking_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jewelry_orders_user ON public.jewelry_orders(user_id);

ALTER TABLE public.jewelry_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads jewelry orders" ON public.jewelry_orders
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Owner inserts jewelry orders" ON public.jewelry_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin updates jewelry orders" ON public.jewelry_orders
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_jewelry_orders_updated_at
  BEFORE UPDATE ON public.jewelry_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Order items (snapshot of product at time of purchase)
CREATE TABLE public.jewelry_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.jewelry_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.jewelry_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  weight_grams NUMERIC NOT NULL,
  purity public.jewelry_purity NOT NULL,
  unit_price_usd NUMERIC NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jewelry_order_items_order ON public.jewelry_order_items(order_id);

ALTER TABLE public.jewelry_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads jewelry order items" ON public.jewelry_order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.jewelry_orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role)))
  );
CREATE POLICY "Admin manages jewelry order items" ON public.jewelry_order_items
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Atomic order placement with stock locking
CREATE OR REPLACE FUNCTION public.place_jewelry_order(
  _items JSONB,                    -- [{product_id, quantity}]
  _gold_rate NUMERIC,
  _delivery_full_name TEXT,
  _delivery_phone TEXT,
  _delivery_address TEXT,
  _delivery_country TEXT,
  _courier_id UUID DEFAULT NULL,
  _notes TEXT DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID := auth.uid();
  _item JSONB;
  _product RECORD;
  _qty INT;
  _unit_price NUMERIC;
  _making NUMERIC;
  _gold_value NUMERIC;
  _subtotal NUMERIC := 0;
  _shipping NUMERIC := 0;
  _order_id UUID;
BEGIN
  IF _user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF jsonb_array_length(_items) = 0 THEN RAISE EXCEPTION 'Cart is empty'; END IF;
  IF _gold_rate <= 0 THEN RAISE EXCEPTION 'Invalid gold rate'; END IF;

  -- Resolve shipping
  IF _courier_id IS NOT NULL THEN
    SELECT base_fee_usd INTO _shipping FROM public.couriers WHERE id = _courier_id AND active = true;
    _shipping := COALESCE(_shipping, 0);
  END IF;

  -- Create empty order placeholder
  INSERT INTO public.jewelry_orders (user_id, status, subtotal_usd, shipping_usd, total_usd, gold_rate_usd_per_gram, delivery_full_name, delivery_phone, delivery_address, delivery_country, courier_id, notes)
    VALUES (_user_id, 'pending', 0, _shipping, _shipping, _gold_rate, _delivery_full_name, _delivery_phone, _delivery_address, _delivery_country, _courier_id, _notes)
    RETURNING id INTO _order_id;

  -- Iterate items, lock product rows, decrement stock
  FOR _item IN SELECT * FROM jsonb_array_elements(_items) LOOP
    _qty := COALESCE((_item->>'quantity')::INT, 1);
    IF _qty <= 0 THEN RAISE EXCEPTION 'Invalid quantity'; END IF;

    SELECT * INTO _product FROM public.jewelry_products
      WHERE id = (_item->>'product_id')::UUID AND active = true AND deleted_at IS NULL
      FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Product unavailable'; END IF;
    IF _product.stock_quantity < _qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', _product.name;
    END IF;

    _gold_value := _product.weight_grams * _gold_rate;
    IF _product.making_charge_type = 'fixed' THEN
      _making := _product.making_charge_value;
    ELSE
      _making := _gold_value * (_product.making_charge_value / 100.0);
    END IF;
    _unit_price := ROUND((_gold_value + _making)::numeric, 2);
    _subtotal := _subtotal + (_unit_price * _qty);

    UPDATE public.jewelry_products SET stock_quantity = stock_quantity - _qty WHERE id = _product.id;

    INSERT INTO public.jewelry_order_items (order_id, product_id, product_name, product_sku, weight_grams, purity, unit_price_usd, quantity, thumbnail_url)
      VALUES (_order_id, _product.id, _product.name, _product.sku, _product.weight_grams, _product.purity, _unit_price, _qty, _product.thumbnail_url);
  END LOOP;

  UPDATE public.jewelry_orders SET subtotal_usd = _subtotal, total_usd = _subtotal + _shipping WHERE id = _order_id;

  INSERT INTO public.notifications (user_id, title, body)
    VALUES (_user_id, 'Order received', 'Your jewelry order has been received and is awaiting processing.');

  RETURN jsonb_build_object('success', true, 'order_id', _order_id, 'total', _subtotal + _shipping);
END;
$$;

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('jewelry-images', 'jewelry-images', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads jewelry images" ON storage.objects
  FOR SELECT USING (bucket_id = 'jewelry-images');
CREATE POLICY "Admin uploads jewelry images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'jewelry-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin updates jewelry images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'jewelry-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin deletes jewelry images" ON storage.objects
  FOR DELETE USING (bucket_id = 'jewelry-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Seed categories
INSERT INTO public.jewelry_categories (name, slug, sort_order) VALUES
  ('Watches', 'watches', 1),
  ('Necklaces', 'necklaces', 2),
  ('Chains', 'chains', 3),
  ('Bangles', 'bangles', 4),
  ('Earrings', 'earrings', 5);

-- Seed products
WITH cats AS (SELECT id, slug FROM public.jewelry_categories)
INSERT INTO public.jewelry_products (category_id, name, slug, sku, description, weight_grams, purity, making_charge_type, making_charge_value, stock_quantity, thumbnail_url)
SELECT
  (SELECT id FROM cats WHERE slug = c),
  n, s, k, d, w, p::public.jewelry_purity, mt::public.making_charge_type, mv, q,
  'https://images.unsplash.com/' || img || '?auto=format&fit=crop&w=800&q=80'
FROM (VALUES
  ('watches',   '18k Gold Wrist Watch',           'watch-18k-classic',  'AMR-WCH-001', 'Refined 18k gold wrist watch with sapphire crystal and Swiss movement.', 45,  '18k', 'percent', 12, 8,  'photo-1523275335684-37898b6baf30'),
  ('watches',   '22k Luxury Gold Chronograph',    'watch-22k-chrono',   'AMR-WCH-002', 'Statement 22k gold chronograph with hand-finished case.',                  60,  '22k', 'percent', 14, 5,  'photo-1547996160-81dfa63595aa'),
  ('necklaces', '22k Gold Bridal Necklace',       'necklace-22k-bridal','AMR-NCK-001', 'Heirloom 22k bridal necklace with intricate filigree work.',              120, '22k', 'percent', 18, 4,  'photo-1599643478518-a784e5dc4c8f'),
  ('necklaces', '18k Minimalist Gold Necklace',   'necklace-18k-mini',  'AMR-NCK-002', 'Delicate 18k minimalist necklace for everyday elegance.',                  25,  '18k', 'percent', 10, 20, 'photo-1611591437281-460bfbe1220a'),
  ('chains',    '24k Cuban Link Chain',           'chain-24k-cuban',    'AMR-CHN-001', 'Solid 24k Cuban link chain, polished to a mirror finish.',                 80,  '24k', 'percent', 8,  6,  'photo-1602173574767-37ac01994b2a'),
  ('chains',    '22k Rope Chain',                 'chain-22k-rope',     'AMR-CHN-002', 'Classic 22k rope chain with secure lobster clasp.',                        50,  '22k', 'percent', 10, 12, 'photo-1535632787350-4e68ef0ac584'),
  ('bangles',   '22k Traditional Gold Bangles',   'bangle-22k-trad',    'AMR-BAN-001', 'Set of two 22k traditional bangles with engraved motifs.',                 70,  '22k', 'percent', 15, 7,  'photo-1620656798932-902bc2fb63b1'),
  ('bangles',   '18k Slim Gold Bangles',          'bangle-18k-slim',    'AMR-BAN-002', 'Set of three slim 18k stackable bangles.',                                 30,  '18k', 'percent', 12, 15, 'photo-1535632787350-4e68ef0ac584'),
  ('earrings',  '18k Diamond-Cut Gold Earrings',  'earring-18k-diamond','AMR-EAR-001', 'Diamond-cut 18k earrings with a brilliant faceted finish.',                15,  '18k', 'percent', 14, 18, 'photo-1535632066274-65a51c5db4d9'),
  ('earrings',  '22k Classic Gold Studs',         'earring-22k-stud',   'AMR-EAR-002', 'Timeless 22k classic gold studs with secure backings.',                    10,  '22k', 'percent', 12, 30, 'photo-1630019852942-f89202989a59')
) AS v(c, n, s, k, d, w, p, mt, mv, q, img);
