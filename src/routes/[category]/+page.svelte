<script lang="ts">
	import type { PageData } from './$types';
	import CategoryNav from '$lib/components/CategoryNav.svelte';
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

<div class="mx-auto max-w-6xl px-4 sm:px-6 py-10">

	<div class="mb-8">
		<p class="label mb-2">Category</p>
		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">
			Best AI for <em class="text-[#C3F73A] not-italic">{CATEGORY_LABELS[data.category]}</em>
		</h1>
		<p class="text-[#8B949E] text-sm">
			{data.total} battle{data.total !== 1 ? 's' : ''} · sorted by date
		</p>
	</div>

	<div class="mb-8">
		<CategoryNav active={data.category} />
	</div>

	{#if data.battles.length === 0}
		<div class="card p-12 text-center">
			<p class="text-[#8B949E]">No battles in this category yet. Check back tomorrow.</p>
		</div>
	{:else}
		<div class="grid gap-4 mb-8">
			{#each data.battles as battle}
				<a
					href="/battle/{battle.id}"
					class="card p-4 hover:border-[#8B949E] transition-colors group"
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<p class="text-white text-sm font-medium mb-1 group-hover:text-[#C3F73A] transition-colors">
								"{battle.prompt}"
							</p>
							<p class="text-[#6E7681] text-xs">
								{new Date(battle.created_at).toLocaleDateString('en-US', {
									year: 'numeric',
									month: 'short',
									day: 'numeric'
								})}
							</p>
						</div>
						<span class="text-[#6E7681] group-hover:text-[#C3F73A] transition-colors shrink-0">→</span>
					</div>
				</a>
			{/each}
		</div>

		<!-- Pagination -->
		{#if data.total > data.pageSize}
			<div class="flex items-center justify-center gap-2">
				{#if data.page > 1}
					<a
						href="/{data.category}?page={data.page - 1}"
						class="rounded-md border border-[#30363D] px-4 py-2 text-sm text-[#8B949E] hover:text-white hover:border-[#8B949E] transition-colors"
					>
						← Previous
					</a>
				{/if}
				<span class="text-[#6E7681] text-sm">
					Page {data.page} of {Math.ceil(data.total / data.pageSize)}
				</span>
				{#if data.page * data.pageSize < data.total}
					<a
						href="/{data.category}?page={data.page + 1}"
						class="rounded-md border border-[#30363D] px-4 py-2 text-sm text-[#8B949E] hover:text-white hover:border-[#8B949E] transition-colors"
					>
						Next →
					</a>
				{/if}
			</div>
		{/if}
	{/if}

</div>
