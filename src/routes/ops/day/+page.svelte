<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	let busy = $state(false);
	let msg = $state('');
	async function regen() {
		if (busy) return;
		if (!confirm(`Regenerate day #${data.number}? This overwrites what players will see.`)) return;
		busy = true;
		msg = '';
		try {
			const res = await fetch(`/ops/seed?n=${data.number}`, { method: 'POST' });
			if (!res.ok) msg = `Failed (HTTP ${res.status}).`;
			else {
				await res.json();
				await invalidateAll(); // reload the puzzle we just regenerated
				msg = 'Regenerated.';
			}
		} catch (err) {
			msg = `Failed (${err instanceof Error ? err.message : 'network'}).`;
		}
		busy = false;
	}

	function stars(r: number) {
		return '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
	}
</script>

<svelte:head>
	<title>DUPED · Ops · Day #{data.number}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="rev">
	<div class="bar">
		<a class="link" href="/ops/dashboard">← Dashboard</a>
		<div class="nav">
			{#if data.prev}<a class="link" href={`/ops/day?n=${data.prev}`}>← #{data.prev}</a>{/if}
			<span class="cur">#{data.number}</span>
			{#if data.next}<a class="link" href={`/ops/day?n=${data.next}`}>#{data.next} →</a>{/if}
		</div>
	</div>

	<div class="head">
		<h1>
			DUPED #{data.number}
			{#if data.isToday}<span class="badge today">TODAY</span>{/if}
		</h1>
		<p class="meta">
			{data.category.emoji} {data.category.label} · {data.date} ·
			{data.live ? 'AI fakes' : 'house fakes'}
		</p>
		<div class="actions">
			<button class="regen" onclick={regen} disabled={busy}>
				{busy ? 'Regenerating…' : 'Regenerate this day'}
			</button>
			<a class="play" href={`/?day=${data.number}`} target="_blank" rel="noopener">Play it as a user ↗</a>
			{#if msg}<span class="msg">{msg}</span>{/if}
		</div>
		<p class="hint">This is exactly what players see on game day. Answers are shown here only.</p>
	</div>

	<div class="cards">
		{#each data.items as it, i (it.name + i)}
			<div class="card {it.isReal ? 'real' : 'ai'}">
				<div class="answer">{it.isReal ? 'REAL' : 'AI'}</div>
				<div class="emoji">{it.emoji || '📦'}</div>
				<div class="body">
					<div class="row">
						<span class="name">{it.name}</span>
						<span class="price">{it.price}</span>
					</div>
					<p class="tag">{it.tagline}</p>
					<div class="stars">{stars(it.rating)} <span class="num">{it.rating.toFixed(1)}</span></div>
					<p class="review">“{it.review}”</p>
					<p class="fact">{it.fact}</p>
					{#if it.isReal && it.buy}
						<a class="buy" href={it.buy} target="_blank" rel="noopener noreferrer">Amazon link ↗</a>
					{/if}
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	.rev {
		max-width: 900px;
		margin: 0 auto;
		padding: 24px 20px 64px;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		color: #e6e8ef;
		background: #0d1117;
		min-height: 100vh;
	}
	.bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 18px;
	}
	.nav {
		display: flex;
		gap: 14px;
		align-items: baseline;
	}
	.link {
		color: #8fa6ff;
		text-decoration: none;
		font-size: 13px;
		font-weight: 700;
	}
	.cur {
		color: #ffd200;
		font-weight: 800;
		font-size: 13px;
	}
	h1 {
		font-size: 24px;
		display: flex;
		align-items: center;
		gap: 10px;
	}
	.badge.today {
		font-size: 10px;
		font-weight: 800;
		background: #1230bf;
		color: #fff;
		padding: 2px 7px;
		border-radius: 6px;
	}
	.meta {
		color: #8a94a6;
		font-size: 13px;
		margin: 6px 0 12px;
	}
	.actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.regen {
		border: none;
		background: #7a1d1d;
		color: #fff;
		border-radius: 10px;
		padding: 10px 16px;
		font-weight: 700;
		font-size: 13px;
		cursor: pointer;
	}
	.regen:disabled {
		opacity: 0.6;
	}
	.play {
		color: #8fa6ff;
		text-decoration: none;
		font-size: 13px;
		font-weight: 700;
	}
	.msg {
		color: #00c98a;
		font-size: 13px;
		font-weight: 600;
	}
	.hint {
		color: #6b7384;
		font-size: 12px;
		margin-top: 10px;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 12px;
		margin-top: 18px;
	}
	.card {
		background: #161b22;
		border: 1px solid #232a33;
		border-left-width: 4px;
		border-radius: 12px;
		padding: 14px;
		position: relative;
	}
	.card.real {
		border-left-color: #00c98a;
	}
	.card.ai {
		border-left-color: #ff6b5e;
	}
	.answer {
		position: absolute;
		top: 12px;
		right: 12px;
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.05em;
		padding: 2px 7px;
		border-radius: 5px;
	}
	.card.real .answer {
		background: #0c3b2a;
		color: #00c98a;
	}
	.card.ai .answer {
		background: #3a1414;
		color: #ff6b5e;
	}
	.emoji {
		font-size: 42px;
		text-align: center;
		margin: 4px 0 8px;
	}
	.row {
		display: flex;
		justify-content: space-between;
		gap: 8px;
		align-items: baseline;
	}
	.name {
		font-weight: 700;
		color: #fff;
		font-size: 15px;
	}
	.price {
		color: #ffd200;
		font-weight: 700;
		font-size: 13px;
	}
	.tag {
		color: #c6ccd6;
		font-size: 13px;
		margin: 6px 0;
		line-height: 1.4;
	}
	.stars {
		color: #f5a623;
		font-size: 13px;
	}
	.stars .num {
		color: #8a94a6;
		font-size: 12px;
	}
	.review {
		color: #b6bdc9;
		font-style: italic;
		font-size: 12.5px;
		margin: 8px 0;
		line-height: 1.4;
	}
	.fact {
		color: #8a94a6;
		font-size: 12px;
		margin: 6px 0 0;
	}
	.buy {
		display: inline-block;
		margin-top: 8px;
		color: #8fa6ff;
		font-size: 12px;
		font-weight: 700;
		text-decoration: none;
	}
</style>
