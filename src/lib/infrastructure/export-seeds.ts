import { supabase } from "@/integrations/supabase/client";

export async function exportConfigSeeds(format: 'json' | 'sql' = 'json') {
  try {
    const { data: configs, error } = await (supabase as any)
      .from('system_configs')
      .select('*')
      .eq('is_seedable', true)
      .eq('status', 'active');

    if (error) throw error;

    if (format === 'json') {
      return JSON.stringify(configs, null, 2);
    }

    if (format === 'sql') {
      let sql = '-- Amira Gold System Config Seed Export\n';
      sql += '-- Generated on ' + new Date().toISOString() + '\n\n';

      configs?.forEach((cfg: any) => {
        const val = JSON.stringify(cfg.value).replace(/'/g, "''");
        sql += `INSERT INTO public.system_configs (category, key, value, description, is_critical, is_seedable, is_system)\n`;
        sql += `VALUES ('${cfg.category}', '${cfg.key}', '${val}', '${cfg.description || ''}', ${cfg.is_critical}, ${cfg.is_seedable}, ${cfg.is_system})\n`;
        sql += `ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;\n\n`;
      });

      return sql;
    }
  } catch (err) {
    console.error('Failed to export seeds:', err);
    throw err;
  }
}

export async function createFullSystemBackup(name: string) {
  try {
    const { data: configs, error } = await (supabase as any)
      .from('system_configs')
      .select('*');

    if (error) throw error;

    const { data: backup, error: backupError } = await (supabase as any)
      .from('config_backups')
      .insert({
        name,
        backup_type: 'full',
        backup_payload: configs,
      })
      .select()
      .single();

    if (backupError) throw backupError;

    // Log the action
    await (supabase as any).from('config_activity_logs').insert({
      action_type: 'export',
      action_summary: `Created full system configuration backup: ${name}`,
      metadata: { backup_id: (backup as any).id }
    });

    return backup;
  } catch (err) {
    console.error('Failed to create backup:', err);
    throw err;
  }
}
