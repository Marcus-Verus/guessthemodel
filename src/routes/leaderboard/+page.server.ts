import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { modelIdToName } from '$lib/server/stats';
import type { ModelName, Category } from '$lib/types';
import { MODEL_LABELS, CATEGORIES } from '$lib/types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

export interface LeaderboardRow {
	model: ModelName;
	label: string;
	battles: number;
	wins: number;
	winRate: number;
	votes: number;
	totalVotes: number;
	voteShare: number;
}

export const load: PageServerLoad = async () => {
	const [{ data: battles }, { data: votes }] = await Promise.all([
		supabase.from('battles').select('id, category, outputs'),
		supabase.from('votes').select('battle_id, choice')
	]);

	// Build vote counts per battle
	const voteCounts = new Map<string, Record<string, number>>();
	for (const v of votes ?? []) {
		if (!voteCounts.has(v.battle_id)) voteCounts.set(v.battle_id, {});
		const c = voteCounts.get(v.battle_id)!;
		c[v.choice] = (c[v.choice] ?? 0) + 1;
	}

	const modelStats: Record<ModelName, { battles: number; wins: number; votes: number; totalVotes: number }> = {
		claude:     { battles: 0, wins: 0, votes: 0, totalVotes: 0 },
		chatgpt:    { battles: 0, wins: 0, votes: 0, totalVotes: 0 },
		gemini:     { battles: 0, wins: 0, votes: 0, totalVotes: 0 },
		grok:       { battles: 0, wins: 0, votes: 0, totalVotes: 0 },
		perplexity: { battles: 0, wins: 0, votes: 0, totalVotes: 0 }
	};

	const slots = ['A', 'B', 'C', 'D', 'E'] as const;
	const outputKeys = ['modelA', 'modelB', 'modelC', 'modelD', 'modelE'] as const;

	for (const battle of battles ?? []) {
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

		// Determine winner (most votes, no ties)
		let winner: ModelName | null = null;
		let maxV = 0;
		let tied = false;
		for (const [slot, model] of Object.entries(slotToModel) as [string, ModelName][]) {
			const v = counts[slot] ?? 0;
			if (v > maxV) { maxV = v; winner = model; tied = false; }
			else if (v === maxV && v > 0) { tied = true; }
		}
		if (tied) winner = null;

		for (const [slot, model] of Object.entries(slotToModel) as [string, ModelName][]) {
			modelStats[model].battles++;
			modelStats[model].votes += counts[slot] ?? 0;
			modelStats[model].totalVotes += realVotes;
			if (winner === model) modelStats[model].wins++;
		}
	}

	const rows: LeaderboardRow[] = (Object.entries(modelStats) as [ModelName, typeof modelStats.claude][])
		.filter(([, s]) => s.battles > 0)
		.map(([model, s]) => ({
			model,
			label: MODEL_LABELS[model],
			battles: s.battles,
			wins: s.wins,
			winRate: s.battles > 0 ? s.wins / s.battles : 0,
			votes: s.votes,
			totalVotes: s.totalVotes,
			voteShare: s.totalVotes > 0 ? s.votes / s.totalVotes : 0
		}))
		.sort((a, b) => b.winRate - a.winRate);

	return {
		rows,
		totalBattles: (battles ?? []).length,
		totalVotes: (votes ?? []).filter((v) => v.choice !== 'all_bad').length,
		meta: {
			title: `AI Model Leaderboard | ${SITE_NAME}`,
			description: 'Which AI wins the most blind battles? Real crowd votes, no brand bias. Claude vs ChatGPT vs Gemini vs Grok vs Perplexity — ranked by humans.',
			canonical: `${SITE_URL}/leaderboard`,
			ogImage: OG_IMAGE
		}
	};
};
