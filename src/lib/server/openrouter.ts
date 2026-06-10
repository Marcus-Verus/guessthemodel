import { OPENROUTER_API_KEY } from '$env/static/private';
import type { ModelName } from '$lib/types';

export const OPENROUTER_MODELS: Record<ModelName, string> = {
	claude: 'anthropic/claude-sonnet-4-5',
	chatgpt: 'openai/gpt-4o',
	gemini: 'google/gemini-pro-1.5',
	grok: 'x-ai/grok-2-1212',
	perplexity: 'perplexity/llama-3.1-sonar-large-128k-online'
};

const SYSTEM_PROMPT =
	"You are a helpful assistant. Answer the user's prompt directly and concisely. Do not introduce yourself or mention your name.";

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

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`OpenRouter error for ${modelId}: ${err}`);
	}

	const data = await res.json();
	return data.choices[0]?.message?.content ?? '';
}

export async function generateAllOutputs(
	prompt: string
): Promise<Record<ModelName, { text: string; model_id: string }>> {
	const entries = Object.entries(OPENROUTER_MODELS) as [ModelName, string][];

	const results = await Promise.allSettled(
		entries.map(async ([name, modelId]) => ({
			name,
			modelId,
			text: await callModel(modelId, prompt)
		}))
	);

	const outputs: Partial<Record<ModelName, { text: string; model_id: string }>> = {};

	for (const result of results) {
		if (result.status === 'fulfilled') {
			outputs[result.value.name] = {
				text: result.value.text,
				model_id: result.value.modelId
			};
		}
	}

	return outputs as Record<ModelName, { text: string; model_id: string }>;
}

/** Pick 2 models randomly for the A/B battle */
export function pickTwoForBattle(
	allOutputs: Partial<Record<ModelName, { text: string; model_id: string }>>
): {
	modelA: { text: string; model_id: string; name: ModelName };
	modelB: { text: string; model_id: string; name: ModelName };
} {
	const available = Object.entries(allOutputs).filter(([, v]) => v && v.text) as [
		ModelName,
		{ text: string; model_id: string }
	][];

	if (available.length < 2) {
		throw new Error('Need at least 2 successful model outputs to create a battle');
	}

	// Fisher-Yates shuffle, pick first 2
	for (let i = available.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[available[i], available[j]] = [available[j], available[i]];
	}

	const [a, b] = available;
	return {
		modelA: { ...a[1], name: a[0] },
		modelB: { ...b[1], name: b[0] }
	};
}
