import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { DECK_THEMES } from '$lib/humans';

interface SeenEntry {
	id: string;
	guess: string;
	correct: boolean;
}

/**
 * Serve the next Survival card. Creates a run if needed, resumes an
 * unanswered card, never reveals the answer.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { fingerprint, run_id } = body as { fingerprint?: string; run_id?: string };
	if (!fingerprint) error(400, 'Missing fingerprint');

	interface RunRow {
		id: string;
		streak: number;
		alive: boolean;
		current_item: string | null;
		seen: SeenEntry[];
	}

	let run: RunRow | null = null;

	if (run_id) {
		const { data } = await supabase
			.from('survival_runs')
			.select('id, streak, alive, current_item, seen')
			.eq('id', run_id)
			.eq('fingerprint', fingerprint)
			.maybeSingle();
		if (data?.alive) run = data as RunRow;
	}

	if (!run) {
		const { data, error: insertError } = await supabase
			.from('survival_runs')
			.insert({ fingerprint })
			.select('id, streak, alive, current_item, seen')
			.single();
		if (insertError || !data) error(500, 'Failed to start run');
		run = data as RunRow;
	}

	// resume an unanswered card after a refresh
	if (run!.current_item) {
		const { data: item } = await supabase
			.from('pool_items')
			.select('id, text, theme')
			.eq('id', run!.current_item)
			.single();
		if (item) {
			return json({
				run_id: run!.id,
				streak: run!.streak,
				item: { id: item.id, text: item.text, themeLabel: themeLabel(item.theme) }
			});
		}
	}

	const seenIds = new Set((run!.seen ?? []).map((s) => s.id));
	const { data: pool } = await supabase.from('pool_items').select('id, text, theme').eq('active', true);
	const candidates = (pool ?? []).filter((p) => !seenIds.has(p.id));

	if (candidates.length === 0) {
		// they cleared the entire pool — a legendary run
		return json({ run_id: run!.id, streak: run!.streak, cleared: true });
	}

	const item = candidates[Math.floor(Math.random() * candidates.length)];
	await supabase.from('survival_runs').update({ current_item: item.id }).eq('id', run!.id);

	return json({
		run_id: run!.id,
		streak: run!.streak,
		item: { id: item.id, text: item.text, themeLabel: themeLabel(item.theme) }
	});
};

function themeLabel(themeId: string): string {
	return DECK_THEMES.find((t) => t.id === themeId)?.label ?? '';
}
