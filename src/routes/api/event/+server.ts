import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/supabase';

// Only a small, known set of events is persisted (keeps the table lean and
// rejects junk). Marketing-grade analytics still live in GA.
const ALLOWED = new Set([
	'play_game',
	'game_complete',
	'endless_over',
	'amazon_click',
	'share',
	'save_find'
]);

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body) return json({ ok: false }, { status: 400 });

	const { type, meta } = body as { type?: unknown; meta?: unknown };
	if (typeof type !== 'string' || !ALLOWED.has(type)) {
		return json({ ok: false }, { status: 400 });
	}

	const c = db();
	if (c) {
		await c
			.from('events')
			.insert({ type, meta: meta && typeof meta === 'object' ? meta : null });
	}
	return json({ ok: true });
};
