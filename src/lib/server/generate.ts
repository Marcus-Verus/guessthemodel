import { OPENROUTER_API_KEY } from '$env/static/private';

/** A usable impostor: a real sentence, roughly quote-length, no markdown junk */
export function isUsableText(t: string): boolean {
	const words = t.trim().split(/\s+/);
	return words.length >= 6 && words.length <= 60 && /^[A-Za-z“"']/.test(t.trim()) && !t.includes('\n\n');
}

/** Generate one AI impostor text. Generous token budget — reasoning models think first. */
export async function generateImpostor(modelId: string, instruction: string): Promise<string> {
	for (let attempt = 0; attempt < 2; attempt++) {
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
				max_tokens: 1000
			})
		});
		if (!res.ok) throw new Error(`OpenRouter ${modelId}: ${await res.text()}`);
		const data = await res.json();
		const text = (data.choices[0]?.message?.content ?? '').trim().replace(/^["'“]|["'”]$/g, '');
		if (isUsableText(text)) return text;
	}
	throw new Error(`Unusable output from ${modelId} after 2 attempts`);
}
