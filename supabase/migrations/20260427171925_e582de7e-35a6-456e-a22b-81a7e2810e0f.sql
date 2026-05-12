
-- 1. Card waitlist
CREATE TABLE public.card_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  country TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.card_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join waitlist"
  ON public.card_waitlist FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin reads waitlist"
  ON public.card_waitlist FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin manages waitlist"
  ON public.card_waitlist FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 2. Order serials + insurance
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS serial_number TEXT,
  ADD COLUMN IF NOT EXISTS insurance_tier TEXT;

-- 3. Crypto deposit proof
ALTER TABLE public.crypto_deposits
  ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- 4. Toronto vault (idempotent)
INSERT INTO public.vaults (name, location, capacity_grams)
SELECT 'Brink''s Toronto', 'Toronto, Canada', 500000
WHERE NOT EXISTS (SELECT 1 FROM public.vaults WHERE location ILIKE '%Toronto%');

-- 5. Storage bucket for proof of payment
INSERT INTO storage.buckets (id, name, public)
VALUES ('proof-of-payment', 'proof-of-payment', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Proof images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proof-of-payment');

CREATE POLICY "Users upload own proof"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'proof-of-payment' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own proof"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'proof-of-payment' AND auth.uid()::text = (storage.foldername(name))[1]);
