<script lang="ts">
	import type { PageData } from './$types';
	import BattleFlow from '$lib/components/BattleFlow.svelte';
	import CategoryNav from '$lib/components/CategoryNav.svelte';
	import StatsRow from '$lib/components/StatsRow.svelte';
	import StreakBadge from '$lib/components/StreakBadge.svelte';
	import ModelStandings from '$lib/components/ModelStandings.svelte';
	import Countdown from '$lib/components/Countdown.svelte';
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
	<meta property="og:image:alt" content="GuessTheModel — the daily AI guessing game" />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.meta.title} />
	<meta name="twitter:description" content={data.meta.description} />
	<meta name="twitter:image" content={data.meta.ogImage} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 sm:px-6 py-8">

	<!-- Slim hero — the game is the hero -->
	<div class="mb-6">
		<div class="flex items-center gap-3 flex-wrap mb-3">
			{#if data.battleNumber > 0}
				<span class="label">Daily battle #{data.battleNumber}</span>
			{:else}
				<span class="label">Daily battle</span>
			{/if}
			{#if data.daily}
				<span class="text-xs px-2 py-0.5 rounded-full bg-[#C3F73A10] border border-[#C3F73A30] text-[#C3F73A]">
					{CATEGORY_LABELS[data.daily.category]}
				</span>
			{/if}
			<span class="ml-auto"><Countdown /></span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-bold text-white leading-tight mb-2">
			Can you tell <em class="text-[#C3F73A] not-italic">which AI wrote it?</em>
		</h1>
		<StreakBadge />
	</div>

	<!-- Today's battle — front and center -->
	{#if data.daily}
		<div class="mb-12">
			<div class="card p-5 sm:p-6">
				<BattleFlow battle={data.daily} battleNumber={data.battleNumber} />
			</div>
		</div>
	{:else}
		<div class="mb-12 card p-10 text-center">
			<p class="text-[#8B949E]">No battle scheduled for today. Check back tomorrow.</p>
		</div>
	{/if}

	<!-- Stats + benchmark -->
	<div class="mb-12 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
		<StatsRow stats={data.stats} />
		<ModelStandings rows={data.standings} totalBattles={data.stats.battles_run} />
	</div>

	<!-- Category nav + past battles -->
	<div class="mb-6">
		<CategoryNav active="all" />
	</div>

	{#if data.recent.filter(b => b.id !== data.daily?.id).length > 0}
		<p class="label mb-3">Play the archive</p>
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

	<!-- Footer -->
	<div class="mt-12 pt-6 border-t border-[#21262D] flex flex-wrap items-center justify-between gap-4">
		<p class="text-[#6E7681] text-xs">The daily game that benchmarks AI with human eyes.</p>
		<div class="flex items-center gap-5 text-xs text-[#6E7681]">
			<a href="/weekly" class="hover:text-[#8B949E] transition-colors">Weekly</a>
			<a href="/leaderboard" class="hover:text-[#8B949E] transition-colors">Leaderboard</a>
			<a href="/methodology" class="hover:text-[#8B949E] transition-colors">Methodology</a>
			<a href="/press" class="hover:text-[#8B949E] transition-colors">Press</a>
			<a href="/faq" class="hover:text-[#8B949E] transition-colors">FAQ</a>
		</div>
	</div>

</div>
