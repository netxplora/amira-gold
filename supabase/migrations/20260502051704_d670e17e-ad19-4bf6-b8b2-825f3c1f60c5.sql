REVOKE EXECUTE ON FUNCTION public.bulk_update_jewelry_making_charge(UUID[], TEXT, NUMERIC, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.bulk_update_jewelry_making_charge(UUID[], TEXT, NUMERIC, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.bulk_update_jewelry_stock(UUID[], INTEGER, TEXT, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.bulk_update_jewelry_stock(UUID[], INTEGER, TEXT, TEXT) TO authenticated;

DROP POLICY IF EXISTS "Anyone inserts gold history" ON public.gold_price_history;
CREATE POLICY "Authenticated inserts gold history" ON public.gold_price_history
  FOR INSERT TO authenticated WITH CHECK (true);