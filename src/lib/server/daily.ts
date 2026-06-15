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

/** Generate a puzzle for a day and store it, overwriting any stale row. */
async function buildAndStore(day: number, category: Category): Promise<DailyPuzzle> {
	const fakes = await generateFakes(category.label);
	const items = buildDailyRounds(category, fakes);
	const live = !!fakes;

	const c = db();
	if (c) {
		// onConflict update so a stale row (e.g. after a category change) is healed.
		await c.from('daily_puzzles').upsert({ day, category: category.id, items, live }, { onConflict: 'day' });
		const stored = await c.from('daily_puzzles').select('items, live').eq('day', day).maybeSingle();
		if (stored.data) {
			return { day, category, items: stored.data.items as Product[], live: !!stored.data.live };
		}
	}
	return { day, category, items, live };
}

/**
 * Return the shared puzzle for a given day. Generated once and stored when
 * Supabase is configured, so everyone plays the same #N and past days persist.
 * Regenerates automatically if the stored category no longer matches the
 * schedule (e.g. after the category list changed). Falls back to a per-request
 * build with no DB.
 */
export async function getPuzzleForDay(day: number): Promise<DailyPuzzle> {
	const category = categoryForDay(day);
	const c = db();
	if (c) {
		const existing = await c
			.from('daily_puzzles')
			.select('category, items, live')
			.eq('day', day)
			.maybeSingle();
		if (existing.data && existing.data.category === category.id) {
			return { day, category, items: existing.data.items as Product[], live: !!existing.data.live };
		}
	}
	return buildAndStore(day, category);
}

/** Today's shared puzzle. */
export function getDailyPuzzle(): Promise<DailyPuzzle> {
	return getPuzzleForDay(dayIndex());
}

/**
 * Pre-seed a day. Generates it if missing, or if the stored category is stale
 * (after a schedule change). Returns created:true when it (re)generated. Needs
 * Supabase.
 */
export async function ensureDay(day: number): Promise<{ day: number; created: boolean }> {
	const c = db();
	if (!c) return { day, created: false };
	const existing = await c.from('daily_puzzles').select('category').eq('day', day).maybeSingle();
	if (existing.data && existing.data.category === categoryForDay(day).id) {
		return { day, created: false };
	}
	await buildAndStore(day, categoryForDay(day));
	return { day, created: true };
}
