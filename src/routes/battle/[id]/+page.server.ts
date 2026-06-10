import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { Battle, SafeBattle } from '$lib/types';
import { CATEGORY_LABELS } from '$lib/types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

export const load: PageServerLoad = async ({ params }) => {
	const { data: battle } = await supabase
		.from('battles')
		.select('*')
		.eq('id', params.id)
		.single();

	if (!battle) {
		error(404, 'Battle not found');
	}

	const b = battle as unknown as Battle;

	const safe: SafeBattle = {
		...b,
		outputs: {
			modelA: { text: b.outputs.modelA.text },
			modelB: { text: b.outputs.modelB.text },
			modelC: { text: b.outputs.modelC.text }
		}
	};

	const promptExcerpt = b.prompt.slice(0, 55);
	const promptDisplay = b.prompt.length > 55 ? `${promptExcerpt}…` : promptExcerpt;
	const categoryLabel = CATEGORY_LABELS[b.category] ?? b.category;

	return {
		battle: safe,
		meta: {
			title: `${categoryLabel} AI Battle: Vote Blind | ${SITE_NAME}`,
			description: `"${promptDisplay}" — Which AI wrote the better ${categoryLabel.toLowerCase()} output? Vote blind, guess the model, then see how the crowd voted. No cheating.`,
			canonical: `${SITE_URL}/battle/${b.id}`,
			ogImage: OG_IMAGE
		}
	};
};
