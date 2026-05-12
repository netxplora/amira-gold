-- ============ Profile additions ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS notify_email boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_in_app boolean NOT NULL DEFAULT true;

-- ============ Avatars storage bucket ============
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============ Chat ============
CREATE TABLE public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  last_message text,
  last_message_at timestamptz,
  user_unread integer NOT NULL DEFAULT 0,
  admin_unread integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads thread" ON public.chat_threads
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner inserts own thread" ON public.chat_threads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner or admin updates thread" ON public.chat_threads
  FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE TRIGGER chat_threads_updated
  BEFORE UPDATE ON public.chat_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('user','admin')),
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_chat_messages_thread ON public.chat_messages(thread_id, created_at);

CREATE POLICY "Thread member or admin reads messages" ON public.chat_messages
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR
    EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
  );
CREATE POLICY "Thread member or admin inserts messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND (
      has_role(auth.uid(), 'admin') OR
      EXISTS (SELECT 1 FROM public.chat_threads t WHERE t.id = thread_id AND t.user_id = auth.uid())
    )
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_threads;

-- ============ Crypto ============
CREATE TABLE public.crypto_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset text NOT NULL,
  network text NOT NULL,
  address text NOT NULL,
  memo text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crypto_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active addresses" ON public.crypto_addresses
  FOR SELECT USING (active OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin manages addresses" ON public.crypto_addresses
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE TABLE public.crypto_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset text NOT NULL,
  network text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  amount_usd numeric NOT NULL CHECK (amount_usd > 0),
  tx_hash text NOT NULL,
  from_address text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crypto_deposits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads deposits" ON public.crypto_deposits
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner inserts deposits" ON public.crypto_deposits
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin updates deposits" ON public.crypto_deposits
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE TABLE public.crypto_withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  asset text NOT NULL,
  network text NOT NULL,
  amount_usd numeric NOT NULL CHECK (amount_usd > 0),
  to_address text NOT NULL,
  memo text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','rejected')),
  tx_hash text,
  admin_notes text,
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crypto_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads withdrawals" ON public.crypto_withdrawals
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner inserts withdrawals" ON public.crypto_withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin updates withdrawals" ON public.crypto_withdrawals
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- ============ Allow admins to insert notifications for any user ============
CREATE POLICY "Admin inserts notifications" ON public.notifications
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- ============ Allow admins to update wallets (for credits/debits) ============
CREATE POLICY "Admin updates any wallet" ON public.wallets
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin inserts any wallet tx" ON public.wallet_transactions
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed a couple of crypto addresses (placeholders that admin can edit)
INSERT INTO public.crypto_addresses (asset, network, address) VALUES
  ('BTC','Bitcoin','bc1qexampleadminreplaceme0000000000000000000'),
  ('ETH','Ethereum','0x0000000000000000000000000000000000000000'),
  ('USDT','TRC20','TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX');