import type { RequestHandler } from './$types';
import { supabase } from '$lib/server/supabase';
import { CATEGORIES } from '$lib/types';

export const GET: RequestHandler = async () => {
	const { data: battles } = await supabase
		.from('battles')
		.select('id, created_at, category')
		.order('created_at', { ascending: false });

	const base = 'https://guessthemodel.com';
	const today = new Date().toISOString().slice(0, 10);

	const staticUrls = [
		`<url><loc>${base}/</loc><lastmod>${today}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
		...CATEGORIES.map(
			(c) => `<url><loc>${base}/${c}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>`
		)
	];

	const battleUrls = (battles ?? []).map((b) => {
		const lastmod = b.created_at.slice(0, 10);
		return `<url><loc>${base}/battle/${b.id}</loc><lastmod>${lastmod}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>`;
	});

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...staticUrls, ...battleUrls].join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
