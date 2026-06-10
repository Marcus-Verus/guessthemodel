import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabase';
import type { Battle, SafeBattle, Category } from '$lib/types';
import { CATEGORIES, CATEGORY_LABELS } from '$lib/types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

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
			title: `Best ${CATEGORY_LABELS[category]} AI? Blind Human Votes | ${SITE_NAME}`,
			description: `Which AI wins blind ${CATEGORY_LABELS[category]} battles? Real human votes with no model names shown. ChatGPT vs Claude vs Gemini vs Grok vs Perplexity — who wins?`,
			canonical: `${SITE_URL}/${category}`,
			ogImage: OG_IMAGE
		}
	};
};
