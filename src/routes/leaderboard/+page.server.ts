import type { PageServerLoad } from './$types';
import { getModelLeaderboard, getPlayerLeaderboard } from '$lib/server/stats';

export const load: PageServerLoad = async ({ url }) => {
	const period = (url.searchParams.get('period') ?? 'weekly') as 'daily' | 'weekly' | 'monthly';

	const [models, players] = await Promise.all([
		getModelLeaderboard(period),
		getPlayerLeaderboard(period)
	]);

	return { models, players, period };
};
