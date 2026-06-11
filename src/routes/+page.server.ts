import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { getGlobalStats } from '$lib/server/stats';
import type { SafeBattle, Battle } from '$lib/types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().slice(0, 10);

	const [{ data: dailyBattle }, stats, { data: recentBattles }] = await Promise.all([
		supabase
			.from('battles')
			.select('*')
			.eq('is_daily', true)
			.eq('battle_date', today)
			.limit(1)
			.maybeSingle(),
		getGlobalStats(),
		supabase
			.from('battles')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(12)
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
		stats,
		recent: (recentBattles ?? []).map((b) => toSafe(b as unknown as Battle)),
		meta: {
			title: `${SITE_NAME} — Can You Tell Which AI Wrote This?`,
			description:
				'Vote blind on real AI outputs. Guess which model wrote it — Claude, ChatGPT or Gemini. See the crowd results and find out if you can tell the difference.',
			canonical: SITE_URL,
			ogImage: OG_IMAGE
		}
	};
};
