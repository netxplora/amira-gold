-- Initial System Configurations Seed
-- Categories: jewelry, vault, payment, courier, referral, general

INSERT INTO public.system_configs (category, key, value, description)
VALUES 
    ('jewelry', 'shipping_base_fee', '{"usd": 25}', 'Base shipping fee for jewelry orders'),
    ('jewelry', 'tax_rate', '{"percentage": 5}', 'VAT/Tax percentage for jewelry marketplace'),
    ('payment', 'supported_cryptos', '["BTC", "ETH", "USDT", "USDC"]', 'List of cryptocurrencies accepted for payment'),
    ('vault', 'storage_fee', '{"percentage_annual": 0.5}', 'Annual storage fee for physical gold in vault'),
    ('referral', 'commission_rate', '{"percentage": 2.5}', 'Default commission for partner referrals'),
    ('general', 'platform_name', '"Amira Gold"', 'Public name of the platform'),
    ('general', 'contact_email', '"support@amiragold.com"', 'Primary support contact email')
ON CONFLICT (key) DO NOTHING;

-- Initial Couriers
INSERT INTO public.couriers (name, base_fee_usd, regions, active)
VALUES 
    ('FedEx International', 75, '["Global", "North America", "Europe"]', true),
    ('DHL Express', 65, '["Global", "Asia", "Africa"]', true),
    ('Aramex', 45, '["Middle East", "GCC"]', true)
ON CONFLICT DO NOTHING;
