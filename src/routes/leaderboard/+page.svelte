<script lang="ts">
	import type { PageData } from './$types';
	import { MODEL_COLORS } from '$lib/types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>{data.meta.title}</title>
	<meta name="description" content={data.meta.description} />
	<link rel="canonical" href={data.meta.canonical} />
	<meta property="og:title" content={data.meta.title} />
	<meta property="og:description" content={data.meta.description} />
	<meta property="og:image" content={data.meta.ogImage} />
</svelte:head>

<div class="mx-auto max-w-3xl px-4 sm:px-6 py-10">

	<div class="mb-8">
		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">AI Model Leaderboard</h1>
		<p class="text-[#8B949E]">
			Ranked by battle win rate — real crowd votes, no brand bias.
		</p>
		<div class="flex gap-6 mt-4 text-sm text-[#6E7681]">
			<span><span class="text-white font-medium">{data.totalBattles}</span> battles</span>
			<span><span class="text-white font-medium">{data.totalVotes.toLocaleString()}</span> votes cast</span>
		</div>
	</div>

	{#if data.rows.length === 0}
		<div class="card p-10 text-center text-[#8B949E]">
			No battle data yet. Check back after some battles have been voted on.
		</div>
	{:else}
		<!-- Table -->
		<div class="card overflow-hidden">
			<!-- Header -->
			<div class="grid grid-cols-[2rem_1fr_7rem_7rem] sm:grid-cols-[2rem_1fr_7rem_7rem_7rem] gap-3 px-5 py-3 border-b border-[#30363D] text-xs text-[#6E7681] font-medium uppercase tracking-wide">
				<span>#</span>
				<span>Model</span>
				<span class="text-right">Win rate</span>
				<span class="text-right">Wins</span>
				<span class="text-right hidden sm:block">Vote share</span>
			</div>

			{#each data.rows as row, i}
				<div class="grid grid-cols-[2rem_1fr_7rem_7rem] sm:grid-cols-[2rem_1fr_7rem_7rem_7rem] gap-3 px-5 py-4 border-b border-[#30363D] last:border-0 items-center">
					<!-- Rank -->
					<span class="text-[#6E7681] text-sm tabular-nums">{i + 1}</span>

					<!-- Model name -->
					<div class="flex items-center gap-3 min-w-0">
						<div
							class="h-2.5 w-2.5 rounded-full shrink-0"
							style="background:{MODEL_COLORS[row.model]}"
						></div>
						<span class="text-white font-medium text-sm truncate">{row.label}</span>
					</div>

					<!-- Win rate bar + % -->
					<div class="flex items-center gap-2 justify-end">
						<div class="w-10 sm:w-14 h-1.5 bg-[#21262D] rounded-full overflow-hidden">
							<div
								class="h-full rounded-full bg-[#C3F73A] transition-all duration-500"
								style="width:{Math.round(row.winRate * 100)}%"
							></div>
						</div>
						<span class="text-white text-sm tabular-nums w-8 text-right">{Math.round(row.winRate * 100)}%</span>
					</div>

					<!-- Wins / battles -->
					<span class="text-[#8B949E] text-sm tabular-nums text-right">
						{row.wins}<span class="text-[#6E7681]">/{row.battles}</span>
					</span>

					<!-- Vote share (hidden on mobile) -->
					<span class="text-[#8B949E] text-sm tabular-nums text-right hidden sm:block">
						{Math.round(row.voteShare * 100)}%
					</span>
				</div>
			{/each}
		</div>

		<p class="text-[#6E7681] text-xs mt-4 leading-relaxed">
			<strong class="text-[#8B949E]">Win rate</strong> = battles won ÷ battles appeared in.
			A battle is "won" by the model that received the most votes (ties don't count).
			<strong class="text-[#8B949E]">Vote share</strong> = votes received ÷ total votes cast in battles featuring that model.
			"All bad" votes are excluded from both metrics.
		</p>
	{/if}

</div>
