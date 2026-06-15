import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { ensureDay } from '$lib/server/daily';

/** Pre-generate upcoming daily puzzles. Gated by ADMIN_SECRET (cookie or ?key). */
export const POST: RequestHandler = async ({ url, cookies }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('key') ?? cookies.get('ops_key');
	if (!secret || provided !== secret) error(404, 'Not found');

	const days = Math.min(60, Math.max(1, Number(url.searchParams.get('days')) || 7));
	const today = Math.floor(Date.now() / 86400000);

	// Generate in parallel so we don't blow the function timeout on N sequential
	// LLM calls.
	const seeded = await Promise.all(
		Array.from({ length: days }, (_, i) => ensureDay(today + i + 1))
	);
	return json({ created: seeded.filter((s) => s.created).length, days, seeded });
};
