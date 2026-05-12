-- 1. activity_logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  actor_id UUID,
  action TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'system',
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_category ON public.activity_logs(category, created_at DESC);
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or admin reads activity"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated inserts own activity"
  ON public.activity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() = actor_id OR has_role(auth.uid(), 'admin'::app_role));

-- 2. faqs
CREATE TABLE IF NOT EXISTS public.faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active faqs"
  ON public.faqs FOR SELECT
  USING (active OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin manages faqs"
  ON public.faqs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_faqs_updated_at BEFORE UPDATE ON public.faqs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.faqs (category, question, answer, priority) VALUES
  ('Buying', 'How do I buy gold on Amira Gold?', 'Top up your wallet with crypto, then go to Buy Gold, choose your bar size, select a vault or insured delivery, and confirm. Allocation is instant.', 100),
  ('Buying', 'What is the minimum purchase amount?', 'You can start from 1 gram. We offer minted bars from 1g, 5g, 10g, 100g, and 1kg bullion bars.', 90),
  ('Buying', 'Are there any hidden fees?', 'No. The price you see includes the live spot price plus a small refining premium (3% by default). Insured delivery is a flat $75 worldwide.', 80),
  ('KYC', 'Why do I need to verify my identity?', 'Identity verification is required by AML/KYC regulations and protects you against fraud. It is mandatory before any withdrawal.', 100),
  ('KYC', 'How long does verification take?', 'Most submissions are reviewed within 1 business day. You will be notified by email and in-app.', 90),
  ('Vaults', 'Where is my gold stored?', 'In LBMA-certified, fully insured vaults across Zurich, Dubai, Toronto, Singapore, Riyadh and London. You choose the vault at purchase.', 100),
  ('Vaults', 'Is my gold allocated or unallocated?', 'All Amira Gold holdings are 100% allocated and segregated — meaning specific bars are assigned to you and never lent out.', 90),
  ('Vaults', 'Can I take physical delivery later?', 'Yes. You can request insured delivery of your bullion at any time from your Holdings page.', 80),
  ('Crypto', 'Which cryptocurrencies are supported?', 'BTC, ETH, USDT and USDC across major networks. Always send only the asset and network shown — wrong-network sends cannot be recovered.', 100),
  ('Crypto', 'How long does deposit verification take?', 'Once your transaction reaches network confirmations, our team verifies on-chain — usually within 30 minutes.', 90),
  ('Delivery', 'How long does insured delivery take?', '3–5 business days globally with full transit insurance. You receive a tracking number as soon as it ships.', 100),
  ('Delivery', 'Is the delivery insured?', 'Yes — every shipment is fully insured for the gold value, end-to-end, by Lloyd''s underwriters.', 90)
ON CONFLICT DO NOTHING;

-- 3. vaults extensions
ALTER TABLE public.vaults
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS region TEXT,
  ADD COLUMN IF NOT EXISTS courier_id UUID,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- 4. chat_messages: delivery status
ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'sent';

-- 5. trigger: keep chat_threads in sync with new messages
CREATE OR REPLACE FUNCTION public.sync_chat_thread_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.sender_role = 'user' THEN
    UPDATE public.chat_threads
      SET last_message = LEFT(NEW.body, 200),
          last_message_at = NEW.created_at,
          admin_unread = admin_unread + 1,
          updated_at = NEW.created_at
      WHERE id = NEW.thread_id;
  ELSE
    UPDATE public.chat_threads
      SET last_message = LEFT(NEW.body, 200),
          last_message_at = NEW.created_at,
          user_unread = user_unread + 1,
          updated_at = NEW.created_at
      WHERE id = NEW.thread_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_chat_thread_after_message ON public.chat_messages;
CREATE TRIGGER sync_chat_thread_after_message
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.sync_chat_thread_on_message();