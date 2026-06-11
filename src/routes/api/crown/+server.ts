import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { getCrowdStats } from '$lib/server/stats';
import { displaySlots, displayToCanonical } from '$lib/server/battle';
import type { Battle, Slot } from '$lib/types';

/** Optional post-game tap: crown the best answer. Feeds the crowd-favorite stats. */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { battle_id, fingerprint, favorite } = body as {
		battle_id?: string;
		fingerprint?: string;
		favorite?: Slot;
	};

	if (!battle_id || !fingerprint || !favorite) {
		error(400, 'Missing required fields');
	}

	const { data: battleRow } = await supabase
		.from('battles')
		.select('id, outputs')
		.eq('id', battle_id)
		.single();

	if (!battleRow) error(404, 'Battle not found');
	const battle = battleRow as unknown as Pick<Battle, 'id' | 'outputs'>;

	if (!displaySlots(battle).includes(favorite)) error(400, 'Invalid slot');

	const { data: existing } = await supabase
		.from('votes')
		.select('id, score')
		.eq('battle_id', battle_id)
		.eq('fingerprint', fingerprint)
		.maybeSingle();

	// only finished games get a crown
	if (!existing || typeof existing.score !== 'number') {
		error(400, 'Finish the game first');
	}

	await supabase
		.from('votes')
		.update({ choice: displayToCanonical(battle, favorite) })
		.eq('id', existing.id);

	return json({ crowd: await getCrowdStats(battle) });
};
