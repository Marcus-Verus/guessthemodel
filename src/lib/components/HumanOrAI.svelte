<script lang="ts">
	import type { SafeDeck, DeckSource } from '$lib/types';
	import type { GameRecord } from '$lib/game';
	import { loadHistory, recordGame, computeStreaks, deckTitle, buildShareText } from '$lib/game';
	import Confetti from './Confetti.svelte';
	import Countdown from './Countdown.svelte';
	import StatsModal from './StatsModal.svelte';

	let {
		deck,
		deckNumber = 0,
		tagline = ''
	}: { deck: SafeDeck; deckNumber?: number; tagline?: string } = $props();

	interface RoundResult {
		index: number;
		guess: DeckSource;
		correct: boolean;
		truth: DeckSource;
		label: string;
	}

	// ── state ────────────────────────────────────────────────────

	let results = $state<RoundResult[]>([]);
	let feedback = $state<RoundResult | null>(null);
	let waiting = $state(false);
	let finished = $state(false);
	let final = $state<{ score: number; out_of: number; players: number; dist: number[] } | null>(null);
	let submitError = $state('');

	let showPanel = $state(false);
	let showConfetti = $state(false);
	let displayScore = $state(0);
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
	const total = $derived(deck.items.length);
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

		const cachedDone = localStorage.getItem(`gtm_d_done_${deck.id}`);
		if (cachedDone) {
			try {
				const p = JSON.parse(cachedDone);
				results = p.results;
				final = { score: p.score, out_of: p.out_of, players: p.players, dist: p.dist };
				finished = true;
				showPanel = true;
				displayScore = p.score;
				return;
			} catch {
				/* ignore */
			}
		}

		const cachedProgress = localStorage.getItem(`gtm_d_progress_${deck.id}`);
		if (cachedProgress) {
			try {
				results = JSON.parse(cachedProgress);
			} catch {
				/* ignore */
			}
		}
	});

	// ── play ─────────────────────────────────────────────────────

	async function guess(source: DeckSource) {
		if (waiting || feedback || finished || round >= total) return;
		waiting = true;
		submitError = '';

		try {
			const res = await fetch('/api/check', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ deck_id: deck.id, fingerprint, index: round, guess: source })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Something broke');

			const r: RoundResult = {
				index: round,
				guess: data.your_guess,
				correct: data.correct,
				truth: data.truth,
				label: data.label
			};
			feedback = r;
			waiting = false;

			setTimeout(() => {
				results = [...results, r];
				feedback = null;
				if (data.done) {
					finish(data.score, data.out_of, data.players, data.dist, [...results]);
				} else {
					localStorage.setItem(`gtm_d_progress_${deck.id}`, JSON.stringify(results));
				}
			}, 1600);
		} catch (e) {
			waiting = false;
			submitError = e instanceof Error ? e.message : 'Something broke — tap again.';
		}
	}

	function finish(score: number, out_of: number, players: number, dist: number[], allResults: RoundResult[]) {
		final = { score, out_of, players, dist };
		finished = true;
		localStorage.removeItem(`gtm_d_progress_${deck.id}`);
		localStorage.setItem(
			`gtm_d_done_${deck.id}`,
			JSON.stringify({ results: allResults, score, out_of, players, dist })
		);

		const today = new Date().toISOString().slice(0, 10);
		const h = recordGame({ date: today, battle_id: deck.id, score, out_of });
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

	// ── finale helpers ───────────────────────────────────────────

	const beatPct = $derived.by(() => {
		if (!final || final.players < 5) return null;
		const beaten = final.dist.slice(0, final.score).reduce((a, b) => a + b, 0);
		return Math.round((beaten / final.players) * 100);
	});

	const oddsLine = $derived.by(() => {
		if (!final) return '';
		if (final.score === final.out_of) return 'Pure guessing gets a perfect score 1.6% of the time. You earned this.';
		if (final.score === 0) return 'You got every single one backwards. Statistically, that takes talent.';
		if (final.score <= 2) return 'The machines walk among us, and you cannot see them.';
		return '';
	});

	const title = $derived(final ? deckTitle(final.score, final.out_of) : '');

	async function share() {
		if (!final) return;
		const text = buildShareText({
			battleNumber: deckNumber,
			score: final.score,
			outOf: final.out_of,
			correct: correctArray,
			streak,
			title,
			tagline: 'Can you tell what’s human?'
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

	function snippet(index: number, words = 8): string {
		const text = deck.items[index]?.text ?? '';
		const w = text.trim().split(/\s+/);
		return w.length <= words ? text : w.slice(0, words).join(' ') + '…';
	}
</script>

{#if showConfetti}
	<Confetti />
{/if}

<StatsModal bind:open={statsOpen} {history} />

{#if !finished}
	<!-- ══ PLAY ════════════════════════════════════════════════ -->

	<div class="flex items-center justify-between mb-4">
		<div class="flex gap-1.5">
			{#each deck.items as _, i}
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
		<span class="text-[#6E7681] text-xs font-medium tabular-nums">{Math.min(round + 1, total)} of {total}</span>
	</div>

	{#if round < total}
		{#key round}
			<div
				class="card px-5 py-7 sm:px-8 sm:py-9 mb-4 animate-fade-up transition-colors duration-300 text-center
				{feedback ? (feedback.correct ? 'border-[#C3F73A] bg-[#C3F73A06]' : 'border-[#F85149] bg-[#F8514906]') : ''}"
			>
				<p class="text-white text-lg sm:text-xl leading-relaxed font-medium">
					“{deck.items[round].text}”
				</p>
			</div>
		{/key}

		{#if feedback}
			<div
				class="animate-flip-in rounded-xl px-5 py-4 text-center
				{feedback.correct ? 'bg-[#C3F73A14] border border-[#C3F73A]' : 'bg-[#F8514910] border border-[#F85149] animate-shake'}"
			>
				<p class="font-bold text-base {feedback.correct ? 'text-[#C3F73A]' : 'text-[#F85149]'}">
					{#if feedback.truth === 'human'}
						{feedback.correct ? 'Yes — a real human.' : 'That was a real human.'}
					{:else}
						{feedback.correct ? 'Yes — that’s AI.' : 'That was AI.'}
					{/if}
				</p>
				<p class="text-[#8B949E] text-sm mt-1">
					{feedback.truth === 'human' ? `Written by ${feedback.label}` : `Generated by ${feedback.label}`}
				</p>
			</div>
		{:else}
			<p class="text-[#8B949E] font-medium text-sm mb-3 text-center">Who wrote this?</p>
			<div class="grid grid-cols-2 gap-3">
				<button
					onclick={() => guess('human')}
					disabled={waiting}
					class="rounded-xl border border-[#30363D] bg-[#1C2128] px-4 py-5 transition-all
					hover:border-[#C3F73A] hover:bg-[#C3F73A0A] hover:scale-[1.02] active:scale-95 disabled:opacity-50"
				>
					<svg class="mx-auto mb-1.5" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C3F73A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
					</svg>
					<span class="text-white font-bold text-base">A HUMAN</span>
				</button>
				<button
					onclick={() => guess('ai')}
					disabled={waiting}
					class="rounded-xl border border-[#30363D] bg-[#1C2128] px-4 py-5 transition-all
					hover:border-[#D2A8FF] hover:bg-[#D2A8FF0A] hover:scale-[1.02] active:scale-95 disabled:opacity-50"
				>
					<svg class="mx-auto mb-1.5" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D2A8FF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" />
						<path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" />
					</svg>
					<span class="text-white font-bold text-base">AN AI</span>
				</button>
			</div>
			{#if round === 0 && tagline}
				<p class="text-[#6E7681] text-xs mt-3 text-center">{tagline}</p>
			{/if}
			{#if submitError}
				<p class="mt-3 text-[#F85149] text-sm text-center animate-shake">{submitError}</p>
			{/if}
		{/if}
	{/if}
{:else}
	<!-- ══ DONE ════════════════════════════════════════════════ -->

	<div class="space-y-2 mb-5">
		{#each results as r}
			<div class="card px-4 py-3 flex items-center gap-3">
				<span class="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full
					{r.truth === 'human' ? 'bg-[#C3F73A18] text-[#C3F73A]' : 'bg-[#D2A8FF18] text-[#D2A8FF]'}">
					{r.truth === 'human' ? 'HUMAN' : 'AI'}
				</span>
				<div class="flex-1 min-w-0">
					<p class="text-white text-sm leading-tight truncate">"{snippet(r.index)}"</p>
					<p class="text-[#6E7681] text-xs">{r.label}</p>
				</div>
				<span class="shrink-0 text-sm font-bold {r.correct ? 'text-[#C3F73A]' : 'text-[#F85149]'}">
					{r.correct ? '✓' : '✗'}
				</span>
			</div>
		{/each}
	</div>

	{#if showPanel && final}
		<div bind:this={panelEl} class="animate-fade-up">
			<div class="card p-6 sm:p-8 text-center relative overflow-hidden
				{final.score === final.out_of ? 'border-[#C3F73A]' : ''}">

				<p class="label mb-3">{deckNumber ? `Daily #${deckNumber}` : 'Result'}</p>

				<p class="font-black tabular-nums leading-none mb-2 animate-pop
					{final.score === final.out_of ? 'text-[#C3F73A]' : 'text-white'}"
					style="font-size:64px">
					{displayScore}<span class="text-[#6E7681] text-3xl font-bold">/{final.out_of}</span>
				</p>

				<p class="text-lg font-bold mb-4
					{final.score === final.out_of ? 'text-[#C3F73A]' : final.score <= 2 ? 'text-[#F85149]' : 'text-white'}">
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

			{#if !emailSubmitted && !alreadySubscribed}
				<div class="card p-4 mt-4">
					<p class="text-white font-medium text-sm mb-0.5">Don't break the streak</p>
					<p class="text-[#6E7681] text-xs mb-3">Get tomorrow's game in your inbox. No spam, ever.</p>
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
				<p class="text-[#C3F73A] text-sm mt-4 text-center">You're in. Tomorrow's game lands in your inbox.</p>
			{/if}
		</div>
	{/if}
{/if}
