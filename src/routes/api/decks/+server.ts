import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { ADMIN_SECRET } from '$env/static/private';
import { OPENROUTER_API_KEY } from '$env/static/private';
import { OPENROUTER_MODELS } from '$lib/server/openrouter';
import { DECK_THEMES } from '$lib/humans';
import { MODEL_VERSION_LABELS, BATTLE_MODELS } from '$lib/types';
import type { DeckItem } from '$lib/types';

async function generateImpostor(modelId: string, instruction: string): Promise<string> {
	const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${OPENROUTER_API_KEY}`,
			'Content-Type': 'application/json',
			'HTTP-Referer': 'https://guessthemodel.com',
			'X-Title': 'GuessTheModel'
		},
		body: JSON.stringify({
			model: modelId,
			messages: [{ role: 'user', content: instruction }],
			temperature: 0.9,
			max_tokens: 120
		})
	});
	if (!res.ok) throw new Error(`OpenRouter ${modelId}: ${await res.text()}`);
	const data = await res.json();
	return (data.choices[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
}

/** Create a Human-or-AI deck: 3 verified human texts + 3 AI impostors, shuffled. */
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	if (!ADMIN_SECRET || authHeader !== `Bearer ${ADMIN_SECRET}`) {
		error(401, 'Unauthorized');
	}

	const body = await request.json().catch(() => ({}));
	const { theme: themeId, is_daily = false, deck_date = null } = body as {
		theme?: string;
		is_daily?: boolean;
		deck_date?: string | null;
	};

	const theme = DECK_THEMES.find((t) => t.id === themeId) ?? DECK_THEMES[0];

	// avoid repeating human texts used in recent decks
	const { data: recentDecks } = await supabase
		.from('decks')
		.select('items')
		.order('created_at', { ascending: false })
		.limit(10);
	const recentTexts = new Set(
		(recentDecks ?? []).flatMap((d) => (d.items as DeckItem[]).map((i) => i.text))
	);

	const humanPool = theme.humans.filter((h) => !recentTexts.has(h.text));
	const pool = humanPool.length >= 3 ? humanPool : theme.humans;
	const humans = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);

	// 3 impostors from 3 different models
	const models = [...BATTLE_MODELS].sort(() => Math.random() - 0.5).slice(0, 3);
	const aiTexts = await Promise.all(
		models.map(async (m) => ({
			model: m,
			model_id: OPENROUTER_MODELS[m],
			text: await generateImpostor(OPENROUTER_MODELS[m], theme.aiInstruction)
		}))
	);

	for (const t of aiTexts) {
		if (!t.text) error(500, `Empty output from ${t.model}`);
	}

	const items: DeckItem[] = [
		...humans.map((h) => ({ text: h.text, source: 'human' as const, label: h.label })),
		...aiTexts.map((t) => ({
			text: t.text,
			source: 'ai' as const,
			label: MODEL_VERSION_LABELS[t.model_id] ?? t.model,
			model_id: t.model_id
		}))
	].sort(() => Math.random() - 0.5);

	const { data: deck, error: dbError } = await supabase
		.from('decks')
		.insert({
			theme: theme.id,
			items,
			is_daily,
			deck_date: deck_date ?? (is_daily ? new Date().toISOString().slice(0, 10) : null)
		})
		.select()
		.single();

	if (dbError) error(500, `Database error: ${dbError.message}`);

	return json({ id: deck.id, theme: theme.id, items: items.length, deck_date: deck.deck_date });
};
