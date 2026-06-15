import {
	buildDailyRounds,
	todaysCategory,
	type Category,
	type Product
} from '$lib/duped';
import { db } from '$lib/server/supabase';
import { generateFakes } from '$lib/server/fakes';

export interface DailyPuzzle {
	day: number;
	category: Category;
	items: Product[];
	live: boolean;
}

function dayIndex(): number {
	return Math.floor(Date.now() / 86400000);
}

/**
 * Return today's shared puzzle. If Supabase is configured, the puzzle is
 * generated once (by the first visitor of the day) and stored, so everyone
 * plays the identical #N and past days are kept. Without Supabase it falls
 * back to a per-request build (still playable, just not shared).
 */
export async function getDailyPuzzle(): Promise<DailyPuzzle> {
	const day = dayIndex();
	const category = todaysCategory();
	const c = db();

	// No DB → build a fresh (non-shared) puzzle on the fly.
	if (!c) {
		const fakes = await generateFakes(category.label);
		return { day, category, items: buildDailyRounds(category, fakes), live: !!fakes };
	}

	// Return the stored puzzle if today's already exists.
	const existing = await c
		.from('daily_puzzles')
		.select('day, category, items, live')
		.eq('day', day)
		.maybeSingle();
	if (existing.data) {
		return {
			day,
			category,
			items: existing.data.items as Product[],
			live: !!existing.data.live
		};
	}

	// First visitor of the day: generate, store, and return.
	const fakes = await generateFakes(category.label);
	const items = buildDailyRounds(category, fakes);
	const live = !!fakes;

	// ignoreDuplicates handles the race where two visitors generate at once;
	// we then re-read to make sure everyone converges on the stored puzzle.
	await c
		.from('daily_puzzles')
		.upsert({ day, category: category.id, items, live }, { onConflict: 'day', ignoreDuplicates: true });

	const stored = await c
		.from('daily_puzzles')
		.select('items, live')
		.eq('day', day)
		.maybeSingle();

	return stored.data
		? { day, category, items: stored.data.items as Product[], live: !!stored.data.live }
		: { day, category, items, live };
}
