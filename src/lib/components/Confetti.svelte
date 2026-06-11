<script lang="ts">
	const COLORS = ['#C3F73A', '#58A6FF', '#D2A8FF', '#FFD33D', '#3FB950', '#F85149', '#FFFFFF'];

	const pieces = Array.from({ length: 90 }, (_, i) => ({
		left: Math.random() * 100,
		delay: Math.random() * 0.7,
		dur: 2.4 + Math.random() * 1.8,
		color: COLORS[i % COLORS.length],
		w: 6 + Math.random() * 6,
		sway: Math.random() * 120 - 60,
		rot: Math.random() * 900 - 450
	}));
</script>

<div class="pointer-events-none fixed inset-0 z-[100] overflow-hidden" aria-hidden="true">
	{#each pieces as p}
		<div
			class="confetti-piece"
			style="left:{p.left}%; width:{p.w}px; height:{p.w * 0.45}px; background:{p.color};
				animation-delay:{p.delay}s; animation-duration:{p.dur}s; --sway:{p.sway}px; --rot:{p.rot}deg"
		></div>
	{/each}
</div>
