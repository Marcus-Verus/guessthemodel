import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { Battle, SafeBattle, Category } from '$lib/types';
import { CATEGORIES, CATEGORY_LABELS } from '$lib/types';

export const load: PageServerLoad = async ({ params, url }) => {
	const category = params.category as Category;

	if (!CATEGORIES.includes(category)) {
		error(404, 'Category not found');
	}

	const page = parseInt(url.searchParams.get('page') ?? '1', 10);
	const pageSize = 20;
	const from = (page - 1) * pageSize;

	const { data: battles, count } = await supabase
		.from('battles')
		.select('*', { count: 'exact' })
		.eq('category', category)
		.order('created_at', { ascending: false })
		.range(from, from + pageSize - 1);

	const safeBattles: SafeBattle[] = (battles ?? []).map((b) => {
		const battle = b as unknown as Battle;
		return {
			...battle,
			outputs: {
				modelA: { text: battle.outputs.modelA.text },
				modelB: { text: battle.outputs.modelB.text }
			}
		};
	});

	return {
		category,
		battles: safeBattles,
		total: count ?? 0,
		page,
		pageSize,
		meta: {
			title: `Best AI for ${CATEGORY_LABELS[category]} — ${count ?? 0} human votes | GuessTheModel`,
			description: `Which AI model writes the best ${CATEGORY_LABELS[category]} content? ${count ?? 0} blind human votes across ${safeBattles.length} battles. See the results at guessthemodel.com`
		}
	};
};
