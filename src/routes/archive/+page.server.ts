import type { PageServerLoad } from './$types';
import { numberForDay, dayForNumber, categoryForDay } from '$lib/duped';

export const load: PageServerLoad = () => {
	const today = Math.floor(Date.now() / 86400000);
	const todayNumber = numberForDay(today);

	// Newest first, today included. Cap so the list stays sane over time.
	const max = Math.min(todayNumber, 120);
	const days = Array.from({ length: max }, (_, i) => {
		const n = todayNumber - i;
		const day = dayForNumber(n);
		const c = categoryForDay(day);
		return { number: n, category: c, isToday: n === todayNumber };
	});

	return { days };
};
