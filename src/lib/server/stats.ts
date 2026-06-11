import { supabase } from './supabase';
import type { GlobalStats, ModelName, VoteStats } from '$lib/types';
import { MODEL_LABELS } from '$lib/types';

export async function getGlobalStats(): Promise<GlobalStats> {
	const [votesRes, battlesRes] = await Promise.all([
		supabase.from('votes').select('id', { count: 'exact', head: true }),
		supabase.from('battles').select('id', { count: 'exact', head: true })
	]);

	return {
		votes_cast: votesRes.count ?? 0,
		battles_run: battlesRes.count ?? 0,
		models_tested: 3
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
	const all_bad = votes.filter((v) => v.choice === 'all_bad').length;

	const outputs = battle.outputs as {
		modelA: { model_id: string };
		modelB: { model_id: string };
		modelC: { model_id: string };
	};

	return {
		total,
		A,
		B,
		C,
		all_bad,
		model_A_name: modelIdToName(outputs.modelA.model_id),
		model_B_name: modelIdToName(outputs.modelB.model_id),
		model_C_name: modelIdToName(outputs.modelC.model_id)
	};
}

export function generateInsight(stats: VoteStats): string {
	if (stats.total === 0) return '';

	const allBadPct = stats.all_bad / stats.total;
	if (allBadPct > 0.4) return 'Most voters found all three responses disappointing.';

	const candidates = [
		{ name: stats.model_A_name, votes: stats.A },
		{ name: stats.model_B_name, votes: stats.B },
		{ name: stats.model_C_name, votes: stats.C }
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

export function modelIdToName(modelId: string): ModelName {
	if (modelId.startsWith('anthropic/')) return 'claude';
	if (modelId.startsWith('openai/')) return 'chatgpt';
	if (modelId.startsWith('google/')) return 'gemini';
	if (modelId.startsWith('x-ai/')) return 'grok';
	if (modelId.startsWith('perplexity/')) return 'perplexity';
	return 'claude';
}
