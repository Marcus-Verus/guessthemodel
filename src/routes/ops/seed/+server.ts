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

	const seeded: { day: number; created: boolean }[] = [];
	for (let i = 1; i <= days; i++) {
		seeded.push(await ensureDay(today + i));
	}
	return json({ created: seeded.filter((s) => s.created).length, days, seeded });
};
