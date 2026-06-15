import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateFakes } from '$lib/server/fakes';

/**
 * Generate a fresh batch of AI fakes for a category, server-side, so the
 * Anthropic API key never reaches the browser. Always responds 200 with
 * { fakes }: null signals the client to use the house collection of fakes.
 */
export const POST: RequestHandler = async ({ request }) => {
	let category: unknown;
	try {
		({ category } = await request.json());
	} catch {
		return json({ fakes: null });
	}

	if (typeof category !== 'string' || !category.trim()) {
		return json({ fakes: null });
	}

	const fakes = await generateFakes(category);
	return json({ fakes });
};
