import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { generateAllOutputs, pickTwoForBattle } from '$lib/server/openrouter';
import { ADMIN_SECRET } from '$env/static/private';
import type { Category } from '$lib/types';
import { CATEGORIES } from '$lib/types';

export const POST: RequestHandler = async ({ request }) => {
	// Require admin secret
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

	// Generate outputs from all 5 models
	let allOutputs: Awaited<ReturnType<typeof generateAllOutputs>>;
	try {
		allOutputs = await generateAllOutputs(prompt.trim());
	} catch (e) {
		error(500, `OpenRouter error: ${e instanceof Error ? e.message : String(e)}`);
	}

	// Pick 2 for the battle
	let modelA: { text: string; model_id: string; name: string };
	let modelB: { text: string; model_id: string; name: string };

	try {
		const picked = pickTwoForBattle(allOutputs);
		modelA = picked.modelA;
		modelB = picked.modelB;
	} catch (e) {
		error(500, `Failed to pick models: ${e instanceof Error ? e.message : String(e)}`);
	}

	// Store in Supabase
	const { data: battle, error: dbError } = await supabase
		.from('battles')
		.insert({
			prompt: prompt.trim(),
			category,
			outputs: {
				modelA: { text: modelA.text, model_id: modelA.model_id },
				modelB: { text: modelB.text, model_id: modelB.model_id }
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
		model_A: modelA.name,
		model_B: modelB.name,
		prompt: battle.prompt,
		category: battle.category,
		is_daily: battle.is_daily,
		battle_date: battle.battle_date,
		created_at: battle.created_at
	});
};
