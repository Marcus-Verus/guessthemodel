import { OPENROUTER_API_KEY } from '$env/static/private';
import type { ModelName } from '$lib/types';

export const OPENROUTER_MODELS: Record<ModelName, string> = {
	claude:      'anthropic/claude-opus-4.8',
	chatgpt:     'openai/gpt-5.5',
	gemini:      'google/gemini-3.1-pro-preview',
	grok:        'x-ai/grok-4.3',
	perplexity:  'perplexity/sonar-pro'
};

const BATTLE_MODEL_ENTRIES: [ModelName, string][] = [
	['claude',     OPENROUTER_MODELS.claude],
	['chatgpt',    OPENROUTER_MODELS.chatgpt],
	['gemini',     OPENROUTER_MODELS.gemini],
	['grok',       OPENROUTER_MODELS.grok],
	['perplexity', OPENROUTER_MODELS.perplexity]
];

// Deliberately light-touch: the game is spotting each model's natural voice,
// so we cap length but don't flatten style.
const SYSTEM_PROMPT =
	'Answer the user\'s prompt directly in under 120 words. Never state your name, your maker, or your model version.';

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

	if (!res.ok) {
		const err = await res.text();
		throw new Error(`OpenRouter error for ${modelId}: ${err}`);
	}

	const data = await res.json();
	return data.choices[0]?.message?.content ?? '';
}

/** Call all five battle models in parallel */
export async function generateBattleOutputs(prompt: string): Promise<{
	claude:     { text: string; model_id: string };
	chatgpt:    { text: string; model_id: string };
	gemini:     { text: string; model_id: string };
	grok:       { text: string; model_id: string };
	perplexity: { text: string; model_id: string };
}> {
	const results = await Promise.allSettled(
		BATTLE_MODEL_ENTRIES.map(async ([name, modelId]) => ({
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

	for (const [name] of BATTLE_MODEL_ENTRIES) {
		if (!outputs[name]?.text) {
			throw new Error(`Model ${name} failed to generate output`);
		}
	}

	return {
		claude:     outputs.claude!,
		chatgpt:    outputs.chatgpt!,
		gemini:     outputs.gemini!,
		grok:       outputs.grok!,
		perplexity: outputs.perplexity!
	};
}
