<script lang="ts">
	import type { GameRecord } from '$lib/game';
	import { computeStreaks } from '$lib/game';

	let { open = $bindable(false), history }: { open?: boolean; history: GameRecord[] } = $props();

	const played = $derived(history.length);
	const streaks = $derived(computeStreaks(history));
	const avg = $derived(
		played > 0 ? history.reduce((s, h) => s + h.score / Math.max(h.out_of, 1), 0) / played : 0
	);
	const perfects = $derived(history.filter((h) => h.score === h.out_of).length);

	// distribution over 0..5 (normalized to /5 for mixed battle sizes)
	const dist = $derived.by(() => {
		const d = [0, 0, 0, 0, 0, 0];
		for (const h of history) {
			const n = Math.round((h.score / Math.max(h.out_of, 1)) * 5);
			d[Math.min(n, 5)]++;
		}
		return d;
	});
	const distMax = $derived(Math.max(...dist, 1));

	function close() {
		open = false;
	}
</script>

<svelte:window onkeydown={(e) => { if (e.key === 'Escape') close(); }} />

{#if open}
	<div
		class="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
		onclick={(e) => { if (e.target === e.currentTarget) close(); }}
		role="presentation"
	>
		<div
			class="card w-full max-w-sm p-6 animate-pop"
			role="dialog"
			aria-modal="true"
			aria-label="Your stats"
			tabindex="-1"
		>
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-white font-bold text-lg">Your stats</h2>
				<button onclick={close} class="text-[#6E7681] hover:text-white text-xl leading-none transition-colors" aria-label="Close">×</button>
			</div>

			<div class="grid grid-cols-4 gap-2 mb-6 text-center">
				<div>
					<p class="text-white text-2xl font-bold tabular-nums">{played}</p>
					<p class="text-[#6E7681] text-[10px] uppercase tracking-wide mt-0.5">Played</p>
				</div>
				<div>
					<p class="text-white text-2xl font-bold tabular-nums">{Math.round(avg * 100)}<span class="text-sm">%</span></p>
					<p class="text-[#6E7681] text-[10px] uppercase tracking-wide mt-0.5">Avg score</p>
				</div>
				<div>
					<p class="text-[#C3F73A] text-2xl font-bold tabular-nums">{streaks.current}</p>
					<p class="text-[#6E7681] text-[10px] uppercase tracking-wide mt-0.5">Streak</p>
				</div>
				<div>
					<p class="text-white text-2xl font-bold tabular-nums">{streaks.max}</p>
					<p class="text-[#6E7681] text-[10px] uppercase tracking-wide mt-0.5">Max streak</p>
				</div>
			</div>

			<p class="label mb-2">Score distribution</p>
			<div class="space-y-1.5 mb-4">
				{#each dist as n, i}
					<div class="flex items-center gap-2">
						<span class="text-[#8B949E] text-xs w-3 tabular-nums">{i}</span>
						<div class="flex-1 h-4 bg-[#21262D] rounded overflow-hidden">
							<div
								class="h-full rounded {i === 5 ? 'bg-[#C3F73A]' : 'bg-[#30363D]'} flex items-center justify-end px-1.5 transition-all duration-500"
								style="width:{Math.max((n / distMax) * 100, n > 0 ? 10 : 0)}%"
							>
								{#if n > 0}
									<span class="text-[10px] font-bold {i === 5 ? 'text-[#0D1117]' : 'text-white'} tabular-nums">{n}</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if perfects > 0}
				<p class="text-[#C3F73A] text-xs">{perfects} perfect game{perfects !== 1 ? 's' : ''} — Model Whisperer status.</p>
			{/if}
		</div>
	</div>
{/if}
