import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { getGlobalStats, getModelStandings } from '$lib/server/stats';
import type { SafeBattle, Battle } from '$lib/types';
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

	function toSafe(battle: Battle): SafeBattle {
		return {
			...battle,
			outputs: {
				modelA: { text: battle.outputs.modelA.text },
				modelB: { text: battle.outputs.modelB.text },
				modelC: { text: battle.outputs.modelC.text },
				...(battle.outputs.modelD ? { modelD: { text: battle.outputs.modelD.text } } : {}),
				...(battle.outputs.modelE ? { modelE: { text: battle.outputs.modelE.text } } : {})
			}
		};
	}

	return {
		daily: dailyBattle ? toSafe(dailyBattle as unknown as Battle) : null,
		battleNumber: battleCount ?? 0,
		stats,
		standings,
		recent: (recentBattles ?? []).map((b) => toSafe(b as unknown as Battle)),
		meta: {
			title: `${SITE_NAME} — Can You Tell Which AI Wrote This?`,
			description:
				'5 AI models. Same prompt. No names. Vote blind and find out if you can tell Claude from ChatGPT from Gemini. The social human benchmark for AI.',
			canonical: SITE_URL,
			ogImage: OG_IMAGE
		}
	};
};
