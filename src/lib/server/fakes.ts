import { env } from '$env/dynamic/private';
import type { Product } from '$lib/duped';

// Direct Anthropic model id (used when calling api.anthropic.com).
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
// OpenRouter model slug — overridable via env so you can spend whichever
// credits you have. Defaults to Claude via OpenRouter for brand consistency.
const OPENROUTER_MODEL_DEFAULT = 'anthropic/claude-sonnet-4.5';

export function fakesPrompt(catLabel: string): string {
	return `Invent 3 fictional products in the category "${catLabel}" for a "real or fake?" guessing game. They are fake, but should be hard to dismiss at a glance.

THE KEY RULE: each product must do something IMPOSSIBLE or clearly absurd — something no real product could actually do. The impossible capability is what makes it fake. Examples of the right kind of twist: it predicts the future, reads emotions or moods, defies physics, talks or has opinions, ripens fruit in seconds, sees through walls, heals cracked glass, tastes food.

DO NOT invent ordinary, real products. If a real company plausibly already sells it (a silicone sink stopper, a garlic press, a phone stand, a cable organizer, a yoga mat), it is WRONG — that is a real product, not a fake. The everyday object is fine ONLY if you give it a capability that genuinely cannot exist.

Style: plain, realistic product names (no puns, no jokey names). Keep the customer review dry and matter-of-fact.

Respond ONLY with a JSON array, no markdown fences, no other text. Each item:
{"name": "...", "tagline": "one plain sentence describing the impossible thing it does", "price": "$XX.XX", "rating": 3.8, "emoji": "a single representative emoji", "review": "one short, believable customer review", "fact": "one short line starting with 'AI-invented.' that confirms it is fake"}

Names under 4 words. Ratings between 3.7 and 4.8.`;
}

/** Generate via OpenRouter (OpenAI-compatible). Returns raw text or null. */
async function viaOpenRouter(prompt: string): Promise<string | null> {
	const key = env.OPENROUTER_API_KEY;
	if (!key) return null;
	// Guard against the API key being pasted into the model var by mistake.
	const configured = env.OPENROUTER_MODEL;
	const model = configured && !configured.startsWith('sk-') ? configured : OPENROUTER_MODEL_DEFAULT;
	try {
		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://duped.gg',
				'X-Title': 'DUPED'
			},
			body: JSON.stringify({
				model,
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }]
			})
		});
		if (!res.ok) return null;
		const data = await res.json();
		return data.choices?.[0]?.message?.content ?? null;
	} catch {
		return null;
	}
}

/** Generate via Anthropic directly. Returns raw text or null. */
async function viaAnthropic(prompt: string): Promise<string | null> {
	const key = env.ANTHROPIC_API_KEY;
	if (!key) return null;
	try {
		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': key,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: ANTHROPIC_MODEL,
				max_tokens: 1000,
				messages: [{ role: 'user', content: prompt }]
			})
		});
		if (!res.ok) return null;
		const data = await res.json();
		const text = (data.content || [])
			.filter((b: { type: string }) => b.type === 'text')
			.map((b: { text: string }) => b.text)
			.join('\n');
		return text || null;
	} catch {
		return null;
	}
}

/** Parse a model response into validated fake products, or null. */
function parseFakes(text: string): Product[] | null {
	try {
		const clean = text.replace(/```json|```/g, '').trim();
		const parsed = JSON.parse(clean);
		if (!Array.isArray(parsed)) return null;

		const ok: Product[] = parsed
			.filter((p) => p && p.name && p.tagline && p.fact)
			.map((p) => ({
				cat: 'live',
				name: String(p.name),
				tagline: String(p.tagline),
				price: String(p.price || '$24.99'),
				rating: Math.min(4.8, Math.max(3.7, Number(p.rating) || 4.1)),
				emoji: String(p.emoji || '📦').slice(0, 4),
				review: String(p.review || 'It exists. Allegedly.'),
				fact: String(p.fact)
			}));

		return ok.length >= 3 ? ok : null;
	} catch {
		return null;
	}
}

/**
 * Ask an LLM for three fresh AI-invented fakes in the given category.
 * Prefers OpenRouter when OPENROUTER_API_KEY is set (uses your credits),
 * falls back to Anthropic direct. Returns null on any failure so the
 * caller can fall back to the built-in house deck.
 */
export async function generateFakes(catLabel: string): Promise<Product[] | null> {
	const prompt = fakesPrompt(catLabel);
	const text = (await viaOpenRouter(prompt)) ?? (await viaAnthropic(prompt));
	return text ? parseFakes(text) : null;
}
