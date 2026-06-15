import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { regenItemImage } from '$lib/server/daily';
import { dayForNumber } from '$lib/duped';

/** (Re)generate just the image for one card. Body: { n, index }. */
export const POST: RequestHandler = async ({ url, cookies, request }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('key') ?? cookies.get('ops_key');
	if (!secret || provided !== secret) error(404, 'Not found');

	const body = await request.json().catch(() => null);
	const n = Number(body?.n);
	const index = Number(body?.index);
	if (!Number.isFinite(n) || n < 1 || !Number.isInteger(index) || index < 0) {
		return json({ ok: false }, { status: 400 });
	}

	const result = await regenItemImage(dayForNumber(n), index);
	return json(result);
};
