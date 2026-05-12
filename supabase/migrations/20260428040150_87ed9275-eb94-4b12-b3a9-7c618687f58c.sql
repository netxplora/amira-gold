
-- =========================================================
-- 1. CRYPTO PROVIDERS TABLE
-- =========================================================
CREATE TABLE IF NOT EXISTS public.crypto_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  url TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS crypto_providers_name_unique
  ON public.crypto_providers (lower(name)) WHERE deleted_at IS NULL;

ALTER TABLE public.crypto_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active providers"
  ON public.crypto_providers FOR SELECT
  USING (active = true AND deleted_at IS NULL OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin manages providers"
  ON public.crypto_providers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_crypto_providers_updated
  BEFORE UPDATE ON public.crypto_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 2. CRYPTO DEPOSITS — INTEGRITY HARDENING
-- =========================================================
ALTER TABLE public.crypto_deposits
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS processing_lock BOOLEAN NOT NULL DEFAULT false;

-- Idempotency: prevent duplicate (asset, network, tx_hash) submissions
CREATE UNIQUE INDEX IF NOT EXISTS crypto_deposits_tx_unique
  ON public.crypto_deposits (lower(asset), lower(network), lower(tx_hash));

-- Status constraint
DO $$ BEGIN
  ALTER TABLE public.crypto_deposits
    ADD CONSTRAINT crypto_deposits_status_check
    CHECK (status IN ('pending','approved','rejected'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 3. ATOMIC APPROVAL RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.approve_crypto_deposit(
  _deposit_id UUID,
  _admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deposit RECORD;
  _admin_id UUID := auth.uid();
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  -- Lock the row
  SELECT * INTO _deposit FROM public.crypto_deposits
    WHERE id = _deposit_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF _deposit.status <> 'pending' OR _deposit.processed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Deposit already processed (status=%)', _deposit.status;
  END IF;

  -- Credit wallet atomically
  UPDATE public.wallets
    SET balance_usd = balance_usd + _deposit.amount_usd,
        updated_at = now()
    WHERE user_id = _deposit.user_id;

  -- Wallet transaction record
  INSERT INTO public.wallet_transactions (user_id, type, amount_usd, description)
    VALUES (_deposit.user_id, 'deposit', _deposit.amount_usd,
            'Crypto deposit ' || _deposit.asset || ' (' || _deposit.tx_hash || ')');

  -- Mark deposit approved
  UPDATE public.crypto_deposits
    SET status = 'approved',
        admin_notes = COALESCE(_admin_notes, admin_notes),
        reviewed_by = _admin_id,
        reviewed_at = now(),
        processed_at = now(),
        processing_lock = true
    WHERE id = _deposit_id;

  -- Notify user
  INSERT INTO public.notifications (user_id, title, body)
    VALUES (_deposit.user_id, 'Deposit approved',
            'Your crypto deposit of $' || _deposit.amount_usd || ' has been credited.');

  RETURN jsonb_build_object('success', true, 'deposit_id', _deposit_id, 'credited', _deposit.amount_usd);
END;
$$;

-- =========================================================
-- 4. ATOMIC REJECTION RPC
-- =========================================================
CREATE OR REPLACE FUNCTION public.reject_crypto_deposit(
  _deposit_id UUID,
  _admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _deposit RECORD;
  _admin_id UUID := auth.uid();
BEGIN
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  SELECT * INTO _deposit FROM public.crypto_deposits
    WHERE id = _deposit_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Deposit not found';
  END IF;

  IF _deposit.status <> 'pending' OR _deposit.processed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Deposit already processed (status=%)', _deposit.status;
  END IF;

  UPDATE public.crypto_deposits
    SET status = 'rejected',
        admin_notes = COALESCE(_admin_notes, admin_notes),
        reviewed_by = _admin_id,
        reviewed_at = now(),
        processed_at = now(),
        processing_lock = true
    WHERE id = _deposit_id;

  INSERT INTO public.notifications (user_id, title, body)
    VALUES (_deposit.user_id, 'Deposit rejected',
            'Your crypto deposit submission was rejected. ' || COALESCE(_admin_notes, ''));

  RETURN jsonb_build_object('success', true, 'deposit_id', _deposit_id);
END;
$$;

-- =========================================================
-- 5. SOFT DELETE COLUMNS
-- =========================================================
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.gold_products ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.vaults ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.couriers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- =========================================================
-- 6. STORAGE BUCKETS
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('courier-logos','courier-logos', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
  VALUES ('product-images','product-images', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
  VALUES ('provider-logos','provider-logos', true)
  ON CONFLICT (id) DO NOTHING;

-- Public read for all three
CREATE POLICY "Public reads courier logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'courier-logos');
CREATE POLICY "Public reads product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "Public reads provider logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-logos');

-- Admin write
CREATE POLICY "Admins manage courier logos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'courier-logos' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'courier-logos' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage product images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage provider logos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'provider-logos' AND has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (bucket_id = 'provider-logos' AND has_role(auth.uid(), 'admin'::app_role));

-- =========================================================
-- 7. SEED A FEW DEFAULT PROVIDERS
-- =========================================================
INSERT INTO public.crypto_providers (name, url, priority) VALUES
  ('MoonPay', 'https://buy.moonpay.com', 10),
  ('Transak', 'https://global.transak.com', 20),
  ('Ramp Network', 'https://buy.ramp.network', 30),
  ('Binance', 'https://www.binance.com/en/buy-sell-crypto', 40)
ON CONFLICT DO NOTHING;
