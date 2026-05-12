
REVOKE EXECUTE ON FUNCTION public.approve_crypto_deposit(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reject_crypto_deposit(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_crypto_deposit(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_crypto_deposit(uuid, text) TO authenticated;
