import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { getGlobalStats, getModelStandings } from '$lib/server/stats';
import { toSafe } from '$lib/server/battle';
import type { Battle } from '$lib/types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().slice(0, 10);

	const [{ data: dailyBattle }, stats, standings, { data: recentBattles }, { count: battleCount }] = await Promise.all([
		supabase
			.from('battles')
			.select('*')
			.eq('is_daily', true)
			.eq('battle_date', today)
			.limit(1)
			.maybeSingle(),
		getGlobalStats(),
		getModelStandings(),
		supabase
			.from('battles')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(12),
		supabase
			.from('battles')
			.select('*', { count: 'exact', head: true })
			.eq('is_daily', true)
			.lte('battle_date', today)
	]);

	return {
		daily: dailyBattle ? toSafe(dailyBattle as unknown as Battle) : null,
		battleNumber: battleCount ?? 0,
		stats,
		standings,
		recent: (recentBattles ?? []).map((b) => toSafe(b as unknown as Battle)),
		meta: {
			title: `${SITE_NAME} — The Daily AI Guessing Game`,
			description:
				'5 answers. 5 AI models. No names. Tag who wrote what — same puzzle for everyone, new battle daily. Can you tell Claude from ChatGPT from Gemini?',
			canonical: SITE_URL,
			ogImage: OG_IMAGE
		}
	};
};
