import { supabase } from "@/integrations/supabase/client";
import { SystemConfig } from './types';

/**
 * CORE_SEEDS defines the minimum required configuration for the platform.
 * These are injected during recovery if missing.
 */
export const CORE_SEEDS: Partial<SystemConfig>[] = [
  {
    category: 'payment_gateways',
    key: 'stripe_config',
    value: { enabled: true, mode: 'test', currency: 'usd' },
    description: 'Primary Stripe payment gateway configuration',
    is_critical: true,
    is_seedable: true,
    is_system: true,
  },
  {
    category: 'crypto_providers',
    key: 'default_crypto_rates',
    value: { btc_usd: 65000, eth_usd: 35000 },
    description: 'Fallback crypto exchange rates',
    is_critical: true,
    is_seedable: true,
    is_system: true,
  },
  {
    category: 'shipping',
    key: 'global_shipping_rules',
    value: { base_fee: 50, free_over: 5000, insurance_rate: 0.01 },
    description: 'Default shipping fee and insurance calculation rules',
    is_critical: true,
    is_seedable: true,
    is_system: true,
  },
  {
    category: 'kyc_settings',
    key: 'kyc_requirements',
    value: { 
      min_age: 18, 
      required_docs: ['passport', 'id_card'], 
      auto_approve_limit: 1000 
    },
    description: 'KYC validation parameters',
    is_critical: true,
    is_seedable: true,
    is_system: true,
  },
  {
    category: 'site_settings',
    key: 'platform_branding',
    value: { 
      name: 'Amira Gold', 
      primary_color: '#D4AF37', 
      support_email: 'support@amiragold.com' 
    },
    description: 'Basic platform identity settings',
    is_critical: true,
    is_seedable: true,
    is_system: true,
  }
];

export async function runRecoveryEngine() {
  console.log('[RecoveryEngine] Starting comprehensive system recovery...');
  let restoredCount = 0;

  try {
    // 1. Storage Recovery
    const requiredBuckets = [
      'product-images', 'jewelry-images', 'kyc-documents', 
      'avatars', 'vault-assets', 'invoices', 'proof-of-payment',
      'courier-logos', 'provider-logos', 'support-attachments'
    ];

    for (const bucket of requiredBuckets) {
      const { error: checkError } = await supabase.storage.getBucket(bucket);
      const bucketExists = !checkError || !checkError.message.includes('not found');

      if (!bucketExists) {
        console.log(`[RecoveryEngine] Creating missing bucket: ${bucket}`);
        const { error } = await supabase.storage.createBucket(bucket, {
          public: !['kyc-documents', 'support-attachments'].includes(bucket),
          allowedMimeTypes: ['image/png', 'image/jpeg', 'application/pdf'],
          fileSizeLimit: 5242880 // 5MB
        });
        if (!error) restoredCount++;
        else console.error(`[RecoveryEngine] Failed to create bucket ${bucket}:`, error.message);
      }
    }

    // 2. Configuration Recovery
    const { data, error } = await (supabase as any).rpc('ensure_system_configs', {
      configs: CORE_SEEDS
    });

    if (error) throw error;

    const restoredConfigs = (data as any)?.restored || 0;
    restoredCount += restoredConfigs;

    if (restoredCount > 0) {
      console.log(`[RecoveryEngine] Successfully restored ${restoredCount} infrastructure components.`);
      
      // Log the recovery event
      await (supabase as any).from('config_activity_logs').insert({
        action_type: 'restore',
        action_summary: `Self-healing recovery restored ${restoredCount} components (Buckets & Configs).`,
        metadata: { source: 'recovery-engine', total_restored: restoredCount, config_restored: restoredConfigs }
      });
    } else {
      console.log('[RecoveryEngine] Infrastructure is healthy.');
    }

    return { success: true, restored: restoredCount };
  } catch (err) {
    console.error('[RecoveryEngine] Failed to run recovery:', err);
    return { success: false, error: err };
  }
}
