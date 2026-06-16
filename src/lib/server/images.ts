import { env } from '$env/dynamic/private';
import { db } from '$lib/server/supabase';

const BUCKET = 'puzzle-images';
// Grok image model by default; override with OPENROUTER_IMAGE_MODEL.
const DEFAULT_IMAGE_MODEL = 'x-ai/grok-imagine-image-quality';

/** On whenever OpenRouter + Supabase are available (Grok is the default model). */
export function imagesEnabled(): boolean {
	return !!(env.OPENROUTER_API_KEY && db());
}

export interface ImageResult {
	url?: string;
	error?: string;
}

/**
 * Generate a clean white-background product photo via OpenRouter's image model
 * (same key as the text fakes), upload to Supabase Storage, return the public
 * URL. Returns { error } on failure so the admin can see why.
 */
export async function generateProductImage(name: string, tagline: string): Promise<ImageResult> {
	const key = env.OPENROUTER_API_KEY;
	// Guard against the common mistake of pasting the API key into the model var.
	const configured = env.OPENROUTER_IMAGE_MODEL;
	const model = configured && !configured.startsWith('sk-') ? configured : DEFAULT_IMAGE_MODEL;
	const c = db();
	if (!key) return { error: 'OPENROUTER_API_KEY not set' };
	if (!c) return { error: 'Supabase not configured' };

	const prompt =
		`Professional e-commerce product photo of "${name}": ${tagline}. ` +
		`The single product is centered and fills most of the frame on a PURE FLAT WHITE #FFFFFF seamless background. ` +
		`Absolutely no gradient, no vignette, no grey edges, no colored backdrop, no floor or table surface, no props, no text, no watermark, no people. ` +
		`Even studio lighting, only a soft shadow directly beneath the product, sharp focus - exactly like an Amazon main listing image on plain white.`;

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
				modalities: ['image']
			})
		});
		if (!res.ok) {
			return { error: `OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}` };
		}

		const data = await res.json();
		const msg = data.choices?.[0]?.message;
		let dataUrl: string | undefined = msg?.images?.[0]?.image_url?.url;
		if (!dataUrl && Array.isArray(msg?.content)) {
			const part = msg.content.find(
				(p: { image_url?: { url?: string } }) => p?.image_url?.url
			);
			dataUrl = part?.image_url?.url;
		}
		if (!dataUrl) return { error: `No image in response: ${JSON.stringify(data).slice(0, 300)}` };

		// Could be a data: URL (base64) or a hosted https URL.
		let bytes: Buffer;
		let contentType = 'image/png';
		if (dataUrl.startsWith('data:')) {
			const comma = dataUrl.indexOf(',');
			contentType = dataUrl.slice(5, comma).split(';')[0] || 'image/png';
			bytes = Buffer.from(dataUrl.slice(comma + 1), 'base64');
		} else if (dataUrl.startsWith('http')) {
			const imgRes = await fetch(dataUrl);
			if (!imgRes.ok) return { error: `Fetch image failed: ${imgRes.status}` };
			contentType = imgRes.headers.get('content-type') || 'image/png';
			bytes = Buffer.from(await imgRes.arrayBuffer());
		} else {
			return { error: 'Unrecognized image URL format' };
		}

		const ext = (contentType.split('/')[1] || 'png').replace('jpeg', 'jpg');
		const path = `fakes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const up = await c.storage.from(BUCKET).upload(path, bytes, { contentType, upsert: true });
		if (up.error) return { error: `Storage upload failed: ${up.error.message}` };

		const publicUrl = c.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
		return publicUrl ? { url: publicUrl } : { error: 'No public URL (is the bucket public?)' };
	} catch (e) {
		return { error: e instanceof Error ? e.message : 'unknown error' };
	}
}
