import type { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { PROMPTS, DAILY_CATEGORIES } from '../../src/lib/prompts.js';
import { DECK_THEMES } from '../../src/lib/humans.js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

// Keep in sync with src/lib/server/openrouter.ts
const MODEL_IDS = {
	claude: 'anthropic/claude-opus-4.8',
	chatgpt: 'openai/gpt-5.5',
	gemini: 'google/gemini-3.1-pro-preview',
	grok: 'x-ai/grok-4.3',
	perplexity: 'perplexity/sonar-pro'
} as const;

const SYSTEM_PROMPT =
	"Answer the user's prompt directly in under 120 words. Never state your name, your maker, or your model version.";

type Category = keyof typeof PROMPTS;
// Daily battles only use mass-appeal categories — no nerd prompts headlining
const CATEGORIES = DAILY_CATEGORIES as Category[];

async function callModel(modelId: string, prompt: string): Promise<string> {
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
			messages: [
				{ role: 'system', content: SYSTEM_PROMPT },
				{ role: 'user', content: prompt }
			],
			temperature: 0.8,
			max_tokens: 400
		})
	});

	if (!res.ok) throw new Error(`OpenRouter ${modelId}: ${await res.text()}`);
	const data = await res.json();
	return data.choices[0]?.message?.content ?? '';
}

const MODEL_LABELS: Record<string, string> = {
	'anthropic/claude-opus-4.8': 'Claude Opus 4.8',
	'openai/gpt-5.5': 'GPT-5.5',
	'google/gemini-3.1-pro-preview': 'Gemini 3.1 Pro',
	'x-ai/grok-4.3': 'Grok 4.3',
	'perplexity/sonar-pro': 'Perplexity Sonar Pro'
};

