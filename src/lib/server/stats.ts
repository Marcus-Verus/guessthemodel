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
	const both_bad = votes.filter((v) => v.choice === 'both_bad').length;

	const outputs = battle.outputs as {
		modelA: { model_id: string };
		modelB: { model_id: string };
	};

	return {
		total,
		A,
		B,
		both_bad,
		model_A_name: modelIdToName(outputs.modelA.model_id),
		model_B_name: modelIdToName(outputs.modelB.model_id)
	};
}

export function generateInsight(stats: VoteStats): string {
	if (stats.total === 0) return '';

	const bothBadPct = stats.both_bad / stats.total;
	if (bothBadPct > 0.4) return 'Most voters found both responses disappointing.';

	const winnerChoice = stats.A >= stats.B ? 'A' : 'B';
	const winner = winnerChoice === 'A' ? stats.model_A_name : stats.model_B_name;
	const loser = winnerChoice === 'A' ? stats.model_B_name : stats.model_A_name;
	const winVotes = winnerChoice === 'A' ? stats.A : stats.B;
	const pct = Math.round((winVotes / stats.total) * 100);

	return `${MODEL_LABELS[winner]} won ${pct}% of votes over ${MODEL_LABELS[loser]}.`;
}

export function modelIdToName(modelId: string): ModelName {
	if (modelId.startsWith('anthropic/')) return 'claude';
	if (modelId.startsWith('openai/')) return 'chatgpt';
	if (modelId.startsWith('google/')) return 'gemini';
	if (modelId.startsWith('x-ai/')) return 'grok';
	if (modelId.startsWith('perplexity/')) return 'perplexity';
	return 'claude';
}
