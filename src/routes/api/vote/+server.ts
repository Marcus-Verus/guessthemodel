import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { getVoteStats, generateInsight, modelIdToName } from '$lib/server/stats';
import type { Battle, VoteChoice } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { battle_id, choice, model_guess, crowd_prediction, fingerprint } = body;

	if (!battle_id || !choice || !fingerprint) {
		error(400, 'Missing required fields');
	}

	if (!['A', 'B', 'C', 'all_bad'].includes(choice)) {
		error(400, 'Invalid choice');
	}

	const { data: battleRow } = await supabase
		.from('battles')
		.select('*')
		.eq('id', battle_id)
		.single();

	if (!battleRow) {
		error(404, 'Battle not found');
	}

	const battle = battleRow as unknown as Battle;
	const model_A_name = modelIdToName(battle.outputs.modelA.model_id);
	const model_B_name = modelIdToName(battle.outputs.modelB.model_id);
	const model_C_name = modelIdToName(battle.outputs.modelC.model_id);

	const { data: existing } = await supabase
		.from('votes')
		.select('*')
		.eq('battle_id', battle_id)
		.eq('fingerprint', fingerprint)
		.maybeSingle();

	let userChoice: VoteChoice = choice;
	let userModelGuess = model_guess ?? null;
	let userCrowdPrediction = crowd_prediction ?? null;

	if (!existing) {
		const { error: insertError } = await supabase.from('votes').insert({
			battle_id,
			choice,
			model_guess: model_guess ?? null,
			crowd_prediction: crowd_prediction ?? null,
			fingerprint
		});

		if (insertError && !insertError.message.includes('duplicate')) {
			error(500, 'Failed to save vote');
		}
	} else {
		userChoice = existing.choice;
		userModelGuess = existing.model_guess;
		userCrowdPrediction = existing.crowd_prediction;
	}

	const stats = await getVoteStats(battle_id);
	if (!stats) error(500, 'Failed to get stats');

	// Which model did they actually vote for?
	let model_guess_correct: boolean | null = null;
	if (userModelGuess && userChoice !== 'all_bad') {
		const actualModel =
			userChoice === 'A' ? model_A_name : userChoice === 'B' ? model_B_name : model_C_name;
		model_guess_correct = userModelGuess === actualModel;
	}

	// Did they predict the crowd winner correctly?
	let crowd_prediction_correct: boolean | null = null;
	if (userCrowdPrediction && stats.total > 1) {
		const winner = [
			{ name: model_A_name, votes: stats.A },
			{ name: model_B_name, votes: stats.B },
			{ name: model_C_name, votes: stats.C }
		].sort((a, b) => b.votes - a.votes)[0];
		crowd_prediction_correct = userCrowdPrediction === winner.name;
	}

	const insight = generateInsight(stats);

	return json({
		model_A_name,
		model_B_name,
		model_C_name,
		your_choice: userChoice,
		model_guess_correct,
		crowd_prediction_correct,
		stats,
		insight
	});
};
