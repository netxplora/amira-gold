import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  // Add other critical environment variables here
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  VITE_PAYSTACK_PUBLIC_KEY: z.string().optional(),
  VITE_FLUTTERWAVE_PUBLIC_KEY: z.string().optional(),
  VITE_CRYPTO_PROVIDER_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv() {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:", result.error.format());

    // Log the error but never throw during SSR — a thrown error causes a 500
    // for every page request. Let the app load and show a degraded state instead.
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
