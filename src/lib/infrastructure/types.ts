export interface SystemConfig {
  id: string;
  category: string;
  key: string;
  value: any;
  environment: string;
  description: string | null;
  is_critical: boolean;
  is_seedable: boolean;
  is_system: boolean;
  status: 'active' | 'archived' | 'deprecated';
  version: number;
  created_by?: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ConfigVersion {
  id: string;
  config_id: string;
  old_value: any;
  new_value: any;
  change_summary: string | null;
  updated_by?: string;
  created_at: string;
}

export interface ConfigBackup {
  id: string;
  name: string;
  backup_type: 'full' | 'category' | 'single';
  backup_payload: any;
  created_by?: string;
  created_at: string;
}

export interface ConfigActivityLog {
  id: string;
  config_id: string | null;
  action_type: 'create' | 'update' | 'archive' | 'restore' | 'export' | 'import' | 'rollback';
  action_summary: string | null;
  performed_by?: string;
  metadata: any;
  created_at: string;
}

export interface HealthCheckResult {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  checks: {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    repair_action?: string;
  }[];
  alerts: string[];
  last_checked: string;
}

export type ConfigCategory = 
  | 'vaults'
  | 'crypto_providers'
  | 'jewelry_categories'
  | 'shipping'
  | 'couriers'
  | 'tax_rules'
  | 'payment_gateways'
  | 'referral_settings'
  | 'role_permissions'
  | 'notification_templates'
  | 'smtp_configs'
  | 'site_settings'
  | 'featured_products'
  | 'kyc_settings'
  | 'currencies';
