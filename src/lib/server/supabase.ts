import { env } from '$env/dynamic/private';
import { env as pubEnv } from '$env/dynamic/public';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * Lazily build the Supabase client from server env. Returns null when the
 * vars are unset, so every caller can degrade gracefully (the game runs fine
 * without a database). Accepts the canonical names and the legacy
 * GuessTheModel names so existing Netlify env vars keep working.
 */
export function db(): SupabaseClient | null {
	if (client) return client;
	const url = env.SUPABASE_URL || pubEnv.PUBLIC_SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY || env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY;
	if (url && key) {
		client = createClient(url, key, { auth: { persistSession: false } });
	}
	return client;
}
