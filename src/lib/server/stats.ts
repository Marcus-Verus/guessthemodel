import { supabase } from './supabase';
import type {
	ModelLeaderboardEntry,
	ModelName,
	PlayerLeaderboardEntry,
	GlobalStats,
	VoteStats
} from '$lib/types';
import { MODEL_LABELS, PLAYER_TITLES } from '$lib/types';

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

	const { data: votes } = await supabase.from('votes').select('choice').eq('battle_id', battleId);

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

function modelIdToName(modelId: string): ModelName {
	if (modelId.startsWith('anthropic/')) return 'claude';
	if (modelId.startsWith('openai/')) return 'chatgpt';
	if (modelId.startsWith('google/')) return 'gemini';
	if (modelId.startsWith('x-ai/')) return 'grok';
	if (modelId.startsWith('perplexity/')) return 'perplexity';
	return 'claude';
}

export function generateInsight(stats: VoteStats): string {
	if (stats.total === 0) return 'No votes yet.';

	const bothBadPct = stats.both_bad / stats.total;
	if (bothBadPct > 0.4) return 'Most voters found both responses disappointing.';

	const winnerChoice = stats.A >= stats.B ? 'A' : 'B';
	const winner = winnerChoice === 'A' ? stats.model_A_name : stats.model_B_name;
	const loser = winnerChoice === 'A' ? stats.model_B_name : stats.model_A_name;
	const winVotes = winnerChoice === 'A' ? stats.A : stats.B;
	const pct = Math.round((winVotes / stats.total) * 100);

	return `${MODEL_LABELS[winner]} won ${pct}% of votes over ${MODEL_LABELS[loser]}.`;
}

export async function getModelLeaderboard(
	period: 'daily' | 'weekly' | 'monthly'
): Promise<ModelLeaderboardEntry[]> {
	const now = new Date();
	let since: Date;

	if (period === 'daily') {
		since = new Date(now);
		since.setHours(0, 0, 0, 0);
	} else if (period === 'weekly') {
		since = new Date(now);
		since.setDate(now.getDate() - 7);
	} else {
		since = new Date(now);
		since.setMonth(now.getMonth() - 1);
	}

	const { data: votes } = await supabase
		.from('votes')
		.select('choice, battle_id')
		.gte('created_at', since.toISOString())
		.neq('choice', 'both_bad');

	if (!votes || votes.length === 0) {
		return (['claude', 'chatgpt', 'gemini', 'grok', 'perplexity'] as ModelName[]).map((m) => ({
			model: m,
			wins: 0,
			total: 0,
			win_rate: 0,
			change: 0
		}));
	}

	const battleIds = [...new Set(votes.map((v) => v.battle_id))];

	const { data: battles } = await supabase
		.from('battles')
		.select('id, outputs')
		.in('id', battleIds);

	if (!battles) return [];

	const battleMap = new Map(battles.map((b) => [b.id, b.outputs]));

	const modelWins: Record<string, number> = {};
	const modelTotal: Record<string, number> = {};

	for (const vote of votes) {
		const outputs = battleMap.get(vote.battle_id) as {
			modelA: { model_id: string };
			modelB: { model_id: string };
		} | undefined;
		if (!outputs) continue;

		const modelAName = modelIdToName(outputs.modelA.model_id);
		const modelBName = modelIdToName(outputs.modelB.model_id);

		modelTotal[modelAName] = (modelTotal[modelAName] ?? 0) + 1;
		modelTotal[modelBName] = (modelTotal[modelBName] ?? 0) + 1;

		const winner = vote.choice === 'A' ? modelAName : modelBName;
		modelWins[winner] = (modelWins[winner] ?? 0) + 1;
	}

	return (['claude', 'chatgpt', 'gemini', 'grok', 'perplexity'] as ModelName[])
		.map((model) => ({
			model,
			wins: modelWins[model] ?? 0,
			total: modelTotal[model] ?? 0,
			win_rate: modelTotal[model] ? Math.round(((modelWins[model] ?? 0) / modelTotal[model]) * 100) : 0,
			change: 0
		}))
		.sort((a, b) => b.wins - a.wins);
}

export async function getPlayerLeaderboard(
	period: 'daily' | 'weekly' | 'monthly'
): Promise<PlayerLeaderboardEntry[]> {
	const now = new Date();
	let since: Date;

	if (period === 'daily') {
		since = new Date(now);
		since.setHours(0, 0, 0, 0);
	} else if (period === 'weekly') {
		since = new Date(now);
		since.setDate(now.getDate() - 7);
	} else {
		since = new Date(now);
		since.setMonth(now.getMonth() - 1);
	}

	const { data: votes } = await supabase
		.from('votes')
		.select('fingerprint, choice, model_guess, battle_id, created_at')
		.gte('created_at', since.toISOString())
		.order('created_at', { ascending: true });

	if (!votes || votes.length === 0) return [];

	const battleIds = [...new Set(votes.map((v) => v.battle_id))];
	const { data: battles } = await supabase
		.from('battles')
		.select('id, outputs')
		.in('id', battleIds);

	const battleMap = new Map((battles ?? []).map((b) => [b.id, b.outputs]));

	const playerMap = new Map<string, {
		total_votes: number;
		model_guesses_correct: number;
		choices: string[];
		days: Set<string>;
	}>();

	for (const vote of votes) {
		const fp = vote.fingerprint;
		if (!playerMap.has(fp)) {
			playerMap.set(fp, { total_votes: 0, model_guesses_correct: 0, choices: [], days: new Set() });
		}
		const p = playerMap.get(fp)!;
		p.total_votes++;
		p.choices.push(vote.choice);
		p.days.add(vote.created_at.slice(0, 10));

		if (vote.model_guess && vote.choice !== 'both_bad') {
			const outputs = battleMap.get(vote.battle_id) as {
				modelA: { model_id: string };
				modelB: { model_id: string };
			} | undefined;
			if (outputs) {
				const actualModel = modelIdToName(
					vote.choice === 'A' ? outputs.modelA.model_id : outputs.modelB.model_id
				);
				if (vote.model_guess === actualModel) p.model_guesses_correct++;
			}
		}
	}

	return [...playerMap.entries()]
		.map(([fingerprint, p]) => {
			const titles = computeTitles(p);
			return {
				fingerprint,
				display_id: `Player #${fingerprint.slice(0, 6).toUpperCase()}`,
				streak: p.days.size,
				model_guesses_correct: p.model_guesses_correct,
				crowd_predictions_correct: 0,
				total_votes: p.total_votes,
				titles
			};
		})
		.sort((a, b) => b.streak - a.streak || b.model_guesses_correct - a.model_guesses_correct)
		.slice(0, 50);
}

function computeTitles(p: { model_guesses_correct: number; choices: string[] }): string[] {
	const titles: string[] = [];

	if (p.model_guesses_correct >= 10) titles.push(PLAYER_TITLES.MODEL_SNIPER);

	const bothBadCount = p.choices.filter((c) => c === 'both_bad').length;
	if (bothBadCount >= 5) titles.push(PLAYER_TITLES.BOTH_BAD_CHAMPION);

	const nonBothBad = p.choices.filter((c) => c !== 'both_bad');
	const modelCounts: Record<string, number> = {};

	return titles;
}
