
-- ============================================================
-- Jewelry Payment Proof, Order Confirmation & Security Fixes
-- ============================================================

-- 1. Add payment tracking columns to jewelry_orders
ALTER TABLE public.jewelry_orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'wallet',
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_proof_status text NOT NULL DEFAULT 'none';

DO $$ BEGIN
  ALTER TABLE public.jewelry_orders
    ADD CONSTRAINT jewelry_orders_payment_method_chk CHECK (payment_method IN ('wallet','crypto'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.jewelry_orders
    ADD CONSTRAINT jewelry_orders_proof_status_chk CHECK (payment_proof_status IN ('none','submitted','verified','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Fix SECURITY DEFINER on pay_jewelry_order_with_wallet — tighten EXECUTE
REVOKE ALL ON FUNCTION public.pay_jewelry_order_with_wallet(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_jewelry_order_with_wallet(uuid) TO authenticated;

-- 3. Re-create pay_jewelry_order_with_wallet to also set payment_method
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

  UPDATE public.jewelry_orders
    SET status = 'paid',
        payment_method = 'wallet',
        payment_proof_status = 'verified',
        updated_at = now()
    WHERE id = _order_id;

  INSERT INTO public.notifications (user_id, title, body)
    VALUES (_user, 'Payment received', 'Your jewelry order is paid and queued for processing.');

  RETURN jsonb_build_object('success', true, 'order_id', _order_id, 'charged', _order.total_usd);
END;
$$;

-- Re-apply tightened permissions after re-create
REVOKE ALL ON FUNCTION public.pay_jewelry_order_with_wallet(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pay_jewelry_order_with_wallet(uuid) TO authenticated;

-- 4. Lightweight RPC to tag an order as crypto-payment (called right after checkout)
CREATE OR REPLACE FUNCTION public.set_jewelry_payment_method(
  _order_id uuid,
  _method text DEFAULT 'crypto'
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _method NOT IN ('wallet','crypto') THEN RAISE EXCEPTION 'Invalid payment method'; END IF;
  UPDATE public.jewelry_orders
    SET payment_method = _method, updated_at = now()
    WHERE id = _order_id AND user_id = _user AND status = 'pending';
END;
$$;

REVOKE ALL ON FUNCTION public.set_jewelry_payment_method(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_jewelry_payment_method(uuid, text) TO authenticated;

-- 5. RPC to submit payment proof for crypto orders
CREATE OR REPLACE FUNCTION public.submit_jewelry_payment_proof(
  _order_id uuid,
  _proof_url text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user uuid := auth.uid();
  _order RECORD;
BEGIN
  IF _user IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF _proof_url IS NULL OR length(trim(_proof_url)) = 0 THEN
    RAISE EXCEPTION 'Proof of payment file is required';
  END IF;

  SELECT * INTO _order FROM public.jewelry_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;
  IF _order.user_id <> _user THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF _order.status NOT IN ('pending') THEN
    RAISE EXCEPTION 'Order is not awaiting payment';
  END IF;

  UPDATE public.jewelry_orders
    SET payment_method = 'crypto',
        payment_proof_url = _proof_url,
        payment_proof_status = 'submitted',
        updated_at = now()
    WHERE id = _order_id;

  INSERT INTO public.notifications (user_id, title, body)
    VALUES (_user, 'Payment proof submitted',
      'Your payment proof for order #' || upper(substring(_order_id::text, 1, 8)) || ' is under review.');

  RETURN jsonb_build_object('success', true, 'order_id', _order_id, 'status', 'submitted');
END;
$$;

REVOKE ALL ON FUNCTION public.submit_jewelry_payment_proof(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_jewelry_payment_proof(uuid, text) TO authenticated;

-- 6. Admin RPC to verify or reject payment proof
CREATE OR REPLACE FUNCTION public.review_jewelry_payment_proof(
  _order_id uuid,
  _decision text,
  _admin_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin uuid := auth.uid();
  _order RECORD;
BEGIN
  IF _admin IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF NOT has_role(_admin, 'admin'::app_role) THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF _decision NOT IN ('verified','rejected') THEN RAISE EXCEPTION 'Decision must be verified or rejected'; END IF;

  SELECT * INTO _order FROM public.jewelry_orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF _decision = 'verified' THEN
    UPDATE public.jewelry_orders
      SET payment_proof_status = 'verified', status = 'paid', updated_at = now()
      WHERE id = _order_id;
  ELSE
    UPDATE public.jewelry_orders
      SET payment_proof_status = 'rejected', updated_at = now()
      WHERE id = _order_id;
  END IF;

  INSERT INTO public.notifications (user_id, title, body)
    VALUES (_order.user_id,
      CASE WHEN _decision = 'verified' THEN 'Payment verified' ELSE 'Payment proof rejected' END,
      CASE WHEN _decision = 'verified'
        THEN 'Your crypto payment for order #' || upper(substring(_order_id::text, 1, 8)) || ' has been verified.'
        ELSE 'Your payment proof was rejected. ' || COALESCE(_admin_note, 'Please upload a valid proof of payment.')
      END
    );

  RETURN jsonb_build_object('success', true, 'order_id', _order_id, 'proof_status', _decision);
END;
$$;

REVOKE ALL ON FUNCTION public.review_jewelry_payment_proof(uuid, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_jewelry_payment_proof(uuid, text, text) TO authenticated;
