import type { PageServerLoad } from './$types';
import { supabase } from '$lib/server/supabase';
import { getGlobalStats, getModelStandings } from '$lib/server/stats';
import { toSafe } from '$lib/server/battle';
import { DECK_THEMES } from '$lib/humans';
import type { Battle, Deck, SafeDeck } from '$lib/types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

export const load: PageServerLoad = async () => {
	const today = new Date().toISOString().slice(0, 10);

	const [
		{ data: dailyBattle },
		{ data: dailyDeck },
		{ count: deckCount },
		stats,
		standings,
		{ data: recentBattles },
		{ count: battleCount }
	] = await Promise.all([
		supabase
			.from('battles')
			.select('*')
			.eq('is_daily', true)
			.eq('battle_date', today)
			.limit(1)
			.maybeSingle(),
		supabase
			.from('decks')
			.select('*')
			.eq('is_daily', true)
			.eq('deck_date', today)
			.limit(1)
			.maybeSingle(),
		supabase
			.from('decks')
			.select('*', { count: 'exact', head: true })
			.eq('is_daily', true)
			.lte('deck_date', today),
		getGlobalStats(),
		getModelStandings(),
		supabase
			.from('battles')
			.select('*')
			.order('created_at', { ascending: false })
			.limit(12),
		supabase
			.from('battles')
			.select('*', { count: 'exact', head: true })
			.eq('is_daily', true)
			.lte('battle_date', today)
	]);

	let deck: SafeDeck | null = null;
	let deckTheme: { label: string; tagline: string } | null = null;
	if (dailyDeck) {
		const d = dailyDeck as unknown as Deck;
		deck = {
			id: d.id,
			theme: d.theme,
			items: d.items.map((i) => ({ text: i.text })),
			deck_date: d.deck_date
		};
		const t = DECK_THEMES.find((t) => t.id === d.theme);
		deckTheme = t ? { label: t.label, tagline: t.tagline } : { label: d.theme, tagline: '' };
	}

	return {
		daily: dailyBattle ? toSafe(dailyBattle as unknown as Battle) : null,
		battleNumber: battleCount ?? 0,
		deck,
		deckTheme,
		deckNumber: deckCount ?? 0,
		stats,
		standings,
		recent: (recentBattles ?? []).map((b) => toSafe(b as unknown as Battle)),
		meta: {
			title: `${SITE_NAME} — Can You Tell What's Human?`,
			description:
				'Six short texts. Some written by real humans, some by AI. One tap each — can you tell? Same puzzle for everyone, new game daily.',
			canonical: SITE_URL,
			ogImage: OG_IMAGE
		}
	};
};
