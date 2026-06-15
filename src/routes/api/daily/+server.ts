import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDailyPuzzle } from '$lib/server/daily';

/** Today's shared daily puzzle (same #N for everyone). */
export const GET: RequestHandler = async () => {
	const puzzle = await getDailyPuzzle();
	return json(puzzle);
};