/** The front-door game: 3 verified human texts + 3 AI impostors, shuffled. */
async function createDailyDeck(supabase: ReturnType<typeof createClient>, today: string) {
	const { data: existing } = await supabase
		.from('decks')
		.select('id')
		.eq('is_daily', true)
		.eq('deck_date', today)
		.maybeSingle();
	if (existing) {
		console.log(`Daily deck already exists for ${today}, skipping.`);
		return;
	}

	const { data: recentDecks } = await supabase
		.from('decks')
		.select('theme, items')
		.order('created_at', { ascending: false })
		.limit(10);

	const lastThemes = (recentDecks ?? []).slice(0, 2).map((d) => d.theme);
	const candidates = DECK_THEMES.filter((t) => !lastThemes.includes(t.id));
	const themePool = candidates.length > 0 ? candidates : DECK_THEMES;
	const theme = themePool[Math.floor(Math.random() * themePool.length)];

	const recentTexts = new Set(
		(recentDecks ?? []).flatMap((d) => (d.items as Array<{ text: string }>).map((i) => i.text))
	);
	const fresh = theme.humans.filter((h) => !recentTexts.has(h.text));
	const pool = fresh.length >= 3 ? fresh : theme.humans;
	const humans = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);

	const modelIds = Object.values(MODEL_IDS).sort(() => Math.random() - 0.5).slice(0, 3);
	const aiTexts = await Promise.all(
		modelIds.map(async (id) => {
			const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${OPENROUTER_API_KEY}`,
					'Content-Type': 'application/json',
					'HTTP-Referer': 'https://guessthemodel.com',
					'X-Title': 'GuessTheModel'
				},
				body: JSON.stringify({
					model: id,
					messages: [{ role: 'user', content: theme.aiInstruction }],
					temperature: 0.9,
					max_tokens: 120
				})
			});
			if (!res.ok) throw new Error(`OpenRouter ${id}: ${await res.text()}`);
			const data = await res.json();
			const text = (data.choices[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
			if (!text) throw new Error(`Empty deck output from ${id}`);
			return { model_id: id, text };
		})
	);

	const items = [
		...humans.map((h) => ({ text: h.text, source: 'human', label: h.label })),
		...aiTexts.map((t) => ({ text: t.text, source: 'ai', label: MODEL_LABELS[t.model_id] ?? t.model_id, model_id: t.model_id }))
	].sort(() => Math.random() - 0.5);

	const { error } = await supabase
		.from('decks')
		.insert({ theme: theme.id, items, is_daily: true, deck_date: today });
	if (error) throw new Error(`Deck insert failed: ${error.message}`);
	console.log(`Created daily deck for ${today}: theme ${theme.id}`);
}

export default async () => {
	if (!SUPABASE_URL || !SUPABASE_KEY || !OPENROUTER_API_KEY) {
		console.error('Missing required environment variables');
		return new Response('Missing env vars', { status: 500 });
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
	const today = new Date().toISOString().slice(0, 10);

	// the deck (front-door game) and the battle (expert mode) are independent;
	// one failing shouldn't block the other
	try {
		await createDailyDeck(supabase, today);
	} catch (e) {
		console.error('Deck creation failed:', e instanceof Error ? e.message : e);
	}

	// Idempotency: skip if today's daily already exists
	const { data: existing } = await supabase
		.from('battles')
		.select('id')
		.eq('is_daily', true)
		.eq('battle_date', today)
		.maybeSingle();

	if (existing) {
		console.log(`Daily battle already exists for ${today}, skipping.`);
		return new Response(JSON.stringify({ skipped: true, date: today }), { status: 200 });
	}

	// Pick category: prefer the one least used in the last 6 battles
	const { data: recent } = await supabase
		.from('battles')
		.select('prompt, category')
		.order('created_at', { ascending: false })
		.limit(30);

	const recentPrompts = new Set((recent ?? []).map((b: { prompt: string }) => b.prompt));
	const recentCats = (recent ?? []).slice(0, 6).map((b: { category: string }) => b.category);
	const catCounts = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
	recentCats.forEach((c: string) => {
		if (c in catCounts) catCounts[c]++;
	});
	const category = [...CATEGORIES].sort((a, b) => catCounts[a] - catCounts[b])[0];

	// Pick an unused prompt from that category
	const candidates = PROMPTS[category].filter((p) => !recentPrompts.has(p));
	const pool = candidates.length > 0 ? candidates : PROMPTS[category];
	const prompt = pool[Math.floor(Math.random() * pool.length)];

	// Generate all 5 outputs in parallel
	const [claudeText, chatgptText, geminiText, grokText, perplexityText] = await Promise.all([
		callModel(MODEL_IDS.claude, prompt),
		callModel(MODEL_IDS.chatgpt, prompt),
		callModel(MODEL_IDS.gemini, prompt),
		callModel(MODEL_IDS.grok, prompt),
		callModel(MODEL_IDS.perplexity, prompt)
	]);

	const texts = { claudeText, chatgptText, geminiText, grokText, perplexityText };
	for (const [name, text] of Object.entries(texts)) {
		if (!text.trim()) {
			console.error(`Empty output from ${name}, aborting`);
			return new Response(`Empty output from ${name}`, { status: 500 });
		}
	}

	const { data: battle, error } = await supabase
		.from('battles')
		.insert({
			prompt,
			category,
			outputs: {
				modelA: { text: claudeText, model_id: MODEL_IDS.claude },
				modelB: { text: chatgptText, model_id: MODEL_IDS.chatgpt },
				modelC: { text: geminiText, model_id: MODEL_IDS.gemini },
				modelD: { text: grokText, model_id: MODEL_IDS.grok },
				modelE: { text: perplexityText, model_id: MODEL_IDS.perplexity }
			},
			is_daily: true,
			battle_date: today
		})
		.select()
		.single();

	if (error) {
		console.error('DB insert failed:', error.message);
		return new Response(`DB error: ${error.message}`, { status: 500 });
	}

	console.log(`Created daily battle ${battle.id}: [${category}] "${prompt.slice(0, 60)}…"`);
	return new Response(JSON.stringify({ id: battle.id, category, date: today }), { status: 200 });
};

export const config: Config = {
	schedule: '0 8 * * *' // 8:00 AM UTC daily
};
