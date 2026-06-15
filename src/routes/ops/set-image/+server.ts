import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { setItemImage } from '$lib/server/daily';
import { dayForNumber } from '$lib/duped';

/** Set a card's image to a pasted URL. Body: { n, index, url }. */
export const POST: RequestHandler = async ({ url, cookies, request }) => {
	const secret = env.ADMIN_SECRET;
	const provided = url.searchParams.get('key') ?? cookies.get('ops_key');
	if (!secret || provided !== secret) error(404, 'Not found');

	const body = await request.json().catch(() => null);
	const n = Number(body?.n);
	const index = Number(body?.index);
	const img = typeof body?.url === 'string' ? body.url.trim() : '';
	if (!Number.isFinite(n) || n < 1 || !Number.isInteger(index) || index < 0 || !/^https?:\/\//.test(img)) {
		return json({ ok: false }, { status: 400 });
	}

	const result = await setItemImage(dayForNumber(n), index, img);
	return json(result);
};
