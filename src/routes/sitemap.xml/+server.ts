import type { RequestHandler } from './$types';
import { SITE_URL } from '$lib/seo';

export const prerender = true;

export const GET: RequestHandler = () => {
	const today = new Date().toISOString().slice(0, 10);
	const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
	<url>
		<loc>${SITE_URL}/</loc>
		<lastmod>${today}</lastmod>
		<changefreq>daily</changefreq>
		<priority>1.0</priority>
	</url>
	<url>
		<loc>${SITE_URL}/archive</loc>
		<lastmod>${today}</lastmod>
		<changefreq>daily</changefreq>
		<priority>0.6</priority>
	</url>
	<url>
		<loc>${SITE_URL}/faq</loc>
		<changefreq>monthly</changefreq>
		<priority>0.5</priority>
	</url>
</urlset>`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/xml' }
	});
};
