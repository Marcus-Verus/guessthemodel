<script lang="ts">
	import type { PageData } from './$types';
	import Survival from '$lib/components/Survival.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<link rel="canonical" href={data.meta.canonical} />
	<meta property="og:title" content={data.meta.title} />
	<meta property="og:description" content={data.meta.description} />
	<meta property="og:image" content={data.meta.ogImage} />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="mx-auto max-w-xl px-4 sm:px-6 py-10">
	<Survival />
</div>
