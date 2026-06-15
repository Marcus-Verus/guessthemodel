import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/supabase';

export const load: PageServerLoad = async ({ url, cookies }) => {
	// Secret gate. Wrong/missing key looks like a 404 so the route stays hidden.
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('key') ?? cookies.get('ops_key');
	if (!secret || provided !== secret) error(404, 'Not found');

	// Remember the key so the URL doesn't need to carry it after the first hit.
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

	const since = new Date(Date.now() - 86400000).toISOString();
	const countType = async (type: string, after?: string) => {
		let q = c.from('events').select('*', { count: 'exact', head: true }).eq('type', type);
		if (after) q = q.gte('created_at', after);
		return (await q).count ?? 0;
	};

	const [{ count: signups }, recent, starts, games, gamesToday, endless, clicks, shares, saves] =
		await Promise.all([
			c.from('signups').select('*', { count: 'exact', head: true }),
			c.from('signups').select('email, created_at').order('created_at', { ascending: false }).limit(50),
			countType('play_game'),
			countType('game_complete'),
			countType('game_complete', since),
			countType('endless_over'),
			countType('amazon_click'),
			countType('share'),
			countType('save_find')
		]);

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
		saves
	} as const;
};
