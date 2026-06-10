import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { getGlobalStats, getModelLeaderboard } from '$lib/server/stats';
import type { SafeBattle, Battle, Category } from '$lib/types';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().slice(0, 10);

	const [{ data: dailyBattle }, stats, leaderboard, { data: recentBattles }] = await Promise.all([
		supabase
			.from('battles')
			.select('*')
			.eq('is_daily', true)
			.eq('battle_date', today)
			.limit(1)
			.maybeSingle(),
		getGlobalStats(),
		getModelLeaderboard('weekly'),
		supabase
			.from('battles')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(10)
	]);

	function toSafe(battle: Battle): SafeBattle {
		return {
			...battle,
			outputs: {
				modelA: { text: battle.outputs.modelA.text },
				modelB: { text: battle.outputs.modelB.text }
			}
		};
	}

	return {
		daily: dailyBattle ? toSafe(dailyBattle as unknown as Battle) : null,
		stats,
		leaderboard: leaderboard.slice(0, 3),
		recent: (recentBattles ?? []).map((b) => toSafe(b as unknown as Battle))
	};
};
