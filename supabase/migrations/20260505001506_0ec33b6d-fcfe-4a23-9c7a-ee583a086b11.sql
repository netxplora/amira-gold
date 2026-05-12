
CREATE OR REPLACE FUNCTION public.bulk_update_jewelry_order_status(
  _order_ids uuid[],
  _new_status jewelry_order_status,
  _tracking_number text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin uuid := auth.uid();
  _row record;
  _updated int := 0;
  _skipped int := 0;
  _allowed boolean;
BEGIN
  IF NOT has_role(_admin, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  FOR _row IN
    SELECT id, user_id, status FROM public.jewelry_orders
    WHERE id = ANY(_order_ids) FOR UPDATE
  LOOP
    -- Determine allowed transitions
    _allowed := CASE
      WHEN _row.status = 'delivered' OR _row.status = 'cancelled' THEN false
      WHEN _row.status::text = _new_status::text THEN false
      WHEN _new_status = 'pending' THEN false  -- never go back to pending
      WHEN _new_status = 'cancelled' THEN _row.status IN ('pending','paid','processing')
      WHEN _new_status = 'paid' THEN _row.status = 'pending'
      WHEN _new_status = 'processing' THEN _row.status IN ('pending','paid')
      WHEN _new_status = 'shipped' THEN _row.status IN ('paid','processing')
      WHEN _new_status = 'delivered' THEN _row.status = 'shipped'
      ELSE false
    END;

    IF NOT _allowed THEN
      _skipped := _skipped + 1;
      CONTINUE;
    END IF;

    UPDATE public.jewelry_orders
      SET status = _new_status,
          tracking_number = COALESCE(NULLIF(_tracking_number,''), tracking_number),
          updated_at = now()
      WHERE id = _row.id;

    INSERT INTO public.notifications (user_id, title, body)
      VALUES (_row.user_id, 'Order ' || _new_status::text,
        'Your jewelry order is now ' || _new_status::text || '.'
        || CASE WHEN _new_status = 'shipped' AND _tracking_number IS NOT NULL AND _tracking_number <> ''
                THEN ' Tracking: ' || _tracking_number ELSE '' END);

    _updated := _updated + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated', _updated, 'skipped', _skipped);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bulk_update_jewelry_order_status(uuid[], jewelry_order_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bulk_update_jewelry_order_status(uuid[], jewelry_order_status, text) TO authenticated;
