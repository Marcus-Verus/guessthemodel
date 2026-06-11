import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import type { DeckSource } from '$lib/types';

/**
 * Judge the current Survival card. Correct → streak continues.
 * Wrong → run over, with today's stats for the death screen.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { run_id, fingerprint, guess } = body as {
		run_id?: string;
		fingerprint?: string;
		guess?: DeckSource;
	};
	if (!run_id || !fingerprint || (guess !== 'human' && guess !== 'ai')) {
		error(400, 'Missing or invalid fields');
	}

	const { data: run } = await supabase
		.from('survival_runs')
		.select('id, streak, alive, current_item, seen')
		.eq('id', run_id)
		.eq('fingerprint', fingerprint)
		.maybeSingle();

	if (!run || !run.alive) error(400, 'No active run');
	if (!run.current_item) error(400, 'No card served');

	const { data: item } = await supabase
		.from('pool_items')
		.select('id, source, label')
		.eq('id', run.current_item)
		.single();
	if (!item) error(500, 'Card vanished');

	const correct = guess === item.source;
	const seen = [...(run.seen ?? []), { id: item.id, guess, correct }];
	const streak = correct ? run.streak + 1 : run.streak;

	await supabase
		.from('survival_runs')
		.update({ streak, alive: correct, current_item: null, seen })
		.eq('id', run.id);

	if (correct) {
		return json({ correct: true, truth: item.source, label: item.label, streak });
	}

	// dead — compute today's bragging context from finished runs
	const today = new Date().toISOString().slice(0, 10);
	const { data: deadRuns } = await supabase
		.from('survival_runs')
		.select('streak')
		.eq('run_date', today)
		.eq('alive', false);

	const streaks = (deadRuns ?? []).map((r) => r.streak);
	const todayBest = streaks.length ? Math.max(...streaks) : streak;
	const beaten = streaks.filter((s) => s < streak).length;
	const beatPct = streaks.length > 1 ? Math.round((beaten / streaks.length) * 100) : null;

	return json({
		correct: false,
		truth: item.source,
		label: item.label,
		streak,
		dead: true,
		today_best: todayBest,
		today_runs: streaks.length,
		beat_pct: beatPct
	});
};
