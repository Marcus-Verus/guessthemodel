import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { ensureDay } from '$lib/server/daily';
import { dayForNumber } from '$lib/duped';

/** Pre-generate / regenerate daily puzzles. Gated by ADMIN_SECRET (cookie or ?key). */
export const POST: RequestHandler = async ({ url, cookies }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('key') ?? cookies.get('ops_key');
	if (!secret || provided !== secret) error(404, 'Not found');

	// Single day: ?n=<puzzle number> regenerates just that day (always force).
	const nParam = url.searchParams.get('n');
	if (nParam) {
		const n = Number(nParam);
		if (!Number.isFinite(n) || n < 1) return json({ ok: false }, { status: 400 });
		const r = await ensureDay(dayForNumber(n), true);
		return json({ created: r.created ? 1 : 0, n });
	}

	const days = Math.min(60, Math.max(1, Number(url.searchParams.get('days')) || 7));
	const force = url.searchParams.get('force') === '1';
	const today = Math.floor(Date.now() / 86400000);

	// force=1 regenerates today + the next days (overwriting); otherwise it only
	// fills missing/stale upcoming days starting tomorrow. Parallel to dodge the
	// function timeout on N sequential LLM calls.
	const start = force ? 0 : 1;
	const seeded = await Promise.all(
		Array.from({ length: days }, (_, i) => ensureDay(today + i + start, force))
	);
	return json({ created: seeded.filter((s) => s.created).length, days, force, seeded });
};
