import { query, get, run, runTransaction } from '../connection';
import type { DbSetting } from '../types';

export interface StoreProfile {
  store_name: string;
  store_tagline?: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_website?: string;
  currency_symbol: string;
  currency_code: string;
  tax_rate: number;
  tax_name: string;
  receipt_footer: string;
  barcode_prefix?: string;
  enable_sound?: boolean;
}

export function getAllSettings(): Record<string, string> {
  const rows = query<DbSetting>('SELECT * FROM settings;');
  const map: Record<string, string> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

export function getSetting(key: string, defaultValue = ''): string {
  const row = get<DbSetting>('SELECT value FROM settings WHERE key = ?;', [key]);
  return row ? row.value : defaultValue;
}

export function setSetting(key: string, value: string): void {
  run(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now');`,
    [key, value]
  );
}

export function updateSettings(settingsMap: Record<string, string>): void {
  runTransaction((db) => {
    for (const [k, v] of Object.entries(settingsMap)) {
      db.run(
        `INSERT INTO settings (key, value, updated_at)
         VALUES (?, ?, datetime('now'))
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now');`,
        [k, String(v)]
      );
    }
  });
}

export function getStoreProfile(): StoreProfile {
  const settings = getAllSettings();
  return {
    store_name: settings.store_name || 'MINT FASHION',
    store_tagline: settings.store_tagline || 'Modern Apparel & Lifestyle',
    store_address: settings.store_address || '742 Evergreen Terrace, Suite 101, New York, NY 10001',
    store_phone: settings.store_phone || '+1 (555) 234-5678',
    store_email: settings.store_email || 'hello@mintfashion.com',
    store_website: settings.store_website || 'https://mintfashion.com',
    currency_symbol: settings.currency_symbol || '$',
    currency_code: settings.currency_code || 'USD',
    tax_rate: parseFloat(settings.tax_rate || '8.25'),
    tax_name: settings.tax_name || 'Sales Tax (8.25%)',
    receipt_footer: settings.receipt_footer || 'Thank you for shopping at MINT FASHION! Returns accepted within 14 days.',
    barcode_prefix: settings.barcode_prefix || 'MNT',
    enable_sound: settings.enable_sound === 'true',
  };
}

export function updateStoreProfile(profile: Partial<StoreProfile>): StoreProfile {
  const map: Record<string, string> = {};
  if (profile.store_name !== undefined) map.store_name = profile.store_name;
  if (profile.store_tagline !== undefined) map.store_tagline = profile.store_tagline;
  if (profile.store_address !== undefined) map.store_address = profile.store_address;
  if (profile.store_phone !== undefined) map.store_phone = profile.store_phone;
  if (profile.store_email !== undefined) map.store_email = profile.store_email;
  if (profile.store_website !== undefined) map.store_website = profile.store_website;
  if (profile.currency_symbol !== undefined) map.currency_symbol = profile.currency_symbol;
  if (profile.currency_code !== undefined) map.currency_code = profile.currency_code;
  if (profile.tax_rate !== undefined) map.tax_rate = String(profile.tax_rate);
  if (profile.tax_name !== undefined) map.tax_name = profile.tax_name;
  if (profile.receipt_footer !== undefined) map.receipt_footer = profile.receipt_footer;
  if (profile.barcode_prefix !== undefined) map.barcode_prefix = profile.barcode_prefix;
  if (profile.enable_sound !== undefined) map.enable_sound = String(profile.enable_sound);

  updateSettings(map);
  return getStoreProfile();
}
