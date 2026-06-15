import { env } from '$env/dynamic/private';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let resolved = false;

/**
 * Lazily build the Supabase client from server-only env. Returns null when
 * SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are unset, so every caller can
 * degrade gracefully (the game runs fine without a database).
 */
export function db(): SupabaseClient | null {
	if (resolved) return client;
	resolved = true;
	const url = env.SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY;
	if (url && key) {
		client = createClient(url, key, { auth: { persistSession: false } });
	}
	return client;
}
