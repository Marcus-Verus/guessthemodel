import {
	buildDailyRounds,
	categoryForDay,
	shuffle,
	REAL_PRODUCTS,
	FALLBACK_FAKES,
	type Category,
	type Product
} from '$lib/duped';
import { db } from '$lib/server/supabase';
import { generateFakes } from '$lib/server/fakes';
import { imagesEnabled, generateProductImage } from '$lib/server/images';

function withCrowd(p: Product): Product {
	return { ...p, crowd: 18 + Math.floor(Math.random() * 64) };
}

/** Generate a product photo for a fake card (reals carry their catalog img). */
async function withImage(item: Product): Promise<Product> {
	if (item.img || item.isReal || !imagesEnabled()) return item;
	const img = await generateProductImage(item.name, item.tagline);
	return img ? { ...item, img } : item;
}

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
	let items = buildDailyRounds(category, fakes);
	const live = !!fakes;

	// Generate photos for the fake cards (no-op unless image gen is enabled).
	if (imagesEnabled()) {
		items = await Promise.all(items.map(withImage));
	}

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
 * Replace a single card in a stored day with a fresh one of the same kind
 * (real stays real, fake stays fake), avoiding the day's other items. Needs
 * Supabase to persist. Returns the updated item list.
 */
export async function regenerateItem(
	day: number,
	index: number
): Promise<{ ok: boolean; items?: Product[] }> {
	const c = db();
	const category = categoryForDay(day);

	// Load (or generate) the current stored puzzle.
	let items: Product[];
	let live = false;
	if (c) {
		const row = await c
			.from('daily_puzzles')
			.select('items, live, category')
			.eq('day', day)
			.maybeSingle();
		if (row.data && row.data.category === category.id) {
			items = row.data.items as Product[];
			live = !!row.data.live;
		} else {
			const built = await buildAndStore(day, category);
			items = built.items;
			live = built.live;
		}
	} else {
		// No DB: can't persist a single swap, so just rebuild the whole day.
		const built = await buildAndStore(day, category);
		return { ok: true, items: built.items };
	}

	if (index < 0 || index >= items.length) return { ok: false, items };

	const target = items[index];
	const used = new Set(items.map((i) => i.name));
	used.delete(target.name); // we're replacing this one

	let replacement: Product | null = null;
	if (target.isReal) {
		const pool = REAL_PRODUCTS.filter((p) => p.cat === category.id && !used.has(p.name));
		if (pool.length) replacement = { ...shuffle(pool)[0], isReal: true };
	} else {
		const fakes = await generateFakes(category.label);
		const livePool = (fakes ?? []).filter((p) => !used.has(p.name));
		const housePool = FALLBACK_FAKES.filter((p) => p.cat === category.id && !used.has(p.name));
		const pool = livePool.length ? livePool : housePool;
		if (pool.length) replacement = { ...shuffle(pool)[0], isReal: false };
	}

	if (!replacement) return { ok: false, items }; // nothing new available

	const final = await withImage(withCrowd(replacement)); // photo for new fakes (no-op if disabled)
	items = items.map((it, i) => (i === index ? final : it));
	await c.from('daily_puzzles').upsert({ day, category: category.id, items, live }, { onConflict: 'day' });
	return { ok: true, items };
}

/**
 * Pre-seed a day. Generates it if missing, or if the stored category is stale
 * (after a schedule change). With force=true it always regenerates, overwriting
 * the stored puzzle (use this to pull in new products/fakes). Needs Supabase.
 */
export async function ensureDay(day: number, force = false): Promise<{ day: number; created: boolean }> {
	const c = db();
	if (!c) return { day, created: false };
	if (!force) {
		const existing = await c.from('daily_puzzles').select('category').eq('day', day).maybeSingle();
		if (existing.data && existing.data.category === categoryForDay(day).id) {
			return { day, created: false };
		}
	}
	await buildAndStore(day, categoryForDay(day));
	return { day, created: true };
}
