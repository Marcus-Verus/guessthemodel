import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import type { Deck, DeckSource } from '$lib/types';

/**
 * One round of Human-or-AI: guess whether item `index` was written by
 * a human or generated. First answer per item is final; replays return
 * the original result.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { deck_id, fingerprint, index, guess } = body as {
		deck_id?: string;
		fingerprint?: string;
		index?: number;
		guess?: DeckSource;
	};

	if (!deck_id || !fingerprint || typeof index !== 'number' || !guess) {
		error(400, 'Missing required fields');
	}
	if (guess !== 'human' && guess !== 'ai') {
		error(400, 'Guess must be human or ai');
	}

	const { data: deckRow } = await supabase.from('decks').select('*').eq('id', deck_id).single();
	if (!deckRow) error(404, 'Deck not found');

	const deck = deckRow as unknown as Deck;
	if (index < 0 || index >= deck.items.length) error(400, 'Invalid index');

	const { data: existing } = await supabase
		.from('deck_plays')
		.select('answers, score')
		.eq('deck_id', deck_id)
		.eq('fingerprint', fingerprint)
		.maybeSingle();

	const answers: Record<string, DeckSource> = { ...(existing?.answers ?? {}) };

	if (!answers[index]) {
		answers[index] = guess;
		const done = deck.items.every((_, i) => answers[i]);
		const score = deck.items.reduce((n, item, i) => n + (answers[i] === item.source ? 1 : 0), 0);

		if (existing) {
			const { error: updateError } = await supabase
				.from('deck_plays')
				.update({ answers, score: done ? score : null })
				.eq('deck_id', deck_id)
				.eq('fingerprint', fingerprint);
			if (updateError) error(500, 'Failed to save');
		} else {
			const { error: insertError } = await supabase
				.from('deck_plays')
				.insert({ deck_id, fingerprint, answers, score: done ? score : null });
			if (insertError && !insertError.message.includes('duplicate')) {
				error(500, 'Failed to save');
			}
		}
	}

	const stored = answers[index];
	const item = deck.items[index];
	const done = deck.items.every((_, i) => answers[i]);

	let extras = {};
	if (done) {
		const score = deck.items.reduce((n, it, i) => n + (answers[i] === it.source ? 1 : 0), 0);
		const { data: plays } = await supabase
			.from('deck_plays')
			.select('score')
			.eq('deck_id', deck_id)
			.not('score', 'is', null);
		const dist = Array.from({ length: deck.items.length + 1 }, () => 0);
		for (const p of plays ?? []) {
			if (typeof p.score === 'number' && p.score >= 0 && p.score < dist.length) dist[p.score]++;
		}
		extras = { score, out_of: deck.items.length, players: (plays ?? []).length, dist };
	}

	return json({
		correct: stored === item.source,
		your_guess: stored,
		truth: item.source,
		label: item.label,
		done,
		...extras
	});
};
