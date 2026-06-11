<script lang="ts">
	import type { PageData } from './$types';
	import BattleFlow from '$lib/components/BattleFlow.svelte';
	import CategoryNav from '$lib/components/CategoryNav.svelte';
	import StatsRow from '$lib/components/StatsRow.svelte';
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

	<!-- Hero -->
	<div class="mb-10">
		<h1 class="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
			Can you tell which <em class="text-[#C3F73A] not-italic">AI wrote this?</em>
		</h1>
		<p class="text-[#8B949E] text-base">
			Vote blind. Guess the model. See if the crowd agrees.
		</p>
	</div>

	<!-- Stats -->
	<div class="mb-10">
		<StatsRow stats={data.stats} />
	</div>

	<!-- Today's battle -->
	{#if data.daily}
		<div class="mb-12">
			<div class="flex items-center gap-3 mb-4">
				<p class="label">Today's battle</p>
				<span class="text-xs px-2 py-0.5 rounded-full bg-[#C3F73A10] border border-[#C3F73A30] text-[#C3F73A]">
					{CATEGORY_LABELS[data.daily.category]}
				</span>
			</div>
			<div class="card p-5 sm:p-6">
				<BattleFlow battle={data.daily} />
			</div>
			<p class="mt-2">
				<a href="/battle/{data.daily.id}" class="text-[#6E7681] hover:text-[#8B949E] text-xs transition-colors">
					Permanent link →
				</a>
			</p>
		</div>
	{:else}
		<div class="mb-12 card p-10 text-center">
			<p class="text-[#8B949E]">No battle scheduled for today. Check back tomorrow.</p>
		</div>
	{/if}

	<!-- Category nav + more battles -->
	<div class="mb-6">
		<CategoryNav active="all" />
	</div>

	{#if data.recent.filter(b => b.id !== data.daily?.id).length > 0}
		<div class="grid gap-3">
			{#each data.recent.filter(b => b.id !== data.daily?.id) as battle}
				<a
					href="/battle/{battle.id}"
					class="card p-4 hover:border-[#8B949E] transition-colors group"
				>
					<div class="flex items-start justify-between gap-4">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="label text-[10px]">{CATEGORY_LABELS[battle.category]}</span>
							</div>
							<p class="text-white text-sm font-medium truncate group-hover:text-[#C3F73A] transition-colors">
								"{battle.prompt}"
							</p>
							<p class="text-[#6E7681] text-xs mt-1">
								{new Date(battle.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
							</p>
						</div>
						<span class="text-[#6E7681] group-hover:text-[#C3F73A] transition-colors shrink-0 mt-0.5">→</span>
					</div>
				</a>
			{/each}
		</div>
	{/if}

</div>
