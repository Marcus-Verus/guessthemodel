import {
	buildDailyRounds,
	categoryForDay,
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

/** Generate a puzzle for a day and store it (idempotent). Returns the stored one. */
async function buildAndStore(day: number, category: Category): Promise<DailyPuzzle> {
	const fakes = await generateFakes(category.label);
	const items = buildDailyRounds(category, fakes);
	const live = !!fakes;

	const c = db();
	if (c) {
		// ignoreDuplicates handles the race where two visitors generate at once.
		await c
			.from('daily_puzzles')
			.upsert({ day, category: category.id, items, live }, { onConflict: 'day', ignoreDuplicates: true });
		const stored = await c.from('daily_puzzles').select('items, live').eq('day', day).maybeSingle();
		if (stored.data) {
			return { day, category, items: stored.data.items as Product[], live: !!stored.data.live };
		}
	}
	return { day, category, items, live };
}

/**
 * Return today's shared puzzle. Generated once (first visitor) and stored when
 * Supabase is configured, so everyone plays the same #N and past days persist.
 * Falls back to a per-request build with no DB.
 */
export async function getDailyPuzzle(): Promise<DailyPuzzle> {
	const day = dayIndex();
	const category = categoryForDay(day);
	const c = db();
	if (c) {
		const existing = await c
			.from('daily_puzzles')
			.select('items, live')
			.eq('day', day)
			.maybeSingle();
		if (existing.data) {
			return { day, category, items: existing.data.items as Product[], live: !!existing.data.live };
		}
	}
	return buildAndStore(day, category);
}

/** Pre-seed a future (or any) day if it doesn't exist yet. Needs Supabase. */
export async function ensureDay(day: number): Promise<{ day: number; created: boolean }> {
	const c = db();
	if (!c) return { day, created: false };
	const existing = await c.from('daily_puzzles').select('day').eq('day', day).maybeSingle();
	if (existing.data) return { day, created: false };
	await buildAndStore(day, categoryForDay(day));
	return { day, created: true };
}
