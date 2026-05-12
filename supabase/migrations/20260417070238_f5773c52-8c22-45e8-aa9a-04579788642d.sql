
-- Roles enum and table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  suspended BOOLEAN NOT NULL DEFAULT false,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads profile" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner updates profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admin updates profile" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallets
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_usd NUMERIC(18,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner updates wallet" ON public.wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER tg_wallets_updated BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallet transactions
CREATE TYPE public.wallet_tx_type AS ENUM ('deposit','withdraw','purchase','sale');
CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type wallet_tx_type NOT NULL,
  amount_usd NUMERIC(18,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads tx" ON public.wallet_transactions FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner inserts tx" ON public.wallet_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Gold products
CREATE TABLE public.gold_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  weight_grams NUMERIC(10,3) NOT NULL,
  premium_pct NUMERIC(6,3) NOT NULL DEFAULT 3.0,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gold_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads gold products" ON public.gold_products FOR SELECT USING (true);
CREATE POLICY "Admin manages gold products" ON public.gold_products FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_gold_products_updated BEFORE UPDATE ON public.gold_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Vaults
CREATE TABLE public.vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity_grams NUMERIC(14,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads vaults" ON public.vaults FOR SELECT USING (true);
CREATE POLICY "Admin manages vaults" ON public.vaults FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Vault inventory
CREATE TABLE public.vault_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.vaults(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.gold_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  UNIQUE(vault_id, product_id)
);
ALTER TABLE public.vault_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads inventory" ON public.vault_inventory FOR SELECT USING (true);
CREATE POLICY "Admin manages inventory" ON public.vault_inventory FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TYPE public.order_type AS ENUM ('vault','delivery','digital');
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','allocated','shipped','delivered','cancelled');
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.gold_products(id),
  vault_id UUID REFERENCES public.vaults(id),
  type order_type NOT NULL,
  status order_status NOT NULL DEFAULT 'pending',
  quantity INTEGER NOT NULL DEFAULT 1,
  grams NUMERIC(12,4) NOT NULL,
  unit_price_usd NUMERIC(18,2) NOT NULL,
  total_usd NUMERIC(18,2) NOT NULL,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner inserts orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin updates orders" ON public.orders FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER tg_orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Holdings
CREATE TABLE public.holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES public.vaults(id),
  grams NUMERIC(14,4) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, vault_id)
);
ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads holdings" ON public.holdings FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner upserts holdings" ON public.holdings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner updates holdings" ON public.holdings FOR UPDATE USING (auth.uid() = user_id);
CREATE TRIGGER tg_holdings_updated BEFORE UPDATE ON public.holdings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  certificate_no TEXT NOT NULL UNIQUE,
  grams NUMERIC(14,4) NOT NULL,
  vault_id UUID REFERENCES public.vaults(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner or admin reads certs" ON public.certificates FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owner inserts certs" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Couriers
CREATE TABLE public.couriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  regions TEXT[] NOT NULL DEFAULT '{}',
  base_fee_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.couriers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads couriers" ON public.couriers FOR SELECT USING (true);
CREATE POLICY "Admin manages couriers" ON public.couriers FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner reads notifs" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Owner updates notifs" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- New user trigger: create profile, wallet, default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  INSERT INTO public.wallets (user_id, balance_usd) VALUES (NEW.id, 0);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed gold products
INSERT INTO public.gold_products (name, weight_grams, premium_pct, image_url) VALUES
('Amira 1g Gold Bar', 1, 5.0, NULL),
('Amira 5g Gold Bar', 5, 4.0, NULL),
('Amira 10g Gold Bar', 10, 3.5, NULL),
('Amira 50g Gold Bar', 50, 2.5, NULL),
('Amira 100g Gold Bar', 100, 2.0, NULL);

-- Seed vaults
INSERT INTO public.vaults (name, location, capacity_grams) VALUES
('Amira Vault Dubai', 'Dubai, UAE', 1000000),
('Amira Vault Zurich', 'Zurich, Switzerland', 1000000);

-- Seed couriers
INSERT INTO public.couriers (name, regions, base_fee_usd) VALUES
('Brinks Global', ARRAY['Global'], 75.00),
('Loomis Secure', ARRAY['Europe','Middle East'], 50.00),
('Malca-Amit', ARRAY['Global'], 80.00);
