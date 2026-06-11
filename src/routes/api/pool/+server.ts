import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { ADMIN_SECRET } from '$env/static/private';
import { OPENROUTER_MODELS } from '$lib/server/openrouter';
import { generateImpostor } from '$lib/server/generate';
import { DECK_THEMES } from '$lib/humans';
import { MODEL_VERSION_LABELS, BATTLE_MODELS } from '$lib/types';

/**
 * Seed / top up the Survival pool.
 * Upserts every verified human text, then generates `per_theme` fresh
 * AI impostors per theme across random models.
 */
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
		error(401, 'Unauthorized');
	}

	const body = await request.json().catch(() => ({}));
	const perTheme = Math.min(Math.max(Number((body as { per_theme?: number }).per_theme ?? 4), 0), 10);

	// all verified humans, idempotent on text
	const humanRows = DECK_THEMES.flatMap((t) =>
		t.humans.map((h) => ({ theme: t.id, text: h.text, source: 'human', label: h.label }))
	);
	const { error: humanError } = await supabase
		.from('pool_items')
		.upsert(humanRows, { onConflict: 'text', ignoreDuplicates: true });
	if (humanError) error(500, `Human seed failed: ${humanError.message}`);

	// fresh AI impostors
	let generated = 0;
	const failures: string[] = [];
	for (const theme of DECK_THEMES) {
		const models = [...BATTLE_MODELS].sort(() => Math.random() - 0.5);
		for (let i = 0; i < perTheme; i++) {
			const model = models[i % models.length];
			const modelId = OPENROUTER_MODELS[model];
			try {
				const text = await generateImpostor(modelId, theme.aiInstruction);
				const { error: insertError } = await supabase.from('pool_items').upsert(
					[{
						theme: theme.id,
						text,
						source: 'ai',
						label: MODEL_VERSION_LABELS[modelId] ?? model,
						model_id: modelId
					}],
					{ onConflict: 'text', ignoreDuplicates: true }
				);
				if (!insertError) generated++;
			} catch (e) {
				failures.push(`${theme.id}/${model}: ${e instanceof Error ? e.message : e}`);
			}
		}
	}

	const { count } = await supabase
		.from('pool_items')
		.select('*', { count: 'exact', head: true })
		.eq('active', true);

	return json({ humans: humanRows.length, generated, pool_size: count ?? 0, failures });
};
