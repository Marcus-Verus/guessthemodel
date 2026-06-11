<script lang="ts">
	let streak = $state(0);
	let totalBattles = $state(0);
	let totalScore = $state(0);

	$effect(() => {
		try {
			const raw = localStorage.getItem('gtm_history');
			if (!raw) return;
			const history: Array<{ date: string; battle_score?: number }> = JSON.parse(raw);

			totalBattles = history.length;
			totalScore = history.reduce((sum, h) => sum + (h.battle_score ?? 0), 0);

			const dates = new Set(history.map((v) => v.date));
			let s = 0;
			const d = new Date();
			while (true) {
				const ds = d.toISOString().slice(0, 10);
				if (dates.has(ds)) { s++; d.setDate(d.getDate() - 1); }
				else break;
			}
			streak = s;
		} catch {
			// ignore
		}
	});
</script>

{#if streak >= 2 || totalBattles >= 5}
	<div class="flex flex-wrap items-center gap-3 mb-6">
		{#if streak >= 2}
			<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#C3F73A10] border border-[#C3F73A30] text-[#C3F73A] text-xs font-medium">
				{streak}-day streak
				{#if streak >= 7} · week strong{/if}
				{#if streak >= 30} · legendary{/if}
			</div>
		{/if}
		{#if totalBattles >= 5}
			<div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#21262D] border border-[#30363D] text-[#8B949E] text-xs">
				{totalBattles} battles · avg {totalBattles > 0 ? (totalScore / totalBattles).toFixed(1) : '0'}/3
			</div>
		{/if}
	</div>
{/if}
