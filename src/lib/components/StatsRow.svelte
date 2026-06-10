<script lang="ts">
	import type { GlobalStats } from '$lib/types';

	let { stats }: { stats: GlobalStats } = $props();

	function fmt(n: number): string {
		if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
		if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
		return n.toLocaleString();
	}
</script>

<div class="flex flex-wrap items-center gap-6 sm:gap-10">
	<div>
		<p class="text-2xl font-bold text-white tabular-nums">{fmt(stats.votes_cast)}</p>
		<p class="label mt-0.5">Votes cast</p>
	</div>
	<div class="w-px h-8 bg-[#30363D] hidden sm:block"></div>
	<div>
		<p class="text-2xl font-bold text-white tabular-nums">{fmt(stats.battles_run)}</p>
		<p class="label mt-0.5">Battles run</p>
	</div>
	<div class="w-px h-8 bg-[#30363D] hidden sm:block"></div>
	<div>
		<p class="text-2xl font-bold text-white tabular-nums">{stats.models_tested}</p>
		<p class="label mt-0.5">Models tested</p>
	</div>
</div>
