
REVOKE EXECUTE ON FUNCTION public.place_jewelry_order(jsonb, numeric, text, text, text, text, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_jewelry_order(jsonb, numeric, text, text, text, text, uuid, text) TO authenticated;
