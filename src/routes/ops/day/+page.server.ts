import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { getPuzzleForDay } from '$lib/server/daily';
import { numberForDay, dayForNumber } from '$lib/duped';

export const load: PageServerLoad = async ({ url, cookies }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('key') ?? cookies.get('ops_key');
	if (!secret || provided !== secret) error(404, 'Not found');
	cookies.set('ops_key', provided, {
		path: '/ops',
		httpOnly: true,
		sameSite: 'lax',
		secure: url.protocol === 'https:',
		maxAge: 60 * 60 * 24 * 30
	});

	const today = Math.floor(Date.now() / 86400000);
	const todayNumber = numberForDay(today);

	// Review any day from #1 up to a week ahead.
	const requested = Number(url.searchParams.get('n'));
	const n = Number.isFinite(requested)
		? Math.min(Math.max(1, requested), todayNumber + 7)
		: todayNumber;
	const day = dayForNumber(n);

	const puzzle = await getPuzzleForDay(day);

	return {
		number: n,
		date: new Date(day * 86400000).toISOString().slice(0, 10),
		category: puzzle.category,
		items: puzzle.items,
		live: puzzle.live,
		isToday: n === todayNumber,
		todayNumber,
		prev: n > 1 ? n - 1 : null,
		next: n < todayNumber + 7 ? n + 1 : null
	};
};
