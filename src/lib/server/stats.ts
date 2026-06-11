import { supabase } from './supabase';
import type { GlobalStats, ModelName, VoteStats } from '$lib/types';
import { MODEL_LABELS } from '$lib/types';

export interface StandingRow {
	model: ModelName;
	wins: number;
	battles: number;
	winRate: number;
}

export async function getGlobalStats(): Promise<GlobalStats> {
	const [votesRes, battlesRes] = await Promise.all([
		supabase.from('votes').select('id', { count: 'exact', head: true }),
		supabase.from('battles').select('id', { count: 'exact', head: true })
	]);

	return {
		votes_cast: votesRes.count ?? 0,
		battles_run: battlesRes.count ?? 0,
		models_tested: 5
	};
}

export async function getVoteStats(battleId: string): Promise<VoteStats | null> {
	const { data: battle } = await supabase
		.from('battles')
		.select('outputs')
		.eq('id', battleId)
		.single();

	if (!battle) return null;

	const { data: votes } = await supabase
		.from('votes')
		.select('choice')
		.eq('battle_id', battleId);

	if (!votes) return null;

	const total = votes.length;
	const A = votes.filter((v) => v.choice === 'A').length;
	const B = votes.filter((v) => v.choice === 'B').length;
	const C = votes.filter((v) => v.choice === 'C').length;
	const D = votes.filter((v) => v.choice === 'D').length;
	const E = votes.filter((v) => v.choice === 'E').length;
	const all_bad = votes.filter((v) => v.choice === 'all_bad').length;

	const outputs = battle.outputs as {
		modelA: { model_id: string };
		modelB: { model_id: string };
		modelC: { model_id: string };
		modelD?: { model_id: string };
		modelE?: { model_id: string };
	};

	return {
		total,
		A,
		B,
		C,
		D,
		E,
		all_bad,
		model_A_name: modelIdToName(outputs.modelA.model_id),
		model_B_name: modelIdToName(outputs.modelB.model_id),
		model_C_name: modelIdToName(outputs.modelC.model_id),
		...(outputs.modelD ? { model_D_name: modelIdToName(outputs.modelD.model_id) } : {}),
		...(outputs.modelE ? { model_E_name: modelIdToName(outputs.modelE.model_id) } : {})
	};
}

export function generateInsight(stats: VoteStats): string {
	if (stats.total === 0) return '';

	const allBadPct = stats.all_bad / stats.total;
	if (allBadPct > 0.4) return 'Most voters found all the responses disappointing.';

	const candidates = [
		{ name: stats.model_A_name, votes: stats.A },
		{ name: stats.model_B_name, votes: stats.B },
		{ name: stats.model_C_name, votes: stats.C },
		...(stats.model_D_name ? [{ name: stats.model_D_name, votes: stats.D ?? 0 }] : []),
		...(stats.model_E_name ? [{ name: stats.model_E_name, votes: stats.E ?? 0 }] : [])
	].sort((a, b) => b.votes - a.votes);

	const winner = candidates[0];
	const runnerUp = candidates[1];

	if (winner.votes === 0) return '';

	const pct = Math.round((winner.votes / stats.total) * 100);

	if (pct > 60) {
		return `${MODEL_LABELS[winner.name]} dominated with ${pct}% of the vote.`;
	}

	return `${MODEL_LABELS[winner.name]} edged out ${MODEL_LABELS[runnerUp.name]} with ${pct}% of votes.`;
}

export async function getModelStandings(): Promise<StandingRow[]> {
	const [{ data: battles }, { data: votes }] = await Promise.all([
		supabase.from('battles').select('id, outputs'),
		supabase.from('votes').select('battle_id, choice')
	]);

	const voteCounts = new Map<string, Record<string, number>>();
	for (const v of votes ?? []) {
		if (!voteCounts.has(v.battle_id)) voteCounts.set(v.battle_id, {});
		const c = voteCounts.get(v.battle_id)!;
		c[v.choice] = (c[v.choice] ?? 0) + 1;
	}

	const modelStats: Record<ModelName, { battles: number; wins: number }> = {
		claude:     { battles: 0, wins: 0 },
		chatgpt:    { battles: 0, wins: 0 },
		gemini:     { battles: 0, wins: 0 },
		grok:       { battles: 0, wins: 0 },
		perplexity: { battles: 0, wins: 0 }
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
		let winner: ModelName | null = null;
		let maxV = 0;
		let tied = false;
		for (const [slot, model] of Object.entries(slotToModel) as [string, ModelName][]) {
			const v = counts[slot] ?? 0;
			if (v > maxV) { maxV = v; winner = model; tied = false; }
			else if (v === maxV && v > 0) { tied = true; }
		}
		if (tied) winner = null;

		for (const model of Object.values(slotToModel) as ModelName[]) {
			modelStats[model].battles++;
			if (winner === model) modelStats[model].wins++;
		}
	}

	return (Object.entries(modelStats) as [ModelName, { battles: number; wins: number }][])
		.filter(([, s]) => s.battles > 0)
		.map(([model, s]) => ({
			model,
			wins: s.wins,
			battles: s.battles,
			winRate: s.battles > 0 ? s.wins / s.battles : 0
		}))
		.sort((a, b) => b.winRate - a.winRate);
}

export function modelIdToName(modelId: string): ModelName {
	if (modelId.startsWith('anthropic/')) return 'claude';
	if (modelId.startsWith('openai/')) return 'chatgpt';
	if (modelId.startsWith('google/')) return 'gemini';
	if (modelId.startsWith('x-ai/')) return 'grok';
	if (modelId.startsWith('perplexity/')) return 'perplexity';
	return 'claude';
}
