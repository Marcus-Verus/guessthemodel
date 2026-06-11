<script lang="ts">
	let { label = 'Next battle in' }: { label?: string } = $props();

	let remaining = $state('');

	function tick() {
		const now = new Date();
		const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 8, 0, 0));
		// daily battle drops at 08:00 UTC; if we're before today's drop, count to that instead
		const todayDrop = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 8, 0, 0));
		const target = now < todayDrop ? todayDrop : next;
		const ms = target.getTime() - now.getTime();
		const h = Math.floor(ms / 3_600_000);
		const m = Math.floor((ms % 3_600_000) / 60_000);
		const s = Math.floor((ms % 60_000) / 1000);
		remaining = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
	}

	$effect(() => {
		tick();
		const id = setInterval(tick, 1000);
		return () => clearInterval(id);
	});
</script>

<span class="inline-flex items-center gap-1.5 text-xs text-[#6E7681] tabular-nums">
	{label} <span class="text-[#8B949E] font-medium">{remaining}</span>
</span>
