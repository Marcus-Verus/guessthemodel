<script lang="ts">
	import type { SafeBattle, ModelName, Slot, SlotTruth, CrowdStats } from '$lib/types';
	import { MODEL_LABELS, MODEL_VERSION_LABELS, BATTLE_MODELS, ALL_SLOTS } from '$lib/types';
	import type { GameRecord } from '$lib/game';
	import { loadHistory, recordGame, computeStreaks, scoreTitle, buildShareText } from '$lib/game';
	import ModelLogo from './ModelLogo.svelte';
	import Confetti from './Confetti.svelte';
	import Countdown from './Countdown.svelte';
	import StatsModal from './StatsModal.svelte';

	let { battle, battleNumber = 0 }: { battle: SafeBattle; battleNumber?: number } = $props();

	interface RoundResult {
		slot: Slot;
		guess: ModelName;
		correct: boolean;
		truth: SlotTruth;
	}

	// ── state ────────────────────────────────────────────────────

	const slots = $derived(
		ALL_SLOTS.filter((s) => (battle.outputs as Record<string, unknown>)[`model${s}`])
	);

	let results = $state<RoundResult[]>([]);
	let feedback = $state<RoundResult | null>(null);
	let waiting = $state(false);
	let finished = $state(false);
	let final = $state<{ score: number; out_of: number; crowd: CrowdStats } | null>(null);
	let favorite = $state<Slot | null>(null);
	let crowning = $state(false);
	let submitError = $state('');

	let showPanel = $state(false);
	let showConfetti = $state(false);
	let displayScore = $state(0);
	let expanded = $state(false);
	let copied = $state(false);
	let statsOpen = $state(false);

	let fingerprint = $state('');
	let history = $state<GameRecord[]>([]);
	let streak = $state(0);

	let emailInput = $state('');
	let emailSubmitted = $state(false);
	let emailLoading = $state(false);
	let alreadySubscribed = $state(false);

	let panelEl = $state<HTMLElement | null>(null);

	const round = $derived(results.length);
	const currentSlot = $derived(slots[round]);
	const usedModels = $derived(results.map((r) => r.guess));
	const correctArray = $derived(results.map((r) => r.correct));

	// ── init ─────────────────────────────────────────────────────

	$effect(() => {
		let fp = localStorage.getItem('gtm_fp');
		if (!fp) {
			fp = crypto.randomUUID();
			localStorage.setItem('gtm_fp', fp);
		}
		fingerprint = fp;
		alreadySubscribed = !!localStorage.getItem('gtm_subscribed');

		// locals only — reading state this effect writes would loop it
		const h = loadHistory();
		history = h;
		streak = computeStreaks(h).current;

		const cachedFinal = localStorage.getItem(`gtm_v3_done_${battle.id}`);
		if (cachedFinal) {
			try {
				const p = JSON.parse(cachedFinal);
				results = p.results;
				final = { score: p.score, out_of: p.out_of, crowd: p.crowd };
				favorite = p.favorite ?? null;
				finished = true;
				showPanel = true;
				displayScore = p.score;
				return;
			} catch {
				/* ignore */
			}
		}

		// resume a half-finished game
		const cachedProgress = localStorage.getItem(`gtm_v3_progress_${battle.id}`);
		if (cachedProgress) {
			try {
				results = JSON.parse(cachedProgress);
			} catch {
				/* ignore */
			}
		}
	});

	// ── play ─────────────────────────────────────────────────────

	async function guess(model: ModelName) {
		if (waiting || feedback || finished || !currentSlot) return;
		if (usedModels.includes(model)) return;
		waiting = true;
		submitError = '';

		try {
			const res = await fetch('/api/guess', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ battle_id: battle.id, fingerprint, slot: currentSlot, guess: model })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Something broke');

			const r: RoundResult = {
				slot: currentSlot,
				guess: data.your_guess,
				correct: data.correct,
				truth: data.truth
			};
			feedback = r;
			waiting = false;

			setTimeout(() => {
				results = [...results, r];
				feedback = null;
				if (data.done) {
					finish(data.score, data.out_of, data.crowd, [...results]);
				} else {
					localStorage.setItem(`gtm_v3_progress_${battle.id}`, JSON.stringify(results));
				}
			}, 1400);
		} catch (e) {
			waiting = false;
			submitError = e instanceof Error ? e.message : 'Something broke — tap again.';
		}
	}

	function finish(score: number, out_of: number, crowd: CrowdStats, allResults: RoundResult[]) {
		final = { score, out_of, crowd };
		finished = true;
		localStorage.removeItem(`gtm_v3_progress_${battle.id}`);
		localStorage.setItem(
			`gtm_v3_done_${battle.id}`,
			JSON.stringify({ results: allResults, score, out_of, crowd, favorite: null })
		);

		const today = new Date().toISOString().slice(0, 10);
		const h = recordGame({ date: today, battle_id: battle.id, score, out_of });
		history = h;
		streak = computeStreaks(h).current;

		setTimeout(() => {
			showPanel = true;
			panelEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			if (score > 0) {
				let c = 0;
				const iv = setInterval(() => {
					c++;
					displayScore = Math.min(c, score);
					if (c >= score) clearInterval(iv);
				}, 160);
			}
			if (score === out_of) showConfetti = true;
		}, 250);
	}

	// ── crown (optional one tap) ─────────────────────────────────

	async function crown(slot: Slot) {
		if (favorite || crowning || !final) return;
		crowning = true;
		try {
			const res = await fetch('/api/crown', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ battle_id: battle.id, fingerprint, favorite: slot })
			});
			const data = await res.json();
			if (res.ok) {
				favorite = slot;
				final = { ...final, crowd: data.crowd };
				const cached = localStorage.getItem(`gtm_v3_done_${battle.id}`);
				if (cached) {
					const p = JSON.parse(cached);
					p.favorite = slot;
					p.crowd = data.crowd;
					localStorage.setItem(`gtm_v3_done_${battle.id}`, JSON.stringify(p));
				}
			}
		} catch {
			/* non-critical */
		} finally {
			crowning = false;
		}
	}

	// ── reveal helpers ───────────────────────────────────────────

	const crowdFavoriteSlot = $derived.by(() => {
		if (!final) return null;
		const entries = Object.entries(final.crowd.fav) as [Slot, number][];
		if (entries.length === 0) return null;
		return entries.sort((a, b) => b[1] - a[1])[0][0];
	});

	function favPct(slot: Slot): number {
		if (!final || final.crowd.players === 0) return 0;
		return Math.round(((final.crowd.fav[slot] ?? 0) / final.crowd.players) * 100);
	}

	function truthOf(slot: Slot): SlotTruth | null {
		return results.find((r) => r.slot === slot)?.truth ?? null;
	}

	const beatPct = $derived.by(() => {
		if (!final) return null;
		const { score_dist, scored_players } = final.crowd;
		if (scored_players < 5) return null;
		const beaten = score_dist.slice(0, final.score).reduce((a, b) => a + b, 0);
		return Math.round((beaten / scored_players) * 100);
	});

	const oddsLine = $derived.by(() => {
		if (!final) return '';
		const { score, out_of } = final;
		if (score === out_of && out_of === 5) return 'Random guessing hits 5/5 once every 120 tries.';
		if (score === out_of && out_of === 3) return 'Random guessing gets this right once every 6 tries.';
		if (score === 0) return 'The AIs are officially indistinguishable to you. Most players land here.';
		return '';
	});

	const title = $derived(final ? scoreTitle(final.score, final.out_of) : '');

	// ── share + email ────────────────────────────────────────────

	async function share() {
		if (!final) return;
		const text = buildShareText({
			battleNumber,
			score: final.score,
			outOf: final.out_of,
			correct: correctArray,
			streak
		});
		const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
		if (isMobile && navigator.share) {
			try {
				await navigator.share({ text });
				return;
			} catch {
				/* cancelled — fall through */
			}
		}
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	async function handleEmailSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!emailInput || emailLoading) return;
		emailLoading = true;
		try {
			await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: emailInput })
			});
			emailSubmitted = true;
			localStorage.setItem('gtm_subscribed', '1');
		} catch {
			/* silent */
		} finally {
			emailLoading = false;
		}
	}

	function snippet(slot: Slot, words = 10): string {
		const text = (battle.outputs as Record<string, { text: string }>)[`model${slot}`]?.text ?? '';
		const w = text.trim().split(/\s+/);
		return w.length <= words ? text : w.slice(0, words).join(' ') + '…';
	}
