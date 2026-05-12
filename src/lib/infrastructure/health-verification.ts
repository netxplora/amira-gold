import { supabase } from "@/integrations/supabase/client";
import { HealthCheckResult } from './types';

export async function verifySystemHealth(): Promise<HealthCheckResult> {
  const checks: HealthCheckResult['checks'] = [];
  
  // 1. Check Critical Configurations
  try {
    const { data: criticalConfigs, error: cfgError } = await (supabase as any)
      .from('system_configs')
      .select('key')
      .eq('is_critical', true)
      .eq('status', 'active');

    if (cfgError) throw cfgError;

    const requiredKeys = ['stripe_config', 'global_shipping_rules', 'kyc_requirements'];
    const missingKeys = requiredKeys.filter(k => !criticalConfigs?.some((c: any) => c.key === k));

    if (missingKeys.length > 0) {
      checks.push({
        name: 'Critical Configurations',
        status: 'fail',
        message: `Missing ${missingKeys.length} critical configurations: ${missingKeys.join(', ')}`,
        repair_action: 'Run Recovery Engine'
      });
    } else {
      checks.push({
        name: 'Critical Configurations',
        status: 'pass',
        message: 'All critical configurations are present.'
      });
    }
  } catch (err) {
    checks.push({
      name: 'Configuration Database',
      status: 'fail',
      message: 'Failed to query system_configs table.'
    });
  }

  // 2. Check Database Tables Integrity
  const essentialTables = [
    'profiles', 'wallets', 'orders', 'gold_products', 
    'vaults', 'system_configs', 'config_versions', 'config_activity_logs'
  ];
  for (const table of essentialTables) {
    const { error } = await (supabase as any).from(table).select('count', { count: 'exact', head: true }).limit(0);
    if (error) {
      checks.push({
        name: `Table Integrity: ${table}`,
        status: 'fail',
        message: `Table '${table}' is unreachable or missing.`,
        repair_action: 'Verify Migrations'
      });
    } else {
      checks.push({
        name: `Table Integrity: ${table}`,
        status: 'pass',
        message: 'Table is healthy'
      });
    }
  }

  // 3. Check Storage Buckets
  const requiredBuckets = [
    'product-images', 'jewelry-images', 'kyc-documents', 
    'avatars', 'vault-assets', 'invoices', 'proof-of-payment',
    'courier-logos', 'provider-logos'
  ];
  for (const bucket of requiredBuckets) {
    const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket);
    
    if (bucketError) {
      checks.push({
        name: `Storage Bucket: ${bucket}`,
        status: 'fail',
        message: `Bucket missing or inaccessible: ${bucketError.message}`,
        repair_action: 'Trigger recovery'
      });
    } else {
      checks.push({
        name: `Storage Bucket: ${bucket}`,
        status: 'pass',
        message: 'Bucket is active'
      });
    }
  }

  // 4. Check Critical RPCs
  const requiredRPCs = [
    'place_jewelry_order', 'pay_jewelry_order_with_wallet', 
    'submit_jewelry_payment_proof', 'has_role', 'ensure_system_configs'
  ];
  for (const rpc of requiredRPCs) {
    const { data: exists, error } = await (supabase as any).rpc('check_rpc_existence', { rpc_name: rpc });
    
    if (error || !exists) {
      checks.push({
        name: `Service RPC: ${rpc}`,
        status: 'fail',
        message: `Function '${rpc}' is missing from the database or inaccessible.`,
        repair_action: 'Re-run migrations'
      });
    } else {
      checks.push({
        name: `Service RPC: ${rpc}`,
        status: 'pass',
        message: 'Function is operational'
      });
    }
  }

  // Calculate final status and score
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warning').length;
  
  let status: HealthCheckResult['status'] = 'healthy';
  if (failCount > 0) status = 'critical';
  else if (warnCount > 0) status = 'warning';

  const score = Math.max(0, 100 - (failCount * 5) - (warnCount * 2));

  return {
    status,
    score,
    checks,
    alerts: checks.filter(c => c.status !== 'pass').map(c => `${c.name}: ${c.message}`),
    last_checked: new Date().toISOString()
  };
}
