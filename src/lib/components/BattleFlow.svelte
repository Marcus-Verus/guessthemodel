<script lang="ts">
	import type { SafeBattle, ModelName, RevealPayload, VoteChoice } from '$lib/types';
	import { MODEL_LABELS, MODEL_VERSION_LABELS, BATTLE_MODELS } from '$lib/types';
	import ModelLogo from './ModelLogo.svelte';

	let { battle }: { battle: SafeBattle } = $props();

	interface VoteHistoryEntry {
		date: string;
		battle_id: string;
		choice: VoteChoice;
		picked_model_name: ModelName | null;
		picked_winner: boolean;
	}

	// ── utils ─────────────────────────────────────────────────────

	function seededShuffle<T>(arr: T[], seed: number): T[] {
		const a = [...arr];
		let s = seed >>> 0;
		for (let i = a.length - 1; i > 0; i--) {
			s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
			[a[i], a[s % (i + 1)]] = [a[s % (i + 1)], a[i]];
		}
		return a;
	}

	function truncateWords(text: string, max: number): string {
		const words = text.trim().split(/\s+/);
		return words.length <= max ? text : words.slice(0, max).join(' ') + '…';
	}

	function computeStreak(history: VoteHistoryEntry[]): number {
		const dates = new Set(history.map(v => v.date));
		let streak = 0;
		const d = new Date();
		while (true) {
			const ds = d.toISOString().slice(0, 10);
			if (dates.has(ds)) { streak++; d.setDate(d.getDate() - 1); }
			else break;
		}
		return streak;
	}

	function computeBias(history: VoteHistoryEntry[]): string {
		const withModel = history.filter(h => h.picked_model_name);
		if (withModel.length < 8) return '';
		const counts: Partial<Record<ModelName, number>> = {};
		for (const h of withModel) {
			if (h.picked_model_name) counts[h.picked_model_name] = (counts[h.picked_model_name] ?? 0) + 1;
		}
		const sorted = (Object.entries(counts) as [ModelName, number][]).sort((a, b) => b[1] - a[1]);
		if (!sorted.length) return '';
		const [top, n] = sorted[0];
		const biasP = Math.round(n / withModel.length * 100);
		if (biasP < 40) return '';
		return `You tend to pick ${MODEL_LABELS[top]} responses (${biasP}% of the time).`;
	}

	// ── state ─────────────────────────────────────────────────────

	const slotCount = $derived(battle.outputs.modelD ? 5 : 3);

	let revealed = $state(false);
	let loading = $state(false);
	let choice = $state<VoteChoice | null>(null);
	let revealData = $state<RevealPayload | null>(null);
	let pairOrder = $state<[VoteChoice, VoteChoice]>(['A', 'B']);
	let fingerprint = $state('');

	let expandedLeft = $state(false);
	let expandedRight = $state(false);
	let showFullResults = $state(false);
	let copied = $state(false);
	let challengeCopied = $state(false);

	let voteHistory = $state<VoteHistoryEntry[]>([]);
	let streak = $state(0);
	let biasInsight = $state('');
	let accuracy = $state<{ wins: number; total: number; pct: number } | null>(null);

	let emailInput = $state('');
	let emailSubmitted = $state(false);
	let emailLoading = $state(false);
	let alreadySubscribed = $state(false);

	// ── init ──────────────────────────────────────────────────────

	$effect(() => {
		let fp = localStorage.getItem('gtm_fp');
		if (!fp) { fp = crypto.randomUUID(); localStorage.setItem('gtm_fp', fp); }
		fingerprint = fp;

		const hash = [...(fp + battle.id)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
		const allSlots: VoteChoice[] = slotCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C'];
		const shuffled = seededShuffle(allSlots, hash);
		pairOrder = [shuffled[0], shuffled[1]];

		alreadySubscribed = !!localStorage.getItem('gtm_subscribed');

		try {
			const raw = localStorage.getItem('gtm_history');
			const history: VoteHistoryEntry[] = raw ? JSON.parse(raw) : [];
			voteHistory = history;
			streak = computeStreak(history);
			biasInsight = computeBias(history);
			if (history.length >= 5) {
				const wins = history.filter(h => h.picked_winner).length;
				accuracy = { wins, total: history.length, pct: Math.round(wins / history.length * 100) };
			}
		} catch { /* ignore */ }

		const cached = localStorage.getItem(`gtm_vote_${battle.id}`);
		if (cached) {
			try {
				const p = JSON.parse(cached);
				revealData = p;
				choice = p.your_choice;
				if (p.pair_left && p.pair_right) pairOrder = [p.pair_left, p.pair_right];
				revealed = true;
			} catch { /* ignore */ }
		}
	});

	// ── helpers ───────────────────────────────────────────────────

	function getOutput(slot: VoteChoice): { text: string } {
		if (slot === 'all_bad') return battle.outputs.modelA;
		return (battle.outputs as Record<string, { text: string }>)[`model${slot}`] ?? battle.outputs.modelA;
	}

	function getModelName(slot: VoteChoice): ModelName {
		if (!revealData || slot === 'all_bad') return 'claude';
		const m: Record<string, ModelName | undefined> = {
			A: revealData.model_A_name, B: revealData.model_B_name, C: revealData.model_C_name,
			D: revealData.model_D_name, E: revealData.model_E_name
		};
		return m[slot] ?? 'claude';
	}

	function getModelId(slot: VoteChoice): string {
		if (!revealData || slot === 'all_bad') return '';
		const m: Record<string, string | undefined> = {
			A: revealData.model_A_id, B: revealData.model_B_id, C: revealData.model_C_id,
			D: revealData.model_D_id, E: revealData.model_E_id
		};
		return m[slot] ?? '';
	}

	function pct(n: number, total: number) {
		return total === 0 ? 0 : Math.round(n / total * 100);
	}

	function slotVotes(slot: VoteChoice): number {
		if (!revealData) return 0;
		const { stats } = revealData;
		if (slot === 'all_bad') return stats.all_bad;
		return ({ A: stats.A, B: stats.B, C: stats.C, D: stats.D ?? 0, E: stats.E ?? 0 } as Record<string, number>)[slot] ?? 0;
	}

	const otherSlot = $derived<VoteChoice>(choice === pairOrder[0] ? pairOrder[1] : pairOrder[0]);

	const pickedWinner = $derived(
		revealed && revealData && choice && choice !== 'all_bad'
			? slotVotes(choice) > slotVotes(otherSlot)
			: false
	);

	function verdictMessage(): string {
		if (!revealData || !choice) return '';
		if (choice === 'all_bad') return 'You called it — neither impressed you.';
		const myModel = MODEL_LABELS[getModelName(choice)];
		const myV = slotVotes(choice);
		const otherV = slotVotes(otherSlot);
		const total = myV + otherV;
		if (pickedWinner) return `You picked ${myModel} — the crowd agreed (${pct(myV, total)}%)`;
		return `You picked ${myModel} — the crowd preferred ${MODEL_LABELS[getModelName(otherSlot)]} (${pct(otherV, total)}%)`;
	}

	// ── actions ───────────────────────────────────────────────────

	async function handleVote(slot: VoteChoice | 'all_bad') {
		if (loading || revealed) return;
		choice = slot;
		loading = true;

		try {
			const res = await fetch('/api/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ battle_id: battle.id, choice: slot, fingerprint })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Vote failed');

			revealData = data;
			localStorage.setItem(`gtm_vote_${battle.id}`, JSON.stringify({
				...data, pair_left: pairOrder[0], pair_right: pairOrder[1]
			}));

			if (!voteHistory.some(h => h.battle_id === battle.id)) {
				const today = new Date().toISOString().slice(0, 10);
				let picked_model_name: ModelName | null = null;
				if (slot !== 'all_bad') {
					const nm: Record<string, ModelName | undefined> = {
						A: data.model_A_name, B: data.model_B_name, C: data.model_C_name,
						D: data.model_D_name, E: data.model_E_name
					};
					picked_model_name = nm[slot] ?? null;
				}
				const lv = (data.stats as Record<string, number>)[pairOrder[0]] ?? 0;
				const rv = (data.stats as Record<string, number>)[pairOrder[1]] ?? 0;
				const picked_winner = slot === pairOrder[0] ? lv > rv : slot === pairOrder[1] ? rv > lv : false;

				const newHistory = [...voteHistory, { date: today, battle_id: battle.id, choice: slot, picked_model_name, picked_winner }].slice(-90);
				voteHistory = newHistory;
				streak = computeStreak(newHistory);
				biasInsight = computeBias(newHistory);
				if (newHistory.length >= 5) {
					const wins = newHistory.filter(h => h.picked_winner).length;
					accuracy = { wins, total: newHistory.length, pct: Math.round(wins / newHistory.length * 100) };
				}
				localStorage.setItem('gtm_history', JSON.stringify(newHistory));
			}

			revealed = true;
		} catch {
			// still reveal so user isn't stuck
			revealed = true;
		} finally {
			loading = false;
		}
	}

	async function copyShareText() {
		if (!revealData || !choice) return;
		const msg = verdictMessage();
		const promptSnip = battle.prompt.length > 60 ? battle.prompt.slice(0, 60).trimEnd() + '…' : battle.prompt;
		const lines = ['GuessTheModel', msg, `"${promptSnip}"`, `guessthemodel.com/battle/${battle.id}`];
		await navigator.clipboard.writeText(lines.join('\n'));
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function copyChallenge() {
		await navigator.clipboard.writeText(`https://guessthemodel.com/battle/${battle.id}`);
		challengeCopied = true;
		setTimeout(() => (challengeCopied = false), 2000);
	}

	async function handleEmailSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!emailInput || emailLoading) return;
		emailLoading = true;
		try {
			await fetch('/api/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: emailInput }) });
			emailSubmitted = true;
			localStorage.setItem('gtm_subscribed', '1');
		} catch { /* silent */ } finally {
			emailLoading = false;
		}
	}
</script>


<!-- ══ PROMPT ══════════════════════════════════════════════════ -->
<p class="text-white font-semibold text-base mb-1">Which response is better?</p>
<div class="rounded-lg bg-[#21262D] border border-[#30363D] px-4 py-3 mb-5 text-sm text-[#8B949E] leading-relaxed">
	"{battle.prompt}"
</div>


<!-- ══ CARDS ════════════════════════════════════════════════════ -->
<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
	{#each [0, 1] as i}
		{@const slot = pairOrder[i]}
		{@const output = getOutput(slot)}
		{@const isChosen = choice === slot}
		{@const expanded = i === 0 ? expandedLeft : expandedRight}
		{@const toggleExpand = () => { if (i === 0) expandedLeft = !expandedLeft; else expandedRight = !expandedRight; }}
		{@const wordsLong = output.text.trim().split(/\s+/).length > 80}

		<div class="card flex flex-col p-4 transition-all duration-300
			{revealed && isChosen ? 'border-[#C3F73A30]' : ''}
			{revealed && !isChosen && choice !== 'all_bad' ? 'opacity-60' : ''}">

			<!-- Reveal header (animates in) -->
			{#if revealed && revealData}
				{@const modelN = getModelName(slot)}
				{@const votes = slotVotes(slot)}
				{@const otherV = slotVotes(i === 0 ? pairOrder[1] : pairOrder[0])}
				{@const pairTot = votes + otherV}
				{@const wins = votes > otherV}

				<div class="flex items-center justify-between mb-3 animate-fade-up">
					<div class="flex items-center gap-2">
						<ModelLogo model={modelN} size="md" />
						<div class="min-w-0">
							<p class="text-white text-sm font-semibold leading-tight">{MODEL_LABELS[modelN]}</p>
							{#if MODEL_VERSION_LABELS[getModelId(slot)]}
								<p class="text-[#6E7681] text-[10px]">{MODEL_VERSION_LABELS[getModelId(slot)]}</p>
							{/if}
						</div>
					</div>
					<div class="flex flex-col items-end gap-0.5 shrink-0">
						{#if isChosen}
							<span class="text-[10px] font-bold text-[#C3F73A] tracking-widest uppercase">Your pick</span>
						{/if}
						{#if wins && pairTot > 0}
							<span class="text-[10px] font-bold bg-[#C3F73A] text-[#0D1117] px-2 py-0.5 rounded-full whitespace-nowrap">crowd winner</span>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Text (always visible) -->
			<p class="text-[#8B949E] text-sm leading-relaxed flex-1 whitespace-pre-wrap
				{expanded ? '' : 'line-clamp-5'}">
				{truncateWords(output.text, 80)}
			</p>
			{#if wordsLong}
				<button onclick={toggleExpand} class="mt-1.5 text-xs text-[#6E7681] hover:text-[#8B949E] transition-colors text-left">
					{expanded ? '↑ Less' : '↓ More'}
				</button>
			{/if}

			<!-- Vote button (pre-reveal) or bar (post-reveal) -->
			{#if !revealed}
				<button
					onclick={() => handleVote(slot)}
					disabled={loading}
					class="mt-4 w-full rounded-lg border px-4 py-3 text-sm font-semibold transition-all disabled:cursor-wait
					{loading && isChosen
						? 'border-[#C3F73A40] bg-[#C3F73A08] text-[#C3F73A60]'
						: 'border-[#30363D] bg-[#21262D] text-white hover:border-[#C3F73A] hover:bg-[#C3F73A10] hover:text-[#C3F73A]'}"
				>
					{#if loading && isChosen}
						<span class="flex items-center justify-center gap-2">
							<span class="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
							Voting...
						</span>
					{:else}
						This is better
					{/if}
				</button>

			{:else if revealData}
				{@const votes = slotVotes(slot)}
				{@const otherV = slotVotes(i === 0 ? pairOrder[1] : pairOrder[0])}
				{@const pairTot = votes + otherV}
				{@const wins = votes > otherV}
				<div class="mt-4">
					<div class="h-1.5 rounded-full bg-[#21262D] overflow-hidden">
						<div class="h-full rounded-full {wins ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"
							style="width:{pct(votes, pairTot)}%"></div>
					</div>
					<p class="text-right text-xs font-medium tabular-nums mt-1 {wins ? 'text-[#C3F73A]' : 'text-[#6E7681]'}">
						{pct(votes, pairTot)}%
					</p>
				</div>
			{/if}
		</div>
	{/each}
</div>

<!-- Neither (pre-reveal only) -->
{#if !revealed}
	<div class="flex justify-center mb-2">
		<button
			onclick={() => handleVote('all_bad')}
			disabled={loading}
			class="text-xs text-[#6E7681] hover:text-[#F85149] transition-colors disabled:opacity-40"
		>
			Neither is good
		</button>
	</div>
{/if}


<!-- ══ POST-REVEAL ═══════════════════════════════════════════════ -->
{#if revealed && revealData}
	<div class="mt-5 animate-fade-up">

		<!-- Verdict -->
		<p class="text-white font-semibold text-base mb-1">{verdictMessage()}</p>

		<!-- Accuracy -->
		{#if accuracy}
			<p class="text-[#6E7681] text-sm mb-1">
				You've been right {accuracy.wins}/{accuracy.total} times ({accuracy.pct}%)
			</p>
		{/if}

		<!-- Bias -->
		{#if biasInsight}
			<p class="text-[#6E7681] text-xs italic mb-3">{biasInsight}</p>
		{/if}

		<!-- Streak -->
		{#if streak > 0}
			<p class="text-[#C3F73A] text-sm font-medium mb-4">
				{streak}-day streak{streak >= 7 ? ' · week strong' : ''}{streak >= 30 ? ' · legendary' : ''}
			</p>
		{/if}

		<!-- Full results -->
		<div class="mb-5">
			<button
				onclick={() => (showFullResults = !showFullResults)}
				class="text-xs text-[#6E7681] hover:text-[#8B949E] transition-colors underline-offset-2 hover:underline"
			>
				{showFullResults ? 'Hide' : 'All 5 model results'}
			</button>
			{#if showFullResults}
				{@const allKeys = (['A', 'B', 'C', ...(battle.outputs.modelD ? ['D'] : []), ...(battle.outputs.modelE ? ['E'] : [])] as VoteChoice[])}
				<div class="mt-3 space-y-3">
					{#each allKeys as slot}
						{@const m = getModelName(slot)}
						{@const v = slotVotes(slot)}
						{@const t = revealData.stats.total}
						<div class="flex items-center gap-3">
							<ModelLogo model={m} size="sm" />
							<div class="flex-1">
								<div class="flex justify-between text-xs mb-1">
									<span class="text-white">{MODEL_LABELS[m]}</span>
									<span class="text-[#6E7681] tabular-nums">{pct(v, t)}%</span>
								</div>
								<div class="h-1 rounded-full bg-[#21262D] overflow-hidden">
									<div class="h-full rounded-full bg-[#30363D]" style="width:{pct(v, t)}%"></div>
								</div>
							</div>
						</div>
					{/each}
					<p class="text-[#6E7681] text-xs">{revealData.stats.total} vote{revealData.stats.total !== 1 ? 's' : ''} total</p>
				</div>
			{/if}
		</div>

		<!-- Share -->
		<div class="flex flex-wrap gap-2 mb-5">
			<button
				onclick={copyShareText}
				class="rounded-md border px-4 py-2 text-sm font-medium transition-all
				{copied ? 'border-[#3FB950] text-[#3FB950]' : 'border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#8B949E]'}"
			>
				{copied ? 'Copied!' : 'Share result'}
			</button>
			<button
				onclick={copyChallenge}
				class="rounded-md border px-4 py-2 text-sm font-medium transition-all
				{challengeCopied ? 'border-[#3FB950] text-[#3FB950]' : 'border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#8B949E]'}"
			>
				{challengeCopied ? 'Link copied!' : 'Challenge a friend'}
			</button>
		</div>

		<!-- Email -->
		{#if !emailSubmitted && !alreadySubscribed}
			<div class="card p-4 mb-5">
				<p class="text-white font-medium text-sm mb-0.5">Get tomorrow's battle</p>
				<p class="text-[#6E7681] text-xs mb-3">New battle daily. No spam.</p>
				<form onsubmit={handleEmailSubmit} class="flex gap-2">
					<input type="email" bind:value={emailInput} placeholder="you@example.com"
						class="flex-1 min-w-0 bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#6E7681] focus:border-[#C3F73A] focus:outline-none transition-colors" />
					<button type="submit" disabled={emailLoading}
						class="rounded-md bg-[#C3F73A] px-4 py-2 text-sm font-medium text-[#0D1117] hover:bg-[#D4F85C] transition-colors shrink-0 disabled:opacity-50">
						{emailLoading ? '…' : 'Notify me'}
					</button>
				</form>
			</div>
		{:else if emailSubmitted}
			<p class="text-[#C3F73A] text-sm mb-5">You're in. Tomorrow's battle lands in your inbox.</p>
		{/if}

		<a href="/"
			class="inline-flex items-center gap-2 rounded-lg bg-[#C3F73A] px-5 py-2.5 text-sm font-bold text-[#0D1117] hover:bg-[#A8D428] transition-colors">
			Next battle →
		</a>

	</div>
{/if}
