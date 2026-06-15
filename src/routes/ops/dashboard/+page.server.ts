import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/supabase';
import { numberForDay, categoryForDay } from '$lib/duped';

interface Bucket {
	date: string;
	count: number;
}

function emptyBuckets(days: number): Bucket[] {
	const out: Bucket[] = [];
	const todayMs = Math.floor(Date.now() / 86400000) * 86400000;
	for (let i = days - 1; i >= 0; i--) {
		out.push({ date: new Date(todayMs - i * 86400000).toISOString().slice(0, 10), count: 0 });
	}
	return out;
}

function tally(buckets: Bucket[], isoDates: (string | null | undefined)[]) {
	const index = new Map(buckets.map((b, i) => [b.date, i]));
	for (const iso of isoDates) {
		if (!iso) continue;
		const i = index.get(iso.slice(0, 10));
		if (i !== undefined) buckets[i].count++;
	}
}

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

	const c = db();
	if (!c) {
		return { configured: false } as const;
	}

	const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
	const since24 = new Date(Date.now() - 86400000).toISOString();

	const countType = async (type: string, after?: string) => {
		let q = c.from('events').select('*', { count: 'exact', head: true }).eq('type', type);
		if (after) q = q.gte('created_at', after);
		return (await q).count ?? 0;
	};

	const today = Math.floor(Date.now() / 86400000);

	const [
		{ count: signups },
		recent,
		signups30,
		events30,
		upcomingRows,
		starts,
		games,
		gamesToday,
		endless,
		clicks,
		shares,
		saves
	] = await Promise.all([
		c.from('signups').select('*', { count: 'exact', head: true }),
		c.from('signups').select('email, created_at').order('created_at', { ascending: false }).limit(50),
		c.from('signups').select('created_at').gte('created_at', since30).limit(5000),
		c
			.from('events')
			.select('type, meta, created_at')
			.gte('created_at', since30)
			.order('created_at', { ascending: false })
			.limit(3000),
		c.from('daily_puzzles').select('day, live').gte('day', today).lte('day', today + 6),
		countType('play_game'),
		countType('game_complete'),
		countType('game_complete', since24),
		countType('endless_over'),
		countType('amazon_click'),
		countType('share'),
		countType('save_find')
	]);

	// Trends (last 30 days)
	const signupTrend = emptyBuckets(30);
	const gameTrend = emptyBuckets(30);
	tally(signupTrend, (signups30.data ?? []).map((r) => r.created_at as string));
	tally(
		gameTrend,
		((events30.data ?? []) as { type: string; created_at: string }[])
			.filter((e) => e.type === 'game_complete')
			.map((e) => e.created_at)
	);

	// Activity feed (recent events)
	const activity = ((events30.data ?? []) as { type: string; meta: Record<string, unknown> | null; created_at: string }[])
		.slice(0, 25)
		.map((e) => ({ type: e.type, meta: e.meta, at: e.created_at }));

	// Upcoming week of games
	const seededDays = new Set((upcomingRows.data ?? []).map((r) => r.day as number));
	const upcoming = Array.from({ length: 7 }, (_, i) => {
		const day = today + i;
		const cat = categoryForDay(day);
		return {
			number: numberForDay(day),
			date: new Date(day * 86400000).toISOString().slice(0, 10),
			category: cat,
			isToday: i === 0,
			seeded: seededDays.has(day)
		};
	});

	return {
		configured: true,
		signups: signups ?? 0,
		recent: recent.data ?? [],
		starts,
		games,
		gamesToday,
		endless,
		clicks,
		shares,
		saves,
		signupTrend,
		gameTrend,
		activity,
		upcoming
	} as const;
};
