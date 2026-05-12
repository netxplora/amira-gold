-- 1. Gold price alerts table
CREATE TABLE IF NOT EXISTS public.gold_price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above','below')),
  target_price_per_gram NUMERIC NOT NULL CHECK (target_price_per_gram > 0),
  active BOOLEAN NOT NULL DEFAULT true,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gold_price_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner manages own alerts" ON public.gold_price_alerts
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS gold_price_alerts_active_idx ON public.gold_price_alerts(user_id, active);

-- 2. Function used by client to check & fire alerts atomically
CREATE OR REPLACE FUNCTION public.check_gold_price_alerts(_current_price NUMERIC)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user UUID := auth.uid();
  _row RECORD;
  _fired INT := 0;
BEGIN
  IF _user IS NULL THEN RETURN 0; END IF;
  FOR _row IN
    SELECT * FROM public.gold_price_alerts
    WHERE user_id = _user AND active = true AND triggered_at IS NULL
      AND ((direction = 'above' AND _current_price >= target_price_per_gram)
        OR (direction = 'below' AND _current_price <= target_price_per_gram))
    FOR UPDATE
  LOOP
    UPDATE public.gold_price_alerts
      SET triggered_at = now(), active = false, updated_at = now()
      WHERE id = _row.id;
    INSERT INTO public.notifications (user_id, title, body)
      VALUES (_user, 'Gold price alert',
        'Gold price reached ' || _row.direction || ' $' || ROUND(_row.target_price_per_gram::numeric, 2)
        || '/g. Current: $' || ROUND(_current_price::numeric, 2) || '/g.');
    _fired := _fired + 1;
  END LOOP;
  RETURN _fired;
END;
$$;

-- 3. Tighten overly permissive INSERT policies
DROP POLICY IF EXISTS "Authenticated inserts gold history" ON public.gold_price_history;
CREATE POLICY "Admin inserts gold history" ON public.gold_price_history
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.card_waitlist;
CREATE POLICY "Anyone can join waitlist" ON public.card_waitlist
  FOR INSERT
  WITH CHECK (email IS NOT NULL AND length(email) BETWEEN 3 AND 320);

-- 4. Lock down SECURITY DEFINER function execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_chat_thread_on_message() FROM PUBLIC, anon, authenticated;

REVOKE ALL ON FUNCTION public.approve_crypto_deposit(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_crypto_deposit(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bulk_update_jewelry_making_charge(uuid[], text, numeric, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.bulk_update_jewelry_stock(uuid[], integer, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.place_jewelry_order(jsonb, numeric, text, text, text, text, uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.check_gold_price_alerts(numeric) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_crypto_deposit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_crypto_deposit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_jewelry_making_charge(uuid[], text, numeric, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bulk_update_jewelry_stock(uuid[], integer, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_jewelry_order(jsonb, numeric, text, text, text, text, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_gold_price_alerts(numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;

-- 5. Remove broad-listing SELECT policies on public buckets.
-- Public buckets remain publicly readable via the public CDN endpoint;
-- this just prevents anonymous LIST of all object names.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read product images" ON storage.objects;
DROP POLICY IF EXISTS "Public read courier logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read courier logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Public can read provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Public read jewelry images" ON storage.objects;
DROP POLICY IF EXISTS "Public can read jewelry images" ON storage.objects;
DROP POLICY IF EXISTS "Public read proof of payment" ON storage.objects;
DROP POLICY IF EXISTS "Public can read proof of payment" ON storage.objects;