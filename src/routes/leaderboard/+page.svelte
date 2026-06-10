<script lang="ts">
	import type { PageData } from './$types';
	import LeaderboardTable from '$lib/components/LeaderboardTable.svelte';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	const periods = [
		{ id: 'daily', label: 'Daily' },
		{ id: 'weekly', label: 'Weekly' },
		{ id: 'monthly', label: 'Monthly' }
	] as const;

	function setPeriod(p: string) {
		goto(`/leaderboard?period=${p}`, { replaceState: true });
	}
</script>

<svelte:head>
	<title>Leaderboard — Best AI Models by Human Votes | GuessTheModel</title>
	<meta name="description" content="See which AI models are winning the most blind votes from real humans. Updated daily." />
</svelte:head>

<div class="mx-auto max-w-4xl px-4 sm:px-6 py-10">

	<div class="mb-8">
		<p class="label mb-2">Rankings</p>
		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">Leaderboard</h1>
		<p class="text-[#8B949E] text-sm">Based on blind human votes across all battles.</p>
	</div>

	<!-- Period tabs -->
	<div class="flex gap-1 mb-8 bg-[#21262D] rounded-lg p-1 w-fit">
		{#each periods as p}
			<button
				onclick={() => setPeriod(p.id)}
				class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors
				{data.period === p.id ? 'bg-[#1C2128] text-white' : 'text-[#8B949E] hover:text-white'}"
			>
				{p.label}
			</button>
		{/each}
	</div>

	<LeaderboardTable models={data.models} players={data.players} />

</div>
