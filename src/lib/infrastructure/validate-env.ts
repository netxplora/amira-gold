import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  // Add other critical environment variables here
  VITE_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  VITE_FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  VITE_CRYPTO_PROVIDER_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());
    
    if (import.meta.env.PROD) {
      throw new Error("Critical environment variables are missing. Application cannot start.");
    }
    
    return {
      isValid: false,
      errors: result.error.format(),
    };
  }

  return {
    isValid: true,
    data: result.data,
  };
}
