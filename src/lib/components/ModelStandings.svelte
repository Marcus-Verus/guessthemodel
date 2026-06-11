<script lang="ts">
	import type { ModelName } from '$lib/types';
	import { MODEL_LABELS } from '$lib/types';
	import ModelLogo from './ModelLogo.svelte';

	interface StandingRow {
		model: ModelName;
		wins: number;
		battles: number;
		winRate: number;
	}

	let { rows, totalBattles }: { rows: StandingRow[]; totalBattles: number } = $props();

	const maxRate = $derived(rows.length > 0 ? Math.max(...rows.map((r) => r.winRate), 0.01) : 1);
</script>

{#if rows.length > 0}
<div class="card p-5">
	<div class="flex items-center justify-between mb-5">
		<h2 class="text-white font-semibold text-sm tracking-wide uppercase">Human Benchmark</h2>
		<span class="text-[#6E7681] text-xs">{totalBattles} battle{totalBattles !== 1 ? 's' : ''}</span>
	</div>
	<div class="space-y-4">
		{#each rows as row, i}
			<div class="flex items-center gap-3">
				<ModelLogo model={row.model} size="sm" />
				<div class="flex-1 min-w-0">
					<div class="flex items-center justify-between mb-1.5">
						<span class="text-white text-xs font-medium">{MODEL_LABELS[row.model]}</span>
						<span class="text-xs tabular-nums {i === 0 ? 'text-[#C3F73A]' : 'text-[#6E7681]'}">
							{Math.round(row.winRate * 100)}%
						</span>
					</div>
					<div class="h-1 rounded-full bg-[#21262D] overflow-hidden">
						<div
							class="h-full rounded-full {i === 0 ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"
							style="width: {(row.winRate / maxRate) * 100}%"
						></div>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<p class="text-[#6E7681] text-xs mt-4">Win rate by crowd vote · blind battles only</p>
</div>
{/if}
