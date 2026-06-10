import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { Battle, SafeBattle } from '$lib/types';
import { CATEGORY_LABELS } from '$lib/types';

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
			modelB: { text: b.outputs.modelB.text }
		}
	};

	const promptExcerpt = b.prompt.slice(0, 80);
	const categoryLabel = CATEGORY_LABELS[b.category] ?? b.category;

	return {
		battle: safe,
		meta: {
			title: `${categoryLabel} AI Battle — ${promptExcerpt} | GuessTheModel`,
			description: `Which AI wrote the better ${categoryLabel} output? Vote blind and see the crowd results. guessthemodel.com`
		}
	};
};
