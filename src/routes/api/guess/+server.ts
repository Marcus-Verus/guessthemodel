import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { getCrowdStats } from '$lib/server/stats';
import { displaySlots, displayToCanonical, canonicalToDisplay, truthBySlot } from '$lib/server/battle';
import type { Battle, GuessMap, ModelName, Slot } from '$lib/types';
import { BATTLE_MODELS } from '$lib/types';

/**
 * One round of the game: guess which model wrote one response.
 * Reveals the truth for that slot only — instant feedback, one tap at a time.
 * First guess per slot is final; replays return the original result.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { battle_id, fingerprint, slot, guess } = body as {
		battle_id?: string;
		fingerprint?: string;
		slot?: Slot;
		guess?: ModelName;
	};

	if (!battle_id || !fingerprint || !slot || !guess) {
		error(400, 'Missing required fields');
	}
	if (!BATTLE_MODELS.includes(guess)) {
		error(400, 'Unknown model');
	}

	const { data: battleRow } = await supabase
		.from('battles')
		.select('*')
		.eq('id', battle_id)
		.single();

	if (!battleRow) error(404, 'Battle not found');

	const battle = battleRow as unknown as Battle;
	const slots = displaySlots(battle);
	const truth = truthBySlot(battle);

	if (!slots.includes(slot)) error(400, 'Invalid slot');

	const { data: existing } = await supabase
		.from('votes')
		.select('choice, guesses, score')
		.eq('battle_id', battle_id)
		.eq('fingerprint', fingerprint)
		.maybeSingle();

	// current progress, keyed by display slot
	const guesses: GuessMap = {};
	if (existing?.guesses) {
		for (const [canonical, model] of Object.entries(existing.guesses) as [Slot, ModelName][]) {
			guesses[canonicalToDisplay(battle, canonical)] = model;
		}
	}

	if (!guesses[slot]) {
		// each model can be used only once per game
		if (Object.values(guesses).includes(guess)) {
			error(400, 'Model already used');
		}
		guesses[slot] = guess;

		const done = slots.every((s) => guesses[s]);
		const score = slots.reduce((n, s) => n + (guesses[s] === truth[s]?.name ? 1 : 0), 0);

		const canonicalGuesses: GuessMap = {};
		for (const s of slots) {
			if (guesses[s]) canonicalGuesses[displayToCanonical(battle, s)] = guesses[s];
		}

		if (existing) {
			const { error: updateError } = await supabase
				.from('votes')
				.update({ guesses: canonicalGuesses, score: done ? score : null })
				.eq('battle_id', battle_id)
				.eq('fingerprint', fingerprint);
			if (updateError) error(500, 'Failed to save guess');
		} else {
			// choice 'all_bad' = no favorite crowned yet (excluded from favorite stats)
			const { error: insertError } = await supabase.from('votes').insert({
				battle_id,
				fingerprint,
				choice: 'all_bad',
				guesses: canonicalGuesses,
				score: done ? score : null
			});
			if (insertError && !insertError.message.includes('duplicate')) {
				error(500, 'Failed to save guess');
			}
		}
	}

	// respond from stored state — idempotent for replayed taps
	const storedGuess = guesses[slot]!;
	const slotTruth = truth[slot]!;
	const done = slots.every((s) => guesses[s]);

	return json({
		correct: storedGuess === slotTruth.name,
		your_guess: storedGuess,
		truth: slotTruth,
		used: Object.values(guesses),
		done,
		...(done
			? {
					score: slots.reduce((n, s) => n + (guesses[s] === truth[s]?.name ? 1 : 0), 0),
					out_of: slots.length,
					crowd: await getCrowdStats(battle)
				}
			: {})
	});
};
