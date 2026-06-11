<script lang="ts">
	import type { SafeBattle, ModelName, RevealPayload, VoteChoice } from '$lib/types';
	import { MODEL_LABELS, MODEL_VERSION_LABELS, BATTLE_MODELS } from '$lib/types';
	import ModelLogo from './ModelLogo.svelte';

	let { battle }: { battle: SafeBattle } = $props();

	type Step = 'vote' | 'confidence' | 'guess' | 'reveal';
	type Confidence = 'kinda' | 'very' | 'certain';

	interface VoteHistoryEntry {
		date: string;
		battle_id: string;
		choice: VoteChoice;
		picked_model_name: ModelName | null;
		model_guess: ModelName | null;
		model_guess_correct: boolean | null;
		picked_winner: boolean;
		confidence: Confidence | null;
		battle_score: number;
	}

	// ── utilities ──────────────────────────────────────────────────

	function seededShuffle<T>(arr: T[], seed: number): T[] {
		const a = [...arr];
		let s = seed >>> 0;
		for (let i = a.length - 1; i > 0; i--) {
			s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
			const j = s % (i + 1);
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
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
		return `Based on ${withModel.length} votes, you pick ${MODEL_LABELS[top]} responses ${biasP}% of the time. You might be a ${MODEL_LABELS[top]} person.`;
	}

	// ── state ──────────────────────────────────────────────────────

	const slotCount = $derived(battle.outputs.modelD ? 5 : 3);
	const STEPS: Step[] = ['vote', 'confidence', 'guess', 'reveal'];

	let step = $state<Step>('vote');
	let choice = $state<VoteChoice | null>(null);
	let confidence = $state<Confidence | null>(null);
	let modelGuess = $state<ModelName | null>(null);
	let revealData = $state<RevealPayload | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let fingerprint = $state('');
	let pairOrder = $state<[VoteChoice, VoteChoice]>(['A', 'B']);

	let expandedLeft = $state(false);
	let expandedRight = $state(false);
	let showFullResults = $state(false);
	let copied = $state(false);
	let challengeCopied = $state(false);

	let voteHistory = $state<VoteHistoryEntry[]>([]);
	let streak = $state(0);
	let biasInsight = $state('');

	let emailInput = $state('');
	let emailSubmitted = $state(false);
	let emailLoading = $state(false);
	let alreadySubscribed = $state(false);

	const stepIndex = $derived(STEPS.indexOf(step));

	// ── init ───────────────────────────────────────────────────────

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
		} catch { /* ignore */ }

		const cached = localStorage.getItem(`gtm_vote_${battle.id}`);
		if (cached) {
			try {
				const p = JSON.parse(cached);
				revealData = p;
				choice = p.your_choice;
				modelGuess = p.model_guess ?? null;
				confidence = p.confidence ?? null;
				if (p.pair_left && p.pair_right) pairOrder = [p.pair_left, p.pair_right];
				step = 'reveal';
			} catch { /* ignore */ }
		}
	});

	// ── helpers ────────────────────────────────────────────────────

	function getOutput(slot: VoteChoice): { text: string } {
		if (slot === 'all_bad') return battle.outputs.modelA;
		return (battle.outputs as Record<string, { text: string }>)[`model${slot}`] ?? battle.outputs.modelA;
	}

	function getModelName(slot: VoteChoice): ModelName {
		if (!revealData || slot === 'all_bad') return 'claude';
		const map: Record<string, ModelName | undefined> = {
			A: revealData.model_A_name, B: revealData.model_B_name, C: revealData.model_C_name,
			D: revealData.model_D_name, E: revealData.model_E_name
		};
		return map[slot] ?? 'claude';
	}

	function getModelId(slot: VoteChoice): string {
		if (!revealData || slot === 'all_bad') return '';
		const map: Record<string, string | undefined> = {
			A: revealData.model_A_id, B: revealData.model_B_id, C: revealData.model_C_id,
			D: revealData.model_D_id, E: revealData.model_E_id
		};
		return map[slot] ?? '';
	}

	function pct(n: number, total: number): number {
		if (total === 0) return 0;
		return Math.round(n / total * 100);
	}

	function slotVotes(slot: VoteChoice): number {
		if (!revealData) return 0;
		const { stats } = revealData;
		if (slot === 'all_bad') return stats.all_bad;
		const m: Record<string, number> = { A: stats.A, B: stats.B, C: stats.C, D: stats.D ?? 0, E: stats.E ?? 0 };
		return m[slot] ?? 0;
	}

	function getScore() {
		if (!revealData) return { score: 0, pickedWinner: false, result: [null, null] as (boolean | null)[] };
		const lv = slotVotes(pairOrder[0]);
		const rv = slotVotes(pairOrder[1]);
		const pickedWinner =
			choice === pairOrder[0] ? lv > rv :
			choice === pairOrder[1] ? rv > lv : false;
		const result: (boolean | null)[] = [pickedWinner, revealData.model_guess_correct];
		const score = (pickedWinner ? 1 : 0) + (revealData.model_guess_correct === true ? 1 : 0);
		return { score, pickedWinner, result };
	}

	const scoreData = $derived(getScore());

	function confidenceMessage(): string {
		if (!confidence || !revealData) return '';
		const { pickedWinner } = scoreData;
		const otherSlot = choice === pairOrder[0] ? pairOrder[1] : pairOrder[0];
		const otherName = MODEL_LABELS[getModelName(otherSlot)];
		if (pickedWinner) {
			if (confidence === 'certain') return 'You were certain — and the crowd backed you up.';
			if (confidence === 'very') return 'Pretty sure — and right.';
			return 'Even with doubts, you read it correctly.';
		} else {
			if (confidence === 'certain') return `You were certain. ${otherName} had the crowd fooled.`;
			if (confidence === 'very') return `You were pretty sure — but ${otherName} won the crowd.`;
			return 'You had doubts — they were right.';
		}
	}

	// ── actions ────────────────────────────────────────────────────

	function handleVote(slot: VoteChoice | 'all_bad') {
		if (slot === 'all_bad') { choice = 'all_bad'; submitVote(); return; }
		choice = slot;
		step = 'confidence';
	}

	function handleConfidence(c: Confidence) {
		confidence = c;
		step = 'guess';
	}

	async function handleGuess(model: ModelName) {
		modelGuess = model;
		await submitVote();
	}

	async function skipGuess() {
		await submitVote();
	}

	async function submitVote() {
		if (!choice || !fingerprint) return;
		step = 'reveal';
		loading = true;
		error = null;

		try {
			const res = await fetch('/api/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ battle_id: battle.id, choice, model_guess: modelGuess, fingerprint })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Vote failed');

			revealData = data;
			localStorage.setItem(`gtm_vote_${battle.id}`, JSON.stringify({
				...data, model_guess: modelGuess, confidence,
				pair_left: pairOrder[0], pair_right: pairOrder[1]
			}));

			if (!voteHistory.some(h => h.battle_id === battle.id)) {
				const today = new Date().toISOString().slice(0, 10);
				let picked_model_name: ModelName | null = null;
				if (choice !== 'all_bad') {
					const nm: Record<string, ModelName | undefined> = {
						A: data.model_A_name, B: data.model_B_name, C: data.model_C_name,
						D: data.model_D_name, E: data.model_E_name
					};
					picked_model_name = nm[choice] ?? null;
				}
				const lv = slotVotes(pairOrder[0]);
				const rv = slotVotes(pairOrder[1]);
				const picked_winner =
					choice === pairOrder[0] ? lv > rv :
					choice === pairOrder[1] ? rv > lv : false;
				const bs = (picked_winner ? 1 : 0) + (data.model_guess_correct === true ? 1 : 0);

				const entry: VoteHistoryEntry = {
					date: today, battle_id: battle.id, choice,
					picked_model_name, model_guess: modelGuess,
					model_guess_correct: data.model_guess_correct,
					picked_winner, confidence, battle_score: bs
				};
				const newHistory = [...voteHistory, entry].slice(-90);
				voteHistory = newHistory;
				streak = computeStreak(newHistory);
				biasInsight = computeBias(newHistory);
				localStorage.setItem('gtm_history', JSON.stringify(newHistory));
			}
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Something went wrong';
		} finally {
			loading = false;
		}
	}

	async function copyShareText() {
		if (!revealData) return;
		const { score, pickedWinner } = scoreData;
		const mySlot = choice !== 'all_bad' ? choice : null;
		const myModel = mySlot ? MODEL_LABELS[getModelName(mySlot)] : null;
		const otherSlot = choice === pairOrder[0] ? pairOrder[1] : pairOrder[0];
		const myV = mySlot ? slotVotes(mySlot) : 0;
		const otherV = slotVotes(otherSlot);
		const total = revealData.stats.total;
		const promptSnip = battle.prompt.length > 55 ? battle.prompt.slice(0, 55).trimEnd() + '…' : battle.prompt;

		const lines = [`GuessTheModel — ${score}/2`, `"${promptSnip}"`];
		if (myModel) lines.push(`${myModel} ${pct(myV, total)}% vs ${MODEL_LABELS[getModelName(otherSlot)]} ${pct(otherV, total)}%${pickedWinner ? ' — I picked right' : ''}`);
		lines.push(`guessthemodel.com/battle/${battle.id}`);

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

<!-- progress -->
<div class="flex items-center gap-2 mb-6">
	{#each STEPS as s, i}
		<div class="h-1.5 rounded-full transition-all duration-300
			{i <= stepIndex ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}
			{i === stepIndex ? 'w-8' : 'w-4'}"></div>
	{/each}
</div>


<!-- ═══════════════════════════════════════ VOTE ══ -->
{#if step === 'vote'}
<div class="animate-fade-up">
	<p class="text-white font-semibold text-base mb-1">Which response is better?</p>
	<p class="text-[#6E7681] text-xs mb-4">Same prompt · Temp 0.7 · Order randomised</p>

	<div class="rounded-lg bg-[#21262D] border border-[#30363D] px-4 py-3 mb-6 text-sm text-[#8B949E] leading-relaxed">
		"{battle.prompt}"
	</div>

	<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
		{#each pairOrder.slice(0, 2) as slot, i}
			{@const output = getOutput(slot)}
			{@const expanded = i === 0 ? expandedLeft : expandedRight}
			{@const toggle = () => { if (i === 0) expandedLeft = !expandedLeft; else expandedRight = !expandedRight; }}
			{@const needsTrunc = output.text.length > 280 || output.text.split('\n').length > 5}
			<div class="card flex flex-col p-4">
				<p class="text-[#8B949E] text-sm leading-relaxed flex-1 whitespace-pre-wrap
					{expanded ? '' : 'line-clamp-6'}">
					{output.text}
				</p>
				{#if needsTrunc}
					<button onclick={toggle} class="mt-1.5 text-xs text-[#6E7681] hover:text-[#8B949E] transition-colors text-left">
						{expanded ? '↑ Less' : '↓ More'}
					</button>
				{/if}
				<button
					onclick={() => handleVote(slot)}
					class="mt-4 w-full rounded-lg border border-[#30363D] bg-[#21262D] px-4 py-3 text-sm font-semibold text-white hover:border-[#C3F73A] hover:bg-[#C3F73A10] hover:text-[#C3F73A] transition-all"
				>
					This is better
				</button>
			</div>
		{/each}
	</div>

	<div class="flex justify-center">
		<button
			onclick={() => handleVote('all_bad')}
			class="text-sm text-[#6E7681] hover:text-[#F85149] transition-colors"
		>
			Neither is good
		</button>
	</div>
</div>


<!-- ════════════════════════════════ CONFIDENCE ══ -->
{:else if step === 'confidence'}
<div class="animate-fade-up text-center py-6">
	<p class="text-white font-bold text-2xl mb-2">How sure are you?</p>
	<p class="text-[#6E7681] text-sm mb-10">About your pick — not the model yet</p>
	<div class="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
		<button
			onclick={() => handleConfidence('kinda')}
			class="card flex-1 px-6 py-4 text-sm font-medium text-[#8B949E] hover:border-[#8B949E] hover:text-white transition-all"
		>Kinda sure</button>
		<button
			onclick={() => handleConfidence('very')}
			class="card flex-1 px-6 py-4 text-sm font-medium text-[#8B949E] hover:border-[#8B949E] hover:text-white transition-all"
		>Very sure</button>
		<button
			onclick={() => handleConfidence('certain')}
			class="card flex-1 px-6 py-4 text-base font-bold text-white border-[#C3F73A30] hover:border-[#C3F73A] hover:bg-[#C3F73A08] hover:text-[#C3F73A] transition-all"
		>Certain</button>
	</div>
</div>


<!-- ═══════════════════════════════════════ GUESS ══ -->
{:else if step === 'guess'}
<div class="animate-fade-up">
	<p class="text-white font-semibold text-base mb-1">Which model wrote the response you picked?</p>
	<p class="text-[#8B949E] text-sm mb-6">You can skip if you're not sure.</p>

	<div class="flex flex-wrap gap-3 mb-6">
		{#each BATTLE_MODELS as model}
			<button
				onclick={() => handleGuess(model)}
				class="flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all
				{modelGuess === model
					? 'border-[#C3F73A] bg-[#C3F73A10] text-[#C3F73A]'
					: 'border-[#30363D] bg-[#21262D] text-[#8B949E] hover:border-[#8B949E] hover:text-white'}"
			>
				<ModelLogo {model} size="sm" />
				{MODEL_LABELS[model]}
			</button>
		{/each}
	</div>

	<button
		onclick={skipGuess}
		class="text-sm text-[#6E7681] hover:text-[#8B949E] transition-colors underline-offset-2 hover:underline"
	>
		Skip
	</button>
</div>


<!-- ══════════════════════════════════════ REVEAL ══ -->
{:else if step === 'reveal'}
<div class="animate-fade-up">
	{#if loading}
		<div class="flex items-center justify-center gap-2 text-[#8B949E] py-16">
			<div class="h-5 w-5 rounded-full border-2 border-[#30363D] border-t-[#C3F73A] animate-spin"></div>
			<span class="text-sm">Tallying votes...</span>
		</div>

	{:else if error && !revealData}
		<div class="text-center py-8">
			<p class="text-[#F85149] text-sm">{error}</p>
		</div>

	{:else if revealData}
		{@const { model_guess_correct } = revealData}
		{@const lSlot = pairOrder[0]}
		{@const rSlot = pairOrder[1]}
		{@const lModel = getModelName(lSlot)}
		{@const rModel = getModelName(rSlot)}
		{@const lV = slotVotes(lSlot)}
		{@const rV = slotVotes(rSlot)}
		{@const pairTotal = lV + rV}
		{@const confMsg = confidenceMessage()}

		<!-- Score card -->
		<div class="card p-5 mb-5 text-center bg-[#161B22] border-[#C3F73A20]">
			<div class="flex items-center justify-center gap-2.5 mb-3">
				{#each scoreData.result as r}
					<div class="h-8 w-8 rounded-md {r === null ? 'bg-[#21262D] border border-[#30363D]' : r ? 'bg-[#C3F73A]' : 'bg-[#F85149]'}"></div>
				{/each}
			</div>
			<div class="text-white font-bold text-2xl mb-1">
				{scoreData.score}<span class="text-[#6E7681] font-normal">/2</span>
			</div>
			<div class="flex items-center justify-center gap-4 text-xs text-[#6E7681]">
				<span class="{scoreData.pickedWinner ? 'text-[#C3F73A]' : ''}">crowd pick</span>
				<span class="{model_guess_correct === true ? 'text-[#C3F73A]' : model_guess_correct === null ? 'text-[#30363D]' : ''}">AI identity</span>
			</div>
		</div>

		<!-- H2H reveal cards -->
		<div class="grid grid-cols-2 gap-3 mb-5">
			{#each [
				{ slot: lSlot, model: lModel, votes: lV, wins: lV > rV, isMyPick: choice === lSlot },
				{ slot: rSlot, model: rModel, votes: rV, wins: rV > lV, isMyPick: choice === rSlot }
			] as side}
				<div class="card p-4 {side.isMyPick ? 'border-[#C3F73A30]' : ''} relative flex flex-col">
					{#if side.wins && pairTotal > 0}
						<div class="absolute -top-3 left-1/2 -translate-x-1/2 z-10 text-[10px] font-bold bg-[#C3F73A] text-[#0D1117] px-2.5 py-0.5 rounded-full whitespace-nowrap">
							crowd winner
						</div>
					{/if}

					{#if side.isMyPick}
						<p class="text-[10px] font-bold text-[#C3F73A] tracking-widest uppercase mb-2">Your pick</p>
					{:else}
						<div class="mb-2 h-4"></div>
					{/if}

					<div class="flex items-center gap-2 mb-3">
						<ModelLogo model={side.model} size="md" />
						<div class="min-w-0">
							<p class="text-white text-sm font-semibold leading-tight">{MODEL_LABELS[side.model]}</p>
							{#if MODEL_VERSION_LABELS[getModelId(side.slot)]}
								<p class="text-[#6E7681] text-[10px]">{MODEL_VERSION_LABELS[getModelId(side.slot)]}</p>
							{/if}
						</div>
					</div>

					<div class="mt-auto">
						<div class="h-1.5 rounded-full bg-[#21262D] overflow-hidden mb-1">
							<div
								class="h-full rounded-full transition-all duration-700 {side.wins ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"
								style="width:{pct(side.votes, pairTotal)}%"
							></div>
						</div>
						<p class="text-right text-xs font-medium tabular-nums {side.wins ? 'text-[#C3F73A]' : 'text-[#6E7681]'}">
							{pct(side.votes, pairTotal)}%
						</p>
					</div>
				</div>
			{/each}
		</div>

		<!-- Confidence callout -->
		{#if confMsg}
			<div class="rounded-lg px-4 py-3 mb-4 text-sm
				{scoreData.pickedWinner
					? 'bg-[#C3F73A10] border border-[#C3F73A30] text-[#C3F73A]'
					: 'bg-[#21262D] border border-[#30363D] text-[#8B949E]'}">
				{confMsg}
			</div>
		{/if}

		<!-- Model guess callout -->
		{#if model_guess_correct === false && choice !== 'all_bad'}
			<div class="rounded-lg bg-[#21262D] border border-[#30363D] px-4 py-3 mb-4 text-sm">
				<span class="text-[#8B949E]">You thought that was </span>
				<span class="text-white font-medium">{MODEL_LABELS[modelGuess!]}</span>
				<span class="text-[#8B949E]">. It was </span>
				<span class="text-white font-medium">{choice ? MODEL_LABELS[getModelName(choice)] : ''}</span>
				<span class="text-[#8B949E]">. Nobody said this would be easy.</span>
			</div>
		{:else if model_guess_correct === true && choice !== 'all_bad'}
			<div class="rounded-lg bg-[#C3F73A10] border border-[#C3F73A30] px-4 py-3 mb-4 text-sm">
				<span class="text-[#C3F73A] font-medium">Nailed it — that was {choice ? MODEL_LABELS[getModelName(choice)] : ''}.</span>
			</div>
		{/if}

		<!-- Bias insight -->
		{#if biasInsight}
			<p class="text-[#6E7681] text-xs italic mb-4">{biasInsight}</p>
		{/if}

		<!-- Streak -->
		{#if streak > 0}
			<p class="text-[#C3F73A] text-sm font-medium mb-5">
				{streak}-day streak{streak >= 7 ? ' · week strong' : ''}{streak >= 30 ? ' · legendary' : ''}
			</p>
		{/if}

		<!-- Full results -->
		<div class="mb-5">
			<button
				onclick={() => (showFullResults = !showFullResults)}
				class="text-xs text-[#6E7681] hover:text-[#8B949E] transition-colors underline-offset-2 hover:underline"
			>
				{showFullResults ? 'Hide full results' : 'Show all 5 model results'}
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
									<div class="h-full rounded-full bg-[#30363D] transition-all duration-500" style="width:{pct(v, t)}%"></div>
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

		<!-- Email capture -->
		{#if !emailSubmitted && !alreadySubscribed}
			<div class="card p-4 mb-5">
				<p class="text-white font-medium text-sm mb-0.5">Get tomorrow's battle</p>
				<p class="text-[#6E7681] text-xs mb-3">New battle daily. No spam.</p>
				<form onsubmit={handleEmailSubmit} class="flex gap-2">
					<input
						type="email"
						bind:value={emailInput}
						placeholder="you@example.com"
						class="flex-1 min-w-0 bg-[#0D1117] border border-[#30363D] rounded-md px-3 py-2 text-sm text-white placeholder:text-[#6E7681] focus:border-[#C3F73A] focus:outline-none transition-colors"
					/>
					<button
						type="submit"
						disabled={emailLoading}
						class="rounded-md bg-[#C3F73A] px-4 py-2 text-sm font-medium text-[#0D1117] hover:bg-[#D4F85C] transition-colors shrink-0 disabled:opacity-50"
					>
						{emailLoading ? '…' : 'Notify me'}
					</button>
				</form>
			</div>
		{:else if emailSubmitted}
			<p class="text-[#C3F73A] text-sm mb-5">You're in. Tomorrow's battle lands in your inbox.</p>
		{/if}

		<a
			href="/"
			class="inline-flex items-center gap-2 rounded-lg bg-[#C3F73A] px-5 py-2.5 text-sm font-bold text-[#0D1117] hover:bg-[#A8D428] transition-colors"
		>
			Next battle →
		</a>
	{/if}
</div>
{/if}
