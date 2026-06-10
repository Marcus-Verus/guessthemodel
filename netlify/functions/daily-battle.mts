import type { Config } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';
import { PROMPTS } from '../../src/lib/prompts.js';

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.PRIVATE_SUPABASE_SERVICE_ROLE_KEY!;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

const MODEL_IDS = {
	claude: 'anthropic/claude-sonnet-4-5',
	chatgpt: 'openai/gpt-4o',
	gemini: 'google/gemini-pro-1.5'
} as const;

const SYSTEM_PROMPT =
	"You are a helpful assistant. Answer the user's prompt directly and concisely. Do not introduce yourself or mention your name.";

type Category = keyof typeof PROMPTS;
const CATEGORIES = Object.keys(PROMPTS) as Category[];

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
			temperature: 0.7,
			max_tokens: 300
		})
	});

	if (!res.ok) throw new Error(`OpenRouter ${modelId}: ${await res.text()}`);
	const data = await res.json();
	return data.choices[0]?.message?.content ?? '';
}

export default async () => {
	if (!SUPABASE_URL || !SUPABASE_KEY || !OPENROUTER_API_KEY) {
		console.error('Missing required environment variables');
		return new Response('Missing env vars', { status: 500 });
	}

	const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
	const today = new Date().toISOString().slice(0, 10);

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

	// Generate all 3 outputs in parallel
	const [claudeText, chatgptText, geminiText] = await Promise.all([
		callModel(MODEL_IDS.claude, prompt),
		callModel(MODEL_IDS.chatgpt, prompt),
		callModel(MODEL_IDS.gemini, prompt)
	]);

	const { data: battle, error } = await supabase
		.from('battles')
		.insert({
			prompt,
			category,
			outputs: {
				modelA: { text: claudeText, model_id: MODEL_IDS.claude },
				modelB: { text: chatgptText, model_id: MODEL_IDS.chatgpt },
				modelC: { text: geminiText, model_id: MODEL_IDS.gemini }
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
