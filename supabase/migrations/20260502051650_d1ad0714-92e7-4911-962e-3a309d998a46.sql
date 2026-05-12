-- Jewelry price audit log
CREATE TABLE public.jewelry_price_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  changed_by UUID,
  old_making_charge_type TEXT,
  old_making_charge_value NUMERIC,
  new_making_charge_type TEXT,
  new_making_charge_value NUMERIC,
  old_stock INTEGER,
  new_stock INTEGER,
  change_kind TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jewelry_price_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin reads price audits" ON public.jewelry_price_audits
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin inserts price audits" ON public.jewelry_price_audits
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_jewelry_price_audits_created ON public.jewelry_price_audits(created_at DESC);
CREATE INDEX idx_jewelry_price_audits_product ON public.jewelry_price_audits(product_id);

-- Gold price history snapshots
CREATE TABLE public.gold_price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  price_per_gram NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gold_price_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads gold history" ON public.gold_price_history
  FOR SELECT USING (true);
CREATE POLICY "Anyone inserts gold history" ON public.gold_price_history
  FOR INSERT WITH CHECK (true);
CREATE INDEX idx_gold_history_recorded ON public.gold_price_history(recorded_at DESC);

-- Bulk update making charge function
CREATE OR REPLACE FUNCTION public.bulk_update_jewelry_making_charge(
  _product_ids UUID[],
  _new_type TEXT,
  _new_value NUMERIC,
  _notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin UUID := auth.uid();
  _row RECORD;
  _count INT := 0;
BEGIN
  IF NOT has_role(_admin, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _new_type NOT IN ('fixed','percent') THEN
    RAISE EXCEPTION 'Invalid making charge type';
  END IF;
  IF _new_value < 0 THEN
    RAISE EXCEPTION 'Making charge value cannot be negative';
  END IF;

  FOR _row IN SELECT id, name, making_charge_type, making_charge_value
              FROM public.jewelry_products
              WHERE id = ANY(_product_ids) AND deleted_at IS NULL
              FOR UPDATE
  LOOP
    INSERT INTO public.jewelry_price_audits
      (product_id, product_name, changed_by, old_making_charge_type, old_making_charge_value,
       new_making_charge_type, new_making_charge_value, change_kind, notes)
    VALUES (_row.id, _row.name, _admin, _row.making_charge_type::TEXT, _row.making_charge_value,
            _new_type, _new_value, 'price', _notes);

    UPDATE public.jewelry_products
      SET making_charge_type = _new_type::making_charge_type,
          making_charge_value = _new_value,
          updated_at = now()
      WHERE id = _row.id;
    _count := _count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', _count);
END;
$$;

-- Bulk update stock function
CREATE OR REPLACE FUNCTION public.bulk_update_jewelry_stock(
  _product_ids UUID[],
  _new_stock INTEGER,
  _mode TEXT DEFAULT 'set',
  _notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin UUID := auth.uid();
  _row RECORD;
  _count INT := 0;
  _final INT;
BEGIN
  IF NOT has_role(_admin, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _mode NOT IN ('set','add') THEN
    RAISE EXCEPTION 'Invalid mode';
  END IF;
  IF _mode = 'set' AND _new_stock < 0 THEN
    RAISE EXCEPTION 'Stock cannot be negative';
  END IF;

  FOR _row IN SELECT id, name, stock_quantity
              FROM public.jewelry_products
              WHERE id = ANY(_product_ids) AND deleted_at IS NULL
              FOR UPDATE
  LOOP
    IF _mode = 'set' THEN
      _final := _new_stock;
    ELSE
      _final := _row.stock_quantity + _new_stock;
      IF _final < 0 THEN _final := 0; END IF;
    END IF;

    INSERT INTO public.jewelry_price_audits
      (product_id, product_name, changed_by, old_stock, new_stock, change_kind, notes)
    VALUES (_row.id, _row.name, _admin, _row.stock_quantity, _final, 'stock', _notes);

    UPDATE public.jewelry_products
      SET stock_quantity = _final, updated_at = now()
      WHERE id = _row.id;
    _count := _count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', _count);
END;
$$;