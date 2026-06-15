import { env } from '$env/dynamic/private';
import type { Product } from '$lib/duped';

// claude-sonnet-4-6: fast and cost-effective, well suited to a high-frequency
// game endpoint that just needs three plausible-sounding gag products per call.
const MODEL = 'claude-sonnet-4-6';

export function claudePrompt(catLabel: string): string {
	return `Invent 3 fictional absurd novelty products in the category "${catLabel}" that sound exactly like real gag gifts sold on Amazon. They must be funny, plausible-sounding, and family-friendly.

Respond ONLY with a JSON array, no markdown fences, no other text. Each item:
{"name": "...", "tagline": "one sentence pitch", "price": "$XX.XX", "rating": 3.8, "emoji": "a single emoji that represents the product", "review": "one short funny customer review", "fact": "one short line starting with 'AI-invented.' that playfully confirms it is fake"}

Keep names under 5 words. Ratings between 3.7 and 4.8.`;
}

/**
 * Ask Claude for three fresh AI-invented fakes in the given category.
 * Returns null on any failure so the caller can fall back to the house deck.
 */
export async function generateFakes(catLabel: string): Promise<Product[] | null> {
	const apiKey = env.ANTHROPIC_API_KEY;
	if (!apiKey) return null;

	try {
		const res = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'x-api-key': apiKey,
				'anthropic-version': '2023-06-01',
				'content-type': 'application/json'
			},
			body: JSON.stringify({
				model: MODEL,
				max_tokens: 1000,
				messages: [{ role: 'user', content: claudePrompt(catLabel) }]
			})
		});

		if (!res.ok) return null;

		const data = await res.json();
		const text = (data.content || [])
			.filter((b: { type: string }) => b.type === 'text')
			.map((b: { text: string }) => b.text)
			.join('\n');

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
