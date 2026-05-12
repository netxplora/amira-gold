-- KYC status on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'none';

-- KYC submissions
CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  document_type text NOT NULL,
  document_url text NOT NULL,
  selfie_url text NOT NULL,
  address text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads kyc" ON public.kyc_submissions FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner inserts kyc" ON public.kyc_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin updates kyc" ON public.kyc_submissions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER kyc_set_updated BEFORE UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallet tx: add stripe ids and topup type
ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS stripe_session_id text;

ALTER TYPE public.wallet_tx_type ADD VALUE IF NOT EXISTS 'topup';

-- KYC docs storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owner reads own kyc docs" ON storage.objects FOR SELECT
  USING (bucket_id = 'kyc-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "Owner uploads own kyc docs" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Owner updates own kyc docs" ON storage.objects FOR UPDATE
  USING (bucket_id = 'kyc-documents' AND auth.uid()::text = (storage.foldername(name))[1]);