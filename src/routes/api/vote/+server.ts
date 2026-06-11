import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { getCrowdStats } from '$lib/server/stats';
import { displaySlots, displayToCanonical, canonicalToDisplay, truthBySlot } from '$lib/server/battle';
import type { Battle, GuessMap, ModelName, RevealPayload, Slot } from '$lib/types';
import { BATTLE_MODELS } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { battle_id, fingerprint, favorite, guesses } = body as {
		battle_id?: string;
		fingerprint?: string;
		favorite?: Slot;
		guesses?: GuessMap;
	};

	if (!battle_id || !fingerprint || !favorite || !guesses) {
		error(400, 'Missing required fields');
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
	const slots = displaySlots(battle);
	const truth = truthBySlot(battle);

	// Validate: every slot tagged, all tags are real models, no model used twice
	if (!slots.includes(favorite)) error(400, 'Invalid favorite');
	const tagged = slots.map((s) => guesses[s]);
	if (tagged.some((m) => !m || !BATTLE_MODELS.includes(m))) error(400, 'Tag every response');
	if (new Set(tagged).size !== tagged.length) error(400, 'Each model can only be used once');

	const score = slots.reduce((n, s) => n + (guesses[s] === truth[s]?.name ? 1 : 0), 0);

	// Store canonically so vote rows mean the same thing across battles
	const canonicalGuesses: GuessMap = {};
	for (const s of slots) canonicalGuesses[displayToCanonical(battle, s)] = guesses[s];

	const { data: existing } = await supabase
		.from('votes')
		.select('choice, guesses, score')
		.eq('battle_id', battle_id)
		.eq('fingerprint', fingerprint)
		.maybeSingle();

	let yourFavorite: Slot = favorite;
	let yourGuesses: GuessMap = guesses;
	let yourScore = score;

	if (!existing) {
		let { error: insertError } = await supabase.from('votes').insert({
			battle_id,
			choice: displayToCanonical(battle, favorite),
			guesses: canonicalGuesses,
			score,
			fingerprint
		});

		// graceful degradation if migration 004 hasn't been applied yet
		if (insertError && /column|guesses|score/i.test(insertError.message)) {
			({ error: insertError } = await supabase.from('votes').insert({
				battle_id,
				choice: displayToCanonical(battle, favorite),
				fingerprint
			}));
		}

		if (insertError && !insertError.message.includes('duplicate')) {
			error(500, 'Failed to save vote');
		}
	} else {
		// Replay of an existing vote — return what they originally submitted
		if (existing.choice !== 'all_bad') {
			yourFavorite = canonicalToDisplay(battle, existing.choice as Slot);
		}
		if (existing.guesses) {
			yourGuesses = {};
			for (const [canonical, model] of Object.entries(existing.guesses) as [Slot, ModelName][]) {
				yourGuesses[canonicalToDisplay(battle, canonical)] = model;
			}
			yourScore = typeof existing.score === 'number' ? existing.score : 0;
		}
	}

	const crowd = await getCrowdStats(battle);

	const payload: RevealPayload = {
		truth,
		your_favorite: yourFavorite,
		your_guesses: yourGuesses,
		score: yourScore,
		out_of: slots.length,
		crowd
	};

	return json(payload);
};
