<script lang="ts">
	import type { ModelLeaderboardEntry, PlayerLeaderboardEntry } from '$lib/types';
	import { MODEL_LABELS } from '$lib/types';

	let {
		models,
		players
	}: {
		models: ModelLeaderboardEntry[];
		players: PlayerLeaderboardEntry[];
	} = $props();

	let tab = $state<'models' | 'players'>('models');
</script>

<div>
	<div class="flex gap-1 mb-6 bg-[#21262D] rounded-lg p-1 w-fit">
		<button
			onclick={() => (tab = 'models')}
			class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors
			{tab === 'models' ? 'bg-[#1C2128] text-white' : 'text-[#8B949E] hover:text-white'}"
		>
			Models
		</button>
		<button
			onclick={() => (tab = 'players')}
			class="rounded-md px-4 py-1.5 text-sm font-medium transition-colors
			{tab === 'players' ? 'bg-[#1C2128] text-white' : 'text-[#8B949E] hover:text-white'}"
		>
			Players
		</button>
	</div>

	{#if tab === 'models'}
		<div class="card overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-[#30363D] bg-[#21262D]">
						<th class="px-4 py-3 text-left text-[#6E7681] font-medium w-10">#</th>
						<th class="px-4 py-3 text-left text-[#6E7681] font-medium">Model</th>
						<th class="px-4 py-3 text-right text-[#6E7681] font-medium">Wins</th>
						<th class="px-4 py-3 text-right text-[#6E7681] font-medium hidden sm:table-cell">Win rate</th>
						<th class="px-4 py-3 text-right text-[#6E7681] font-medium hidden sm:table-cell">Change</th>
					</tr>
				</thead>
				<tbody>
					{#each models as entry, i}
						<tr class="border-b border-[#30363D] last:border-0 hover:bg-[#21262D] transition-colors">
							<td class="px-4 py-3 text-[#6E7681] tabular-nums">{i + 1}</td>
							<td class="px-4 py-3">
								<span class="font-medium text-white">{MODEL_LABELS[entry.model]}</span>
							</td>
							<td class="px-4 py-3 text-right text-white font-medium tabular-nums">{entry.wins}</td>
							<td class="px-4 py-3 text-right hidden sm:table-cell">
								{#if entry.total > 0}
									<div class="flex items-center justify-end gap-2">
										<div class="w-16 h-1.5 bg-[#21262D] rounded-full overflow-hidden">
											<div class="h-full bg-[#C3F73A] rounded-full" style="width:{entry.win_rate}%"></div>
										</div>
										<span class="text-[#8B949E] tabular-nums w-10 text-right">{entry.win_rate}%</span>
									</div>
								{:else}
									<span class="text-[#6E7681]">—</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right hidden sm:table-cell">
								{#if entry.change > 0}
									<span class="text-[#3FB950]">↑{entry.change}</span>
								{:else if entry.change < 0}
									<span class="text-[#F85149]">↓{Math.abs(entry.change)}</span>
								{:else}
									<span class="text-[#6E7681]">—</span>
								{/if}
							</td>
						</tr>
					{/each}

					{#if models.length === 0}
						<tr>
							<td colspan="5" class="px-4 py-10 text-center text-[#6E7681] text-sm">
								No battles in this period yet.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{:else}
		<div class="card overflow-hidden">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-[#30363D] bg-[#21262D]">
						<th class="px-4 py-3 text-left text-[#6E7681] font-medium w-10">#</th>
						<th class="px-4 py-3 text-left text-[#6E7681] font-medium">Player</th>
						<th class="px-4 py-3 text-right text-[#6E7681] font-medium">Streak</th>
						<th class="px-4 py-3 text-right text-[#6E7681] font-medium hidden sm:table-cell">Model guesses</th>
						<th class="px-4 py-3 text-right text-[#6E7681] font-medium hidden sm:table-cell">Votes</th>
					</tr>
				</thead>
				<tbody>
					{#each players as entry, i}
						<tr class="border-b border-[#30363D] last:border-0 hover:bg-[#21262D] transition-colors">
							<td class="px-4 py-3 text-[#6E7681] tabular-nums">{i + 1}</td>
							<td class="px-4 py-3">
								<div>
									<span class="font-medium text-white font-mono">{entry.display_id}</span>
									{#if entry.titles.length > 0}
										<div class="flex flex-wrap gap-1 mt-1">
											{#each entry.titles as title}
												<span class="text-xs px-1.5 py-0.5 rounded bg-[#21262D] text-[#C3F73A] border border-[#30363D]">
													{title}
												</span>
											{/each}
										</div>
									{/if}
								</div>
							</td>
							<td class="px-4 py-3 text-right">
								<span class="text-white font-medium tabular-nums">{entry.streak}</span>
								{#if entry.streak >= 3}
									<span class="ml-1 text-xs">🔥</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right text-[#8B949E] tabular-nums hidden sm:table-cell">
								{entry.model_guesses_correct}
							</td>
							<td class="px-4 py-3 text-right text-[#8B949E] tabular-nums hidden sm:table-cell">
								{entry.total_votes}
							</td>
						</tr>
					{/each}

					{#if players.length === 0}
						<tr>
							<td colspan="5" class="px-4 py-10 text-center text-[#6E7681] text-sm">
								No players in this period yet.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	{/if}
</div>
