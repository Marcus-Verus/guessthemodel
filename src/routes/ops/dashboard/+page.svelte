<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function fmt(ts: string) {
		return new Date(ts).toLocaleString();
	}

	let seeding = $state(false);
	let seedMsg = $state('');
	async function preseed() {
		if (seeding) return;
		seeding = true;
		seedMsg = '';
		try {
			const res = await fetch('/ops/seed?days=7', { method: 'POST' });
			if (!res.ok) {
				seedMsg = `Pre-seed failed (HTTP ${res.status}).`;
			} else {
				const d = await res.json();
				seedMsg = `Pre-seeded ${d.created} new day(s) of the next ${d.days}.`;
			}
		} catch (err) {
			seedMsg = `Pre-seed failed (${err instanceof Error ? err.message : 'network'}).`;
		}
		seeding = false;
	}
</script>

<svelte:head>
	<title>DUPED · Ops</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="ops">
	<h1>DUPED · Ops</h1>

	{#if !data.configured}
		<p class="warn">
			Supabase isn't configured. Set <code>SUPABASE_URL</code> and
			<code>SUPABASE_SERVICE_ROLE_KEY</code>, run the migration, and reload.
		</p>
	{:else}
		<div class="cards">
			<div class="kpi"><b>{data.signups}</b><span>EMAIL SIGNUPS</span></div>
			<div class="kpi"><b>{data.starts}</b><span>GAME STARTS</span></div>
			<div class="kpi"><b>{data.games}</b><span>GAMES COMPLETED</span></div>
			<div class="kpi"><b>{data.gamesToday}</b><span>GAMES (24H)</span></div>
			<div class="kpi"><b>{data.endless}</b><span>ENDLESS RUNS</span></div>
			<div class="kpi"><b>{data.clicks}</b><span>AMAZON CLICKS</span></div>
			<div class="kpi"><b>{data.shares}</b><span>SHARES</span></div>
			<div class="kpi"><b>{data.saves}</b><span>SAVED FINDS</span></div>
		</div>

		<h2>Daily puzzles</h2>
		<button class="action" onclick={preseed} disabled={seeding}>
			{seeding ? 'Pre-seeding…' : 'Pre-seed next 7 days'}
		</button>
		{#if seedMsg}<span class="seedmsg">{seedMsg}</span>{/if}

		<h2>Recent signups</h2>
		{#if data.recent.length === 0}
			<p class="muted">No signups yet.</p>
		{:else}
			<table>
				<thead>
					<tr><th>Email</th><th>When</th></tr>
				</thead>
				<tbody>
					{#each data.recent as r (r.email)}
						<tr><td>{r.email}</td><td>{fmt(r.created_at)}</td></tr>
					{/each}
				</tbody>
			</table>
		{/if}
	{/if}
</div>

<style>
	.ops {
		max-width: 860px;
		margin: 0 auto;
		padding: 32px 20px 64px;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		color: #14171f;
	}
	h1 {
		font-size: 22px;
		margin-bottom: 18px;
	}
	h2 {
		font-size: 14px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #6e7681;
		margin: 28px 0 10px;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 12px;
	}
	.kpi {
		background: #f4f5f8;
		border: 1px solid #e6e8ef;
		border-radius: 12px;
		padding: 16px;
	}
	.kpi b {
		display: block;
		font-size: 30px;
		line-height: 1;
	}
	.kpi span {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #8a8f9b;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}
	th,
	td {
		text-align: left;
		padding: 8px 10px;
		border-bottom: 1px solid #eceef3;
	}
	th {
		font-size: 11px;
		letter-spacing: 0.06em;
		color: #8a8f9b;
	}
	.muted {
		color: #8a8f9b;
	}
	.action {
		border: none;
		background: #1230bf;
		color: #fff;
		border-radius: 10px;
		padding: 10px 16px;
		font-weight: 700;
		font-size: 13px;
		cursor: pointer;
	}
	.action:disabled {
		opacity: 0.6;
	}
	.seedmsg {
		margin-left: 10px;
		font-size: 13px;
		color: #00a878;
		font-weight: 600;
	}
	.warn {
		background: #fff6d6;
		border: 1px solid #ffe08a;
		border-radius: 10px;
		padding: 14px;
	}
	code {
		background: #eceef3;
		padding: 1px 5px;
		border-radius: 4px;
		font-size: 12px;
	}
</style>
