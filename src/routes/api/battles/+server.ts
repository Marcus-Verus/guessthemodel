import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { generateBattleOutputs } from '$lib/server/openrouter';
import { ADMIN_SECRET } from '$env/static/private';
import type { Category } from '$lib/types';
import { CATEGORIES } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
		error(401, 'Unauthorized');
	}

	const body = await request.json();
	const { prompt, category, is_daily = false, battle_date = null } = body;

	if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
		error(400, 'prompt is required');
	}

	if (!category || !CATEGORIES.includes(category as Category)) {
		error(400, `category must be one of: ${CATEGORIES.join(', ')}`);
	}

	let outputs: Awaited<ReturnType<typeof generateBattleOutputs>>;
	try {
		outputs = await generateBattleOutputs(prompt.trim());
	} catch (e) {
		error(500, `OpenRouter error: ${e instanceof Error ? e.message : String(e)}`);
	}

	const { data: battle, error: dbError } = await supabase
		.from('battles')
		.insert({
			prompt: prompt.trim(),
			category,
			outputs: {
				modelA: { text: outputs.claude.text,     model_id: outputs.claude.model_id },
				modelB: { text: outputs.chatgpt.text,    model_id: outputs.chatgpt.model_id },
				modelC: { text: outputs.gemini.text,     model_id: outputs.gemini.model_id },
				modelD: { text: outputs.grok.text,       model_id: outputs.grok.model_id },
				modelE: { text: outputs.perplexity.text, model_id: outputs.perplexity.model_id }
			},
			is_daily,
			battle_date: battle_date ?? (is_daily ? new Date().toISOString().slice(0, 10) : null)
		})
		.select()
		.single();

	if (dbError) {
		error(500, `Database error: ${dbError.message}`);
	}

	return json({
		id: battle.id,
		model_A: 'claude',
		model_B: 'chatgpt',
		model_C: 'gemini',
		model_D: 'grok',
		model_E: 'perplexity',
		prompt: battle.prompt,
		category: battle.category,
		is_daily: battle.is_daily,
		battle_date: battle.battle_date,
		created_at: battle.created_at
	});
};
