export const SITE_URL = 'https://duped.gg';
export const SITE_NAME = 'DUPED';
export const OG_IMAGE = `${SITE_URL}/og.png`;

export interface SeoMeta {
	title: string;
	description: string;
	canonical: string;
	ogImage?: string;
}
