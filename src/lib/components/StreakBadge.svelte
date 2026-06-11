<script lang="ts">
	import { loadHistory, computeStreaks } from '$lib/game';

	let streak = $state(0);
	let totalGames = $state(0);
	let avgPct = $state(0);

	$effect(() => {
		const history = loadHistory();
		totalGames = history.length;
		streak = computeStreaks(history).current;
		if (history.length > 0) {
			avgPct = Math.round(
				(history.reduce((sum, h) => sum + h.score / Math.max(h.out_of, 1), 0) / history.length) * 100
			);
		}
	});
</script>

{#if streak >= 2 || totalGames >= 3}
	<div class="flex flex-wrap items-center gap-2">
		{#if streak >= 2}
			<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C3F73A10] border border-[#C3F73A30] text-[#C3F73A] text-xs font-medium">
				{streak}-day streak{streak >= 7 ? ' · on fire' : ''}{streak >= 30 ? ' · legendary' : ''}
			</span>
		{/if}
		{#if totalGames >= 3}
			<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#21262D] border border-[#30363D] text-[#8B949E] text-xs">
				{totalGames} battles · {avgPct}% accuracy
			</span>
		{/if}
	</div>
{/if}