</script>

{#if showConfetti}
	<Confetti />
{/if}

<StatsModal bind:open={statsOpen} {history} />

{#if !finished}
	<!-- ══ PLAY: one response per round, tap a logo, instant reveal ══ -->

	<!-- Progress: the grid builds as you go -->
	<div class="flex items-center justify-between mb-4">
		<div class="flex gap-1.5">
			{#each slots as s, i}
				<div
					class="h-3.5 w-3.5 rounded-[4px] transition-all duration-300
					{i < results.length
						? results[i].correct
							? 'bg-[#C3F73A]'
							: 'bg-[#F85149]'
						: i === round
							? 'bg-[#30363D] animate-glow'
							: 'bg-[#21262D]'}"
				></div>
			{/each}
		</div>
		<span class="text-[#6E7681] text-xs font-medium tabular-nums">Round {Math.min(round + 1, slots.length)} of {slots.length}</span>
	</div>

	<!-- The prompt -->
	<div class="rounded-lg bg-[#21262D] border border-[#30363D] px-4 py-3 mb-4 text-sm text-[#E6EDF3] leading-relaxed">
		"{battle.prompt}"
	</div>

	{#if currentSlot}
		{@const output = (battle.outputs as Record<string, { text: string }>)[`model${currentSlot}`]}
		{@const wordsLong = output.text.trim().split(/\s+/).length > 90}

		<!-- One response card -->
		{#key currentSlot}
			<div
				class="card p-5 mb-4 animate-fade-up transition-colors duration-300
				{feedback ? (feedback.correct ? 'border-[#C3F73A] bg-[#C3F73A06]' : 'border-[#F85149] bg-[#F8514906]') : ''}"
			>
				<p class="text-[#6E7681] text-[10px] font-bold tracking-widest uppercase mb-2">
					Answer {round + 1}
				</p>
				<p class="text-[#C9D1D9] text-[15px] leading-relaxed whitespace-pre-wrap {expanded || !wordsLong ? '' : 'line-clamp-[8]'}">
					{output.text}
				</p>
				{#if wordsLong}
					<button onclick={() => (expanded = !expanded)} class="mt-2 text-xs text-[#6E7681] hover:text-[#8B949E] transition-colors">
						{expanded ? '↑ Less' : '↓ Read it all'}
					</button>
				{/if}
			</div>
		{/key}

		<!-- Feedback flash OR the 5 buttons -->
		{#if feedback}
			<div
				class="animate-flip-in rounded-xl px-4 py-4 flex items-center gap-3
				{feedback.correct ? 'bg-[#C3F73A14] border border-[#C3F73A]' : 'bg-[#F8514910] border border-[#F85149] animate-shake'}"
			>
				<ModelLogo model={feedback.truth.name} size="lg" />
				<div class="min-w-0">
					<p class="font-bold text-base leading-tight {feedback.correct ? 'text-[#C3F73A]' : 'text-[#F85149]'}">
						{#if feedback.correct}
							{MODEL_LABELS[feedback.truth.name]} — nailed it
						{:else}
							Nope — that was {MODEL_LABELS[feedback.truth.name]}
						{/if}
					</p>
					<p class="text-[#6E7681] text-xs mt-0.5">
						{MODEL_VERSION_LABELS[feedback.truth.model_id] ?? ''}{!feedback.correct ? ` · you said ${MODEL_LABELS[feedback.guess]}` : ''}
					</p>
				</div>
			</div>
		{:else}
			<p class="text-white font-semibold text-sm mb-2.5">Who wrote this?</p>
			<div class="grid grid-cols-5 gap-1.5 sm:gap-2">
				{#each BATTLE_MODELS as model}
					{@const used = usedModels.includes(model)}
					<button
						onclick={() => guess(model)}
						disabled={used || waiting}
						class="flex flex-col items-center gap-1.5 rounded-xl border px-1 py-3 transition-all
						{used
							? 'border-transparent opacity-25 cursor-not-allowed'
							: waiting
								? 'border-[#30363D] opacity-60 cursor-wait'
								: 'border-[#30363D] bg-[#1C2128] hover:border-[#C3F73A] hover:bg-[#C3F73A0A] hover:scale-[1.04] active:scale-95'}"
					>
						<ModelLogo {model} size="md" />
						<span class="text-[10px] sm:text-[11px] font-semibold {used ? 'text-[#6E7681]' : 'text-white'}">
							{MODEL_LABELS[model]}
						</span>
					</button>
				{/each}
			</div>
			{#if round === 0}
				<p class="text-[#6E7681] text-xs mt-3 text-center">Each AI writes exactly one answer. Same puzzle for everyone today.</p>
			{/if}
			{#if submitError}
				<p class="mt-3 text-[#F85149] text-sm text-center animate-shake">{submitError}</p>
			{/if}
		{/if}
	{/if}
{:else}
	<!-- ══ DONE: compact recap + score panel ══════════════════════ -->

	<div class="rounded-lg bg-[#21262D] border border-[#30363D] px-4 py-3 mb-4 text-sm text-[#8B949E] leading-relaxed">
		"{battle.prompt}"
	</div>

	<div class="space-y-2 mb-5">
		{#each results as r, i}
			<div class="card px-4 py-3 flex items-center gap-3 {r.correct ? '' : 'opacity-80'}">
				<span class="text-[#6E7681] text-xs tabular-nums w-3">{i + 1}</span>
				<ModelLogo model={r.truth.name} size="sm" />
				<div class="flex-1 min-w-0">
					<p class="text-white text-sm font-medium leading-tight">
						{MODEL_LABELS[r.truth.name]}
						{#if crowdFavoriteSlot === r.slot && final && final.crowd.players > 0}
							<span class="ml-1.5 text-[9px] font-bold bg-[#C3F73A] text-[#0D1117] px-1.5 py-0.5 rounded-full align-middle">CROWD FAVE</span>
						{/if}
					</p>
					<p class="text-[#6E7681] text-xs truncate">"{snippet(r.slot)}"</p>
				</div>
				<span class="shrink-0 text-xs font-bold {r.correct ? 'text-[#C3F73A]' : 'text-[#F85149]'}">
					{r.correct ? '✓' : `✗ ${MODEL_LABELS[r.guess]}`}
				</span>
			</div>
		{/each}
	</div>

	{#if showPanel && final}
		<div bind:this={panelEl} class="animate-fade-up">
			<div class="card p-6 sm:p-8 text-center relative overflow-hidden
				{final.score === final.out_of ? 'border-[#C3F73A]' : ''}">

				<p class="label mb-3">{battleNumber ? `Battle #${battleNumber}` : 'Result'}</p>

				<p class="font-black tabular-nums leading-none mb-2 animate-pop
					{final.score === final.out_of ? 'text-[#C3F73A]' : 'text-white'}"
					style="font-size:64px">
					{displayScore}<span class="text-[#6E7681] text-3xl font-bold">/{final.out_of}</span>
				</p>

				<p class="text-lg font-bold mb-4 {final.score === final.out_of ? 'text-[#C3F73A]' : final.score === 0 ? 'text-[#F85149]' : 'text-white'}">
					{title}
				</p>

				<div class="flex justify-center gap-1.5 mb-5">
					{#each correctArray as c}
						<div class="h-8 w-8 rounded-md {c ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"></div>
					{/each}
				</div>

				<div class="space-y-1.5 mb-6 text-sm">
					{#if beatPct !== null}
						<p class="text-[#8B949E]">You beat <span class="text-white font-semibold">{beatPct}%</span> of today's players</p>
					{/if}
					{#if oddsLine}
						<p class="text-[#6E7681] text-xs">{oddsLine}</p>
					{/if}
					{#if favorite && crowdFavoriteSlot && final.crowd.players > 1}
						{@const cf = truthOf(crowdFavoriteSlot)}
						{#if cf}
							<p class="text-[#8B949E]">
								Crowd's favorite answer: <span class="text-white font-semibold">{MODEL_LABELS[cf.name]}</span> ({favPct(crowdFavoriteSlot)}%)
								{#if favorite === crowdFavoriteSlot}— you agreed{/if}
							</p>
						{/if}
					{/if}
					{#if streak >= 2}
						<p class="text-[#C3F73A] font-medium">{streak}-day streak{streak >= 7 ? ' · on fire' : ''}{streak >= 30 ? ' · legendary' : ''}</p>
					{/if}
				</div>

				<div class="flex flex-wrap justify-center gap-2 mb-4">
					<button
						onclick={share}
						class="rounded-lg px-6 py-3 text-sm font-bold transition-all
						{copied ? 'bg-[#3FB950] text-[#0D1117]' : 'bg-[#C3F73A] text-[#0D1117] hover:bg-[#D4F85C]'}"
					>
						{copied ? 'Copied!' : 'Share your score'}
					</button>
					<button
						onclick={() => (statsOpen = true)}
						class="rounded-lg border border-[#30363D] px-6 py-3 text-sm font-medium text-[#8B949E] hover:text-white hover:border-[#8B949E] transition-all"
					>
						My stats
					</button>
				</div>

				<Countdown />
			</div>

			<!-- Optional crown -->
			{#if !favorite}
				<div class="card p-4 mt-4">
					<p class="text-white font-medium text-sm mb-2.5">One last tap — which answer was actually best?</p>
					<div class="grid grid-cols-5 gap-1.5">
						{#each results as r}
							<button
								onclick={() => crown(r.slot)}
								disabled={crowning}
								class="flex flex-col items-center gap-1 rounded-lg border border-[#30363D] px-1 py-2.5 transition-all hover:border-[#C3F73A] hover:scale-[1.04] active:scale-95 disabled:opacity-50"
							>
								<ModelLogo model={r.truth.name} size="sm" />
								<span class="text-[9px] text-[#8B949E]">{MODEL_LABELS[r.truth.name]}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Email -->
			{#if !emailSubmitted && !alreadySubscribed}
				<div class="card p-4 mt-4">
					<p class="text-white font-medium text-sm mb-0.5">Don't break the streak</p>
					<p class="text-[#6E7681] text-xs mb-3">Get tomorrow's battle in your inbox. No spam, ever.</p>
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
							class="rounded-md bg-[#21262D] border border-[#30363D] px-4 py-2 text-sm font-medium text-white hover:border-[#C3F73A] transition-colors shrink-0 disabled:opacity-50"
						>
							{emailLoading ? '…' : 'Notify me'}
						</button>
					</form>
				</div>
			{:else if emailSubmitted}
				<p class="text-[#C3F73A] text-sm mt-4 text-center">You're in. Tomorrow's battle lands in your inbox.</p>
			{/if}
		</div>
	{/if}
{/if}
