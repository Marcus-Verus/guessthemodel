import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/supabase';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => null);
	if (!body) return json({ ok: false }, { status: 400 });

	const { email, bot } = body as { email?: unknown; bot?: unknown };
	// Honeypot: if the hidden field is filled, silently accept and drop it.
	if (bot) return json({ ok: true });

	if (typeof email !== 'string' || email.length > 254 || !EMAIL.test(email)) {
		return json({ ok: false, error: 'invalid_email' }, { status: 400 });
	}

	const c = db();
	if (c) {
		await c
			.from('signups')
			.upsert({ email: email.toLowerCase() }, { onConflict: 'email', ignoreDuplicates: true });
		await c.from('events').insert({ type: 'subscribe' });
	}
	return json({ ok: true });
};
