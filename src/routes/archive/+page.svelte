<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>DUPED - Archive</title>
	<meta name="description" content="Play past DUPED puzzles - real Amazon products vs. AI fakes." />
</svelte:head>

<div class="gtm-root">
	<div class="archive-wrap">
		<a class="back" href="/">← duped.gg</a>
		<h1 class="disp h1" style="font-size:34px">ARCHIVE</h1>
		<p class="sub">Missed a day? Play any past puzzle.</p>

		<div class="archive-grid">
			{#each data.days as d (d.number)}
				<a class="archive-card" href={d.isToday ? '/' : `/?day=${d.number}`}>
					<span class="num">#{d.number}{d.isToday ? ' · TODAY' : ''}</span>
					<span class="emoji">{d.category.emoji}</span>
					<span class="catname">{d.category.label}</span>
				</a>
			{/each}
		</div>
	</div>
</div>

<style>
	.archive-wrap {
		width: 100%;
		max-width: 560px;
		text-align: center;
		padding-top: 24px;
	}
	.back {
		display: inline-block;
		color: #c9d2ff;
		text-decoration: none;
		font-size: 13px;
		font-weight: 700;
		margin-bottom: 14px;
	}
	.archive-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
		gap: 10px;
		margin-top: 22px;
	}
	.archive-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		padding: 14px 10px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		color: #fff;
		text-decoration: none;
		transition: background 0.12s, transform 0.08s;
	}
	.archive-card:hover {
		background: rgba(255, 255, 255, 0.18);
	}
	.archive-card:active {
		transform: translateY(2px);
	}
	.archive-card .num {
		font-size: 11px;
		font-weight: 800;
		letter-spacing: 0.08em;
		color: var(--tag);
	}
	.archive-card .emoji {
		font-size: 30px;
	}
	.archive-card .catname {
		font-size: 12px;
		font-weight: 600;
		color: #c9d2ff;
	}
</style>
