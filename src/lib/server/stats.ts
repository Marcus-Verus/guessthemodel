import { supabase } from './supabase';
import type { Battle, CrowdStats, GlobalStats, ModelName, Slot } from '$lib/types';
import { canonicalToDisplay } from './battle';

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

/** Crowd stats for one battle: favorite counts (keyed by display slot) + score distribution */
export async function getCrowdStats(battle: Pick<Battle, 'id' | 'outputs'>): Promise<CrowdStats> {
	let { data: votes } = await supabase
		.from('votes')
		.select('choice, score')
		.eq('battle_id', battle.id);

	// graceful degradation if migration 004 hasn't been applied yet
	if (!votes) {
		const fallback = await supabase.from('votes').select('choice').eq('battle_id', battle.id);
		votes = (fallback.data ?? []).map((v) => ({ ...v, score: null }));
	}

	const fav: Partial<Record<Slot, number>> = {};
	let players = 0;
	let scored_players = 0;
	const score_dist = [0, 0, 0, 0, 0, 0];

	for (const v of votes ?? []) {
		if (v.choice !== 'all_bad') {
			const display = canonicalToDisplay(battle, v.choice as Slot);
			fav[display] = (fav[display] ?? 0) + 1;
			players++;
		}
		if (typeof v.score === 'number' && v.score >= 0 && v.score <= 5) {
			score_dist[v.score]++;
			scored_players++;
		}
	}

	return { players, fav, scored_players, score_dist };
}

export interface IdentificationRow {
	model: ModelName;
	shown: number;
	correct: number;
	rate: number;
	/** model it gets mistaken for the most */
	mistakenFor: ModelName | null;
	mistakenForCount: number;
}

/** How recognizable each model is: % of guesses that correctly tagged it */
export async function getIdentificationStats(): Promise<IdentificationRow[]> {
	const [{ data: battles }, { data: votes }] = await Promise.all([
		supabase.from('battles').select('id, outputs'),
		supabase.from('votes').select('battle_id, guesses').not('guesses', 'is', null)
	]);

	const battleModels = new Map<string, Partial<Record<Slot, ModelName>>>();
	const outputKeys = ['modelA', 'modelB', 'modelC', 'modelD', 'modelE'] as const;
	const slots: Slot[] = ['A', 'B', 'C', 'D', 'E'];

	for (const b of battles ?? []) {
		const outputs = b.outputs as Record<string, { model_id: string } | undefined>;
		const map: Partial<Record<Slot, ModelName>> = {};
		outputKeys.forEach((k, i) => {
			const out = outputs[k];
			if (out) map[slots[i]] = modelIdToName(out.model_id);
		});
		battleModels.set(b.id, map);
	}

	const tally: Record<ModelName, { shown: number; correct: number; confusion: Partial<Record<ModelName, number>> }> = {
		claude: { shown: 0, correct: 0, confusion: {} },
		chatgpt: { shown: 0, correct: 0, confusion: {} },
		gemini: { shown: 0, correct: 0, confusion: {} },
		grok: { shown: 0, correct: 0, confusion: {} },
		perplexity: { shown: 0, correct: 0, confusion: {} }
	};

	for (const v of votes ?? []) {
		const truth = battleModels.get(v.battle_id);
		if (!truth) continue;
		const guesses = v.guesses as Partial<Record<Slot, ModelName>>;
		for (const [slot, actual] of Object.entries(truth) as [Slot, ModelName][]) {
			const guessed = guesses[slot];
			if (!guessed) continue;
			tally[actual].shown++;
			if (guessed === actual) tally[actual].correct++;
			else tally[actual].confusion[guessed] = (tally[actual].confusion[guessed] ?? 0) + 1;
		}
	}

	return (Object.entries(tally) as [ModelName, (typeof tally)['claude']][])
		.filter(([, t]) => t.shown > 0)
		.map(([model, t]) => {
			const topMistake = (Object.entries(t.confusion) as [ModelName, number][]).sort((a, b) => b[1] - a[1])[0];
			return {
				model,
				shown: t.shown,
				correct: t.correct,
				rate: t.correct / t.shown,
				mistakenFor: topMistake?.[0] ?? null,
				mistakenForCount: topMistake?.[1] ?? 0
			};
		})
		.sort((a, b) => b.rate - a.rate);
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
