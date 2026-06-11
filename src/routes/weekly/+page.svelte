<script lang="ts">
	import type { PageData } from './$types';
	import { MODEL_LABELS, CATEGORY_LABELS, type Category } from '$lib/types';
	import ModelLogo from '$lib/components/ModelLogo.svelte';

	let { data }: { data: PageData } = $props();

	function formatDate(d: string): string {
		return new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}
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
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C3F73A30] bg-[#C3F73A08] mb-4">
			<span class="h-1.5 w-1.5 rounded-full bg-[#C3F73A]"></span>
			<span class="text-[#C3F73A] text-xs font-medium tracking-wide uppercase">Weekly data drop</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">This Week in AI</h1>
		<p class="text-[#8B949E]">
			{formatDate(data.weekStart)} – {formatDate(data.weekEnd)} · {data.weeklyBattles.length} battles · {data.totalWeekVotes.toLocaleString()} votes
		</p>
	</div>

	{#if data.weeklyBattles.length === 0}
		<div class="card p-10 text-center text-[#8B949E]">
			No battles this week yet. Check back soon.
		</div>
	{:else}

		<!-- Weekly headline stats -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
			{#if data.topModel}
				<div class="card p-4">
					<p class="label mb-2">This week's top model</p>
					<div class="flex items-center gap-2">
						<ModelLogo model={data.topModel.name} size="md" />
						<div>
							<p class="text-white font-bold text-base">{data.topModel.label}</p>
							<p class="text-[#6E7681] text-xs">{data.topModel.wins} win{data.topModel.wins !== 1 ? 's' : ''}</p>
						</div>
					</div>
				</div>
			{/if}

			{#if data.mostContested}
				<div class="card p-4">
					<p class="label mb-2">Most contested</p>
					<p class="text-white text-sm font-medium line-clamp-2">"{data.mostContested.prompt}"</p>
					<p class="text-[#6E7681] text-xs mt-1">
						{data.mostContested.margin}% margin
						{data.mostContested.winner ? `· ${MODEL_LABELS[data.mostContested.winner]} edged it` : ''}
					</p>
				</div>
			{/if}

			{#if data.mostDominant}
				<div class="card p-4">
					<p class="label mb-2">Most dominant win</p>
					<div class="flex items-center gap-2 mb-1">
						{#if data.mostDominant.winner}
							<ModelLogo model={data.mostDominant.winner} />
							<span class="text-white text-sm font-medium">{MODEL_LABELS[data.mostDominant.winner]}</span>
						{/if}
					</div>
					<p class="text-[#6E7681] text-xs">{data.mostDominant.winnerPct}% of votes · {data.mostDominant.margin}% ahead</p>
				</div>
			{/if}
		</div>

		<!-- Battle results -->
		<h2 class="text-white font-semibold text-lg mb-4">Battle Results</h2>
		<div class="space-y-3">
			{#each data.weeklyBattles as battle}
				<a href="/battle/{battle.id}" class="card p-4 block hover:border-[#8B949E] transition-colors group">
					<div class="flex items-start justify-between gap-4 mb-3">
						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2 mb-1">
								<span class="label text-[10px]">{CATEGORY_LABELS[battle.category as Category]}</span>
								<span class="text-[#6E7681] text-xs">{formatDate(battle.battle_date)}</span>
							</div>
							<p class="text-white text-sm font-medium group-hover:text-[#C3F73A] transition-colors line-clamp-2">
								"{battle.prompt}"
							</p>
						</div>
						<span class="text-[#6E7681] group-hover:text-[#C3F73A] transition-colors shrink-0 mt-0.5">→</span>
					</div>

					{#if battle.totalVotes > 0}
						<!-- Vote breakdown bars -->
						<div class="space-y-1.5">
							{#each battle.models as m}
								<div class="flex items-center gap-2">
									<div class="flex items-center gap-1.5 w-24 shrink-0">
										<ModelLogo model={m.name} />
										<span class="text-[#8B949E] text-xs truncate">{MODEL_LABELS[m.name]}</span>
									</div>
									<div class="flex-1 h-1.5 bg-[#21262D] rounded-full overflow-hidden">
										<div
											class="h-full rounded-full transition-all duration-500 {battle.winner === m.name ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"
											style="width:{m.pct}%"
										></div>
									</div>
									<span class="text-xs text-[#6E7681] w-8 text-right tabular-nums">{m.pct}%</span>
								</div>
							{/each}
						</div>
						<p class="text-[#6E7681] text-xs mt-2">{battle.totalVotes} vote{battle.totalVotes !== 1 ? 's' : ''}</p>
					{:else}
						<p class="text-[#6E7681] text-xs">No votes yet</p>
					{/if}
				</a>
			{/each}
		</div>

		<div class="mt-8 pt-6 border-t border-[#21262D]">
			<p class="text-[#6E7681] text-xs leading-relaxed">
				Data updated live. Each battle uses the same prompt, temperature 0.7, max 300 tokens.
				Model positions are randomised per visitor. All votes are anonymous.
				<a href="/methodology" class="text-[#8B949E] hover:text-white transition-colors underline">Read methodology →</a>
			</p>
		</div>
	{/if}

</div>
