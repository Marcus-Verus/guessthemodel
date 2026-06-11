import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { json } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
	const { email } = await request.json();

	if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 254) {
		return json({ error: 'Invalid email' }, { status: 400 });
	}

	const { error } = await supabase
		.from('email_signups')
		.insert({ email: email.trim().toLowerCase() });

	if (error && error.code !== '23505') {
		return json({ error: 'Failed to subscribe' }, { status: 500 });
	}

	return json({ ok: true });
};
