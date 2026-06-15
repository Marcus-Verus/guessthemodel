import type { PageServerLoad } from './$types';
import { getPuzzleForDay } from '$lib/server/daily';
import { numberForDay, dayForNumber } from '$lib/duped';

export const load: PageServerLoad = async ({ url, setHeaders }) => {
	const today = Math.floor(Date.now() / 86400000);
	const todayNumber = numberForDay(today);

	// ?day=<puzzle number> lets the archive replay a past day.
	const requested = Number(url.searchParams.get('day'));
	let day = today;
	let isArchive = false;
	if (Number.isFinite(requested) && requested >= 1 && requested < todayNumber) {
		day = dayForNumber(requested);
		isArchive = true;
	}

	const puzzle = await getPuzzleForDay(day);

	// Shared puzzles are immutable for the day — let the CDN cache briefly.
	setHeaders({ 'cache-control': 'public, max-age=60' });

	return {
		daily: {
			day,
			number: numberForDay(day),
			category: puzzle.category,
			items: puzzle.items,
			live: puzzle.live
		},
		isArchive
	};
};
