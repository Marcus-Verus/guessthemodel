import { env } from '$env/dynamic/private';
import { db } from '$lib/server/supabase';

const BUCKET = 'puzzle-images';

/**
 * Image generation is OFF unless an image model is configured (and Supabase is
 * available to host the result). This keeps the game on emoji until you opt in.
 */
export function imagesEnabled(): boolean {
	return !!(env.OPENROUTER_API_KEY && env.OPENROUTER_IMAGE_MODEL && db());
}

/**
 * Generate a clean white-background product photo via OpenRouter's image model
 * (same key as the text fakes), upload it to Supabase Storage, and return the
 * public URL. Returns null on any failure so the caller falls back to emoji.
 */
export async function generateProductImage(name: string, tagline: string): Promise<string | null> {
	const key = env.OPENROUTER_API_KEY;
	const model = env.OPENROUTER_IMAGE_MODEL;
	const c = db();
	if (!key || !model || !c) return null;

	const prompt =
		`Studio product photo of "${name}": ${tagline}. ` +
		`A single product centered on a plain white background, soft even lighting, ` +
		`sharp focus, no text, no watermark, no people - styled like an Amazon listing main image.`;

	try {
		const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${key}`,
				'Content-Type': 'application/json',
				'HTTP-Referer': 'https://duped.gg',
				'X-Title': 'DUPED'
			},
			body: JSON.stringify({
				model,
				messages: [{ role: 'user', content: prompt }],
				modalities: ['image', 'text']
			})
		});
		if (!res.ok) return null;

		const data = await res.json();
		const msg = data.choices?.[0]?.message;
		// OpenRouter returns generated images on message.images[].image_url.url
		// (a data: URL). Fall back to scanning content parts just in case.
		let dataUrl: string | undefined = msg?.images?.[0]?.image_url?.url;
		if (!dataUrl && Array.isArray(msg?.content)) {
			const part = msg.content.find(
				(p: { type?: string; image_url?: { url?: string } }) => p?.image_url?.url
			);
			dataUrl = part?.image_url?.url;
		}
		if (!dataUrl || !dataUrl.startsWith('data:')) return null;

		const comma = dataUrl.indexOf(',');
		const meta = dataUrl.slice(5, comma); // e.g. "image/png;base64"
		const contentType = meta.split(';')[0] || 'image/png';
		const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
		const bytes = Buffer.from(dataUrl.slice(comma + 1), 'base64');

		const path = `fakes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const up = await c.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true });
		if (up.error) return null;

		return c.storage.from(BUCKET).getPublicUrl(path).data.publicUrl ?? null;
	} catch {
		return null;
	}
}
