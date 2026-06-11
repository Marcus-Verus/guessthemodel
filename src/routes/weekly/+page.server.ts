import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { modelIdToName } from '$lib/server/stats';
import type { ModelName } from '$lib/types';
import { MODEL_LABELS } from '$lib/types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

export interface WeeklyBattle {
	id: string;
	prompt: string;
	category: string;
	battle_date: string;
	winner: ModelName | null;
	winnerPct: number;
	runnerUp: ModelName | null;
	runnerUpPct: number;
	totalVotes: number;
	margin: number;
	models: Array<{ name: ModelName; pct: number }>;
}

export const load: PageServerLoad = async () => {
	const today = new Date();
	const weekAgo = new Date(today);
	weekAgo.setDate(today.getDate() - 6);

	const weekStart = weekAgo.toISOString().slice(0, 10);
	const weekEnd = today.toISOString().slice(0, 10);

	const [{ data: battles }, { data: votes }] = await Promise.all([
		supabase
			.from('battles')
			.select('id, prompt, category, outputs, battle_date')
			.eq('is_daily', true)
			.gte('battle_date', weekStart)
			.lte('battle_date', weekEnd)
			.order('battle_date', { ascending: false }),
		supabase.from('votes').select('battle_id, choice')
	]);

	const battleIds = new Set((battles ?? []).map(b => b.id));
	const voteCounts = new Map<string, Record<string, number>>();
	for (const v of votes ?? []) {
		if (!battleIds.has(v.battle_id)) continue;
		if (!voteCounts.has(v.battle_id)) voteCounts.set(v.battle_id, {});
		const c = voteCounts.get(v.battle_id)!;
		c[v.choice] = (c[v.choice] ?? 0) + 1;
	}

	const slots = ['A', 'B', 'C', 'D', 'E'] as const;
	const outputKeys = ['modelA', 'modelB', 'modelC', 'modelD', 'modelE'] as const;

	const weeklyBattles: WeeklyBattle[] = (battles ?? []).map(battle => {
		const outputs = battle.outputs as Record<string, { model_id: string } | undefined>;
		const slotToModel: Partial<Record<string, ModelName>> = {};
		for (let i = 0; i < outputKeys.length; i++) {
			const out = outputs[outputKeys[i]];
			if (out) slotToModel[slots[i]] = modelIdToName(out.model_id);
		}

		const counts = voteCounts.get(battle.id) ?? {};
		const realVotes = Object.entries(counts)
			.filter(([k]) => k !== 'all_bad')
			.reduce((sum, [, n]) => sum + n, 0);
		const total = Object.values(counts).reduce((s, n) => s + n, 0);

		const modelVotes: Array<{ name: ModelName; votes: number }> = [];
		for (const [slot, model] of Object.entries(slotToModel) as [string, ModelName][]) {
			modelVotes.push({ name: model, votes: counts[slot] ?? 0 });
		}
		modelVotes.sort((a, b) => b.votes - a.votes);

		const winner = modelVotes[0]?.votes > 0 ? modelVotes[0].name : null;
		const runnerUp = modelVotes[1]?.votes > 0 ? modelVotes[1].name : null;
		const winnerPct = realVotes > 0 && winner ? Math.round((modelVotes[0].votes / realVotes) * 100) : 0;
		const runnerUpPct = realVotes > 0 && runnerUp ? Math.round((modelVotes[1].votes / realVotes) * 100) : 0;
		const margin = winnerPct - runnerUpPct;

		return {
			id: battle.id,
			prompt: battle.prompt,
			category: battle.category,
			battle_date: battle.battle_date,
			winner,
			winnerPct,
			runnerUp,
			runnerUpPct,
			totalVotes: total,
			margin,
			models: modelVotes.map(m => ({ name: m.name, pct: realVotes > 0 ? Math.round((m.votes / realVotes) * 100) : 0 }))
		};
	});

	// Weekly stats
	const modelWins: Record<string, number> = {};
	for (const b of weeklyBattles) {
		if (b.winner) modelWins[b.winner] = (modelWins[b.winner] ?? 0) + 1;
	}

	const topModel = Object.entries(modelWins).sort((a, b) => b[1] - a[1])[0];
	const mostContested = [...weeklyBattles].sort((a, b) => a.margin - b.margin)[0];
	const mostDominant = [...weeklyBattles].sort((a, b) => b.margin - a.margin)[0];
	const totalWeekVotes = weeklyBattles.reduce((s, b) => s + b.totalVotes, 0);

	return {
		weeklyBattles,
		weekStart,
		weekEnd,
		topModel: topModel ? { name: topModel[0] as ModelName, label: MODEL_LABELS[topModel[0] as ModelName], wins: topModel[1] } : null,
		mostContested: mostContested ?? null,
		mostDominant: mostDominant ?? null,
		totalWeekVotes,
		meta: {
			title: `This Week in AI | ${SITE_NAME}`,
			description: 'Weekly breakdown of blind AI battles. Which model won? Which got destroyed? Real human votes — no brand bias.',
			canonical: `${SITE_URL}/weekly`,
			ogImage: OG_IMAGE
		}
	};
};
