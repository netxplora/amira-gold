
-- 1. RPC: pay a pending jewelry order from the user's wallet
CREATE OR REPLACE FUNCTION public.pay_jewelry_order_with_wallet(_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _order RECORD;
  _wallet RECORD;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;

  SELECT * INTO _order FROM public.jewelry_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _order.user_id <> _user THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF _order.status <> 'pending' THEN RAISE EXCEPTION 'Order is not awaiting payment'; END IF;

  SELECT * INTO _wallet FROM public.wallets WHERE user_id = _user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Wallet not found'; END IF;
  IF _wallet.balance_usd < _order.total_usd THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  UPDATE public.wallets SET balance_usd = balance_usd - _order.total_usd, updated_at = now()
    WHERE user_id = _user;

  INSERT INTO public.wallet_transactions (user_id, type, amount_usd, description)
    VALUES (_user, 'purchase', -_order.total_usd, 'Jewelry order ' || _order_id::text);

  UPDATE public.jewelry_orders SET status = 'paid', updated_at = now() WHERE id = _order_id;

  INSERT INTO public.notifications (user_id, title, body)
    VALUES (_user, 'Payment received', 'Your jewelry order is paid and queued for processing.');

  RETURN jsonb_build_object('success', true, 'order_id', _order_id, 'charged', _order.total_usd);
END;
$$;

-- 2. Storage hardening: drop broad public SELECT policies (direct public URLs still work
-- because the buckets remain marked public; this only blocks .list()/enumeration).
DROP POLICY IF EXISTS "Public reads product images" ON storage.objects;
DROP POLICY IF EXISTS "Public reads jewelry images" ON storage.objects;
DROP POLICY IF EXISTS "Public reads courier logos" ON storage.objects;
DROP POLICY IF EXISTS "Public reads provider logos" ON storage.objects;
DROP POLICY IF EXISTS "Proof images are publicly accessible" ON storage.objects;

-- Admin-only listing for those buckets
CREATE POLICY "Admin lists public marketing buckets"
ON storage.objects FOR SELECT
USING (
  bucket_id IN ('product-images','jewelry-images','courier-logos','provider-logos','proof-of-payment','avatars')
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Owner can list their own proof-of-payment files (folder-scoped)
CREATE POLICY "Owner lists own proof of payment"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'proof-of-payment'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
