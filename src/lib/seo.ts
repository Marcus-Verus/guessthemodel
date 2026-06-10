export const SITE_URL = 'https://guessthemodel.com';
export const SITE_NAME = 'GuessTheModel';
export const OG_IMAGE = `${SITE_URL}/og.png`;

export interface SeoMeta {
	title: string;
	description: string;
	canonical: string;
	ogImage?: string;
}
