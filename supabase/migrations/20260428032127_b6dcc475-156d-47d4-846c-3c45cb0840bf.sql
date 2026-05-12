-- Audit logs for Proof of Reserves transparency
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auditor_name TEXT NOT NULL,
  auditor_firm TEXT,
  vault_id UUID REFERENCES public.vaults(id) ON DELETE SET NULL,
  grams_verified NUMERIC NOT NULL DEFAULT 0,
  audit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  report_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads audit logs"
  ON public.audit_logs FOR SELECT
  USING (true);

CREATE POLICY "Admin manages audit logs"
  ON public.audit_logs FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_audit_logs_updated_at
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_audit_logs_date ON public.audit_logs(audit_date DESC);
CREATE INDEX idx_audit_logs_vault ON public.audit_logs(vault_id);

-- Add Saudi Arabia vault if not present
INSERT INTO public.vaults (name, location, capacity_grams)
SELECT 'Brink''s Riyadh Vault', 'Riyadh, Saudi Arabia', 250000
WHERE NOT EXISTS (
  SELECT 1 FROM public.vaults WHERE location ILIKE '%riyadh%' OR location ILIKE '%saudi%'
);