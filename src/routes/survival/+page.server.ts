import type { PageServerLoad } from './$types';
import { SITE_URL, SITE_NAME, OG_IMAGE } from '$lib/seo';

export const load: PageServerLoad = async () => {
	return {
		meta: {
			title: `Survival — One Wrong and You're Out | ${SITE_NAME}`,
			description:
				'Human or AI, card after card, sudden death. One wrong answer ends the run. How far can you get?',
			canonical: `${SITE_URL}/survival`,
			ogImage: OG_IMAGE
		}
	};
};
