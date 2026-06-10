<script lang="ts">
	import type { PageData } from './$types';
	import BattleFlow from '$lib/components/BattleFlow.svelte';
	import { CATEGORY_LABELS } from '$lib/types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<link rel="canonical" href={data.meta.canonical} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="GuessTheModel" />
	<meta property="og:title" content={data.meta.title} />
	<meta property="og:description" content={data.meta.description} />
	<meta property="og:url" content={data.meta.canonical} />
	<meta property="og:image" content={data.meta.ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="GuessTheModel — Vote blind on AI outputs" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.meta.title} />
	<meta name="twitter:description" content={data.meta.description} />
	<meta name="twitter:image" content={data.meta.ogImage} />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 sm:px-6 py-10">
	<div class="mb-6">
		<a href="/" class="text-[#6E7681] hover:text-[#8B949E] text-sm transition-colors">← Back</a>
	</div>

	<div class="flex items-center gap-3 mb-6">
		<p class="label">Battle</p>
		<span class="text-xs px-2 py-0.5 rounded-full bg-[#C3F73A10] border border-[#C3F73A30] text-[#C3F73A]">
			{CATEGORY_LABELS[data.battle.category]}
		</span>
		<span class="text-[#6E7681] text-xs">
			{new Date(data.battle.created_at).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: 'numeric'
			})}
		</span>
	</div>

	<div class="card p-5 sm:p-6">
		<BattleFlow battle={data.battle} />
	</div>
</div>
