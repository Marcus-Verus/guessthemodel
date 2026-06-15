<script lang="ts">
	import type { PageData } from './$types';
	let { data }: { data: PageData } = $props();

	function fmt(ts: string) {
		return new Date(ts).toLocaleString();
	}
	function rel(ts: string) {
		const d = Date.now() - new Date(ts).getTime();
		const m = Math.floor(d / 60000);
		if (m < 1) return 'just now';
		if (m < 60) return `${m}m ago`;
		const h = Math.floor(m / 60);
		if (h < 24) return `${h}h ago`;
		return `${Math.floor(h / 24)}d ago`;
	}
	function sum(b: { count: number }[] | undefined, n: number) {
		return (b ?? []).slice(-n).reduce((s, x) => s + x.count, 0);
	}
	// Inline sparkline path/bars.
	function bars(b: { count: number }[] | undefined) {
		const vals = (b ?? []).map((x) => x.count);
		const max = Math.max(1, ...vals);
		const w = 100 / Math.max(1, vals.length);
		return vals.map((v, i) => ({ x: i * w, h: (v / max) * 100, w }));
	}

	const EVENT_LABEL: Record<string, string> = {
		play_game: 'started a game',
		game_complete: 'finished the daily',
		endless_over: 'ended an endless run',
		amazon_click: 'clicked an Amazon link',
		share: 'shared a result',
		save_find: 'saved a find',
		subscribe: 'signed up'
	};
	function detail(meta: Record<string, unknown> | null): string {
		if (!meta) return '';
		const bits: string[] = [];
		if (meta.item) bits.push(String(meta.item));
		if (meta.score !== undefined) bits.push(`${meta.score}/5`);
		if (meta.run !== undefined) bits.push(`${meta.run} in a row`);
		if (meta.mode && !meta.item) bits.push(String(meta.mode));
		return bits.join(' · ');
	}

	let seeding = $state(false);
	let seedMsg = $state('');
	async function seed(force: boolean) {
		if (seeding) return;
		seeding = true;
		seedMsg = '';
		try {
			const res = await fetch(`/ops/seed?days=7${force ? '&force=1' : ''}`, { method: 'POST' });
			if (!res.ok) seedMsg = `Failed (HTTP ${res.status}).`;
			else {
				const d = await res.json();
				seedMsg = force
					? `Regenerated ${d.created} day(s) with the latest content. Reload to refresh.`
					: `Pre-seeded ${d.created} new day(s). Reload to refresh.`;
			}
		} catch (err) {
			seedMsg = `Failed (${err instanceof Error ? err.message : 'network'}).`;
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
			<div class="kpi"><b>{data.games}</b><span>GAMES DONE</span></div>
			<div class="kpi"><b>{data.gamesToday}</b><span>GAMES (24H)</span></div>
			<div class="kpi"><b>{data.endless}</b><span>ENDLESS RUNS</span></div>
			<div class="kpi accent"><b>{data.clicks}</b><span>AMAZON CLICKS</span></div>
			<div class="kpi"><b>{data.shares}</b><span>SHARES</span></div>
			<div class="kpi"><b>{data.saves}</b><span>SAVED FINDS</span></div>
		</div>

		<div class="trends">
			<div class="trend">
				<div class="trend-head">
					<span>New signups</span>
					<b>{sum(data.signupTrend, 30)}<small>{sum(data.signupTrend, 7)} in 7d</small></b>
				</div>
				<svg viewBox="0 0 100 30" preserveAspectRatio="none" class="spark">
					{#each bars(data.signupTrend) as bar (bar.x)}
						<rect x={bar.x + 0.4} y={30 - (bar.h * 30) / 100} width={bar.w - 0.8} height={(bar.h * 30) / 100} fill="#1230BF" />
					{/each}
				</svg>
			</div>
			<div class="trend">
				<div class="trend-head">
					<span>Games completed</span>
					<b>{sum(data.gameTrend, 30)}<small>{sum(data.gameTrend, 7)} in 7d</small></b>
				</div>
				<svg viewBox="0 0 100 30" preserveAspectRatio="none" class="spark">
					{#each bars(data.gameTrend) as bar (bar.x)}
						<rect x={bar.x + 0.4} y={30 - (bar.h * 30) / 100} width={bar.w - 0.8} height={(bar.h * 30) / 100} fill="#00A878" />
					{/each}
				</svg>
			</div>
		</div>

		<h2>Upcoming week</h2>
		<button class="action" onclick={() => seed(false)} disabled={seeding}>
			{seeding ? 'Working…' : 'Pre-seed missing days'}
		</button>
		<button class="action regen" onclick={() => seed(true)} disabled={seeding}>
			{seeding ? 'Working…' : 'Regenerate this week (overwrite)'}
		</button>
		{#if seedMsg}<span class="seedmsg">{seedMsg}</span>{/if}
		<div class="week">
			{#each data.upcoming as d (d.number)}
				<a class="day {d.isToday ? 'today' : ''}" href={`/ops/day?n=${d.number}`}>
					<div class="day-head">
						<span class="dn">#{d.number}{d.isToday ? ' · TODAY' : ''}</span>
						<span class="ds {d.seeded ? 'on' : 'off'}">{d.seeded ? '● ready' : '○ on-demand'}</span>
					</div>
					<div class="day-cat">{d.category.emoji} {d.category.label}</div>
					{#if d.items.length}
						<ul class="lineup">
							{#each d.items as it (it.name)}
								<li>
									<span class="tag {it.isReal ? 'real' : 'ai'}">{it.isReal ? 'REAL' : 'AI'}</span>
									<span class="iname">{it.name}</span>
								</li>
							{/each}
						</ul>
					{:else}
						<p class="pending">Generates on first play. Pre-seed to preview.</p>
					{/if}
					<span class="review-link">Review →</span>
				</a>
			{/each}
		</div>

		<div class="two">
			<div class="panel">
				<h2>Recent activity</h2>
				{#if data.activity.length === 0}
					<p class="muted">No activity yet.</p>
				{:else}
					{#each data.activity as a (a.at + a.type)}
						<div class="act">
							<span class="actlabel">{EVENT_LABEL[a.type] ?? a.type}</span>
							{#if detail(a.meta)}<span class="actdetail">{detail(a.meta)}</span>{/if}
							<span class="actwhen">{rel(a.at)}</span>
						</div>
					{/each}
				{/if}
			</div>

			<div class="panel">
				<h2>Recent signups</h2>
				{#if data.recent.length === 0}
					<p class="muted">No signups yet.</p>
				{:else}
					<table>
						<tbody>
							{#each data.recent as r (r.email)}
								<tr><td>{r.email}</td><td class="when">{fmt(r.created_at)}</td></tr>
							{/each}
						</tbody>
					</table>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	.ops {
		max-width: 980px;
		margin: 0 auto;
		padding: 32px 20px 64px;
		font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
		color: #e6e8ef;
		background: #0d1117;
		min-height: 100vh;
	}
	h1 {
		font-size: 22px;
		margin-bottom: 18px;
	}
	h2 {
		font-size: 13px;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8a94a6;
		margin: 26px 0 10px;
	}
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
		gap: 12px;
	}
	.kpi {
		background: #161b22;
		border: 1px solid #232a33;
		border-radius: 12px;
		padding: 16px;
	}
	.kpi.accent {
		border-color: #ffd20055;
		background: #1c1c12;
	}
	.kpi b {
		display: block;
		font-size: 28px;
		line-height: 1;
		color: #fff;
	}
	.kpi span {
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.1em;
		color: #8a94a6;
	}
	.trends {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 12px;
		margin-top: 14px;
	}
	.trend {
		background: #161b22;
		border: 1px solid #232a33;
		border-radius: 12px;
		padding: 14px 16px;
	}
	.trend-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		font-size: 13px;
		color: #b6bdc9;
		margin-bottom: 8px;
	}
	.trend-head b {
		font-size: 20px;
		color: #fff;
	}
	.trend-head small {
		display: block;
		font-size: 11px;
		font-weight: 400;
		color: #8a94a6;
		text-align: right;
	}
	.spark {
		width: 100%;
		height: 44px;
		display: block;
	}
	.week {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 10px;
		margin-top: 10px;
	}
	.day {
		display: block;
		background: #161b22;
		border: 1px solid #232a33;
		border-radius: 12px;
		padding: 12px;
		color: inherit;
		text-decoration: none;
		transition: border-color 0.12s, background 0.12s;
	}
	.day:hover {
		border-color: #3a4656;
		background: #1b212b;
	}
	.day.today {
		border-color: #1230bf;
	}
	.review-link {
		display: block;
		margin-top: 8px;
		font-size: 11px;
		font-weight: 700;
		color: #8fa6ff;
	}
	.day-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.day .dn {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #ffd200;
	}
	.day-cat {
		font-size: 13px;
		font-weight: 600;
		color: #e6e8ef;
		margin: 4px 0 8px;
	}
	.day .ds {
		font-size: 10px;
		font-weight: 700;
	}
	.day .ds.on {
		color: #00c98a;
	}
	.day .ds.off {
		color: #8a94a6;
	}
	.lineup {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.lineup li {
		display: flex;
		align-items: center;
		gap: 7px;
		font-size: 12px;
	}
	.tag {
		font-size: 9px;
		font-weight: 800;
		letter-spacing: 0.04em;
		padding: 1px 5px;
		border-radius: 4px;
		flex-shrink: 0;
	}
	.tag.real {
		background: #0c3b2a;
		color: #00c98a;
	}
	.tag.ai {
		background: #3a1414;
		color: #ff6b5e;
	}
	.iname {
		color: #c6ccd6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.pending {
		font-size: 11px;
		color: #6b7384;
		margin: 0;
	}
	.two {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 12px;
	}
	@media (max-width: 720px) {
		.two {
			grid-template-columns: 1fr;
		}
	}
	.panel {
		background: #161b22;
		border: 1px solid #232a33;
		border-radius: 12px;
		padding: 6px 16px 14px;
	}
	.act {
		display: flex;
		align-items: baseline;
		gap: 8px;
		padding: 8px 0;
		border-bottom: 1px solid #232a33;
		font-size: 13px;
	}
	.act:last-child {
		border-bottom: none;
	}
	.actlabel {
		color: #e6e8ef;
		font-weight: 600;
	}
	.actdetail {
		color: #8a94a6;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.actwhen {
		color: #6b7384;
		font-size: 11px;
		margin-left: auto;
		white-space: nowrap;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 13px;
	}
	td {
		padding: 8px 0;
		border-bottom: 1px solid #232a33;
	}
	td.when {
		color: #8a94a6;
		text-align: right;
		white-space: nowrap;
	}
	.muted {
		color: #8a94a6;
		padding: 10px 0;
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
	.action.regen {
		background: #7a1d1d;
		margin-left: 8px;
	}
	.seedmsg {
		margin-left: 10px;
		font-size: 13px;
		color: #00c98a;
		font-weight: 600;
	}
	.warn {
		background: #2a2410;
		border: 1px solid #5a4a14;
		color: #ffd680;
		border-radius: 10px;
		padding: 14px;
	}
	code {
		background: #232a33;
		padding: 1px 5px;
		border-radius: 4px;
		font-size: 12px;
	}
</style>
