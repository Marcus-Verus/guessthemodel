<script lang="ts">
	import type { DeckSource } from '$lib/types';
	import { survivalShareText } from '$lib/game';
	import Confetti from './Confetti.svelte';

	type Phase = 'ready' | 'playing' | 'dead';

	interface Card {
		id: string;
		text: string;
		themeLabel: string;
	}

	let phase = $state<Phase>('ready');
	let runId = $state<string | null>(null);
	let card = $state<Card | null>(null);
	let streak = $state(0);
	let feedback = $state<{ correct: boolean; truth: DeckSource; label: string } | null>(null);
	let waiting = $state(false);
	let submitError = $state('');

	let personalBest = $state(0);
	let newBest = $state(false);
	let deathStats = $state<{ todayBest: number; beatPct: number | null; todayRuns: number } | null>(null);
	let showConfetti = $state(false);
	let copied = $state(false);
	let fingerprint = $state('');

	$effect(() => {
		let fp = localStorage.getItem('gtm_fp');
		if (!fp) {
			fp = crypto.randomUUID();
			localStorage.setItem('gtm_fp', fp);
		}
		fingerprint = fp;
		personalBest = Number(localStorage.getItem('gtm_surv_best') ?? 0);

		// resume an in-flight run after refresh
		const saved = localStorage.getItem('gtm_surv_run');
		if (saved) runId = saved;
	});

	async function next() {
		waiting = true;
		submitError = '';
		try {
			const res = await fetch('/api/survival/next', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ fingerprint, run_id: runId })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Something broke');

			runId = data.run_id;
			localStorage.setItem('gtm_surv_run', data.run_id);
			streak = data.streak;

			if (data.cleared) {
				// ran the entire pool dry — treat like a legendary death
				die(data.streak, null, null, 0);
				return;
			}
			card = data.item;
			phase = 'playing';
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Something broke — tap again.';
		} finally {
			waiting = false;
		}
	}

	async function guess(source: DeckSource) {
		if (waiting || feedback || !card) return;
		waiting = true;
		submitError = '';
		try {
			const res = await fetch('/api/survival/guess', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ run_id: runId, fingerprint, guess: source })
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.message || 'Something broke');

			feedback = { correct: data.correct, truth: data.truth, label: data.label };
			navigator.vibrate?.(data.correct ? 25 : [80, 60, 120]);
			waiting = false;

			setTimeout(() => {
				feedback = null;
				if (data.correct) {
					streak = data.streak;
					next();
				} else {
					die(data.streak, data.today_best, data.beat_pct, data.today_runs);
				}
			}, data.correct ? 900 : 1700);
		} catch (e) {
			waiting = false;
			submitError = e instanceof Error ? e.message : 'Something broke — tap again.';
		}
	}

	function die(finalStreak: number, todayBest: number | null, beatPct: number | null, todayRuns: number) {
		streak = finalStreak;
		deathStats = { todayBest: todayBest ?? finalStreak, beatPct, todayRuns };
		localStorage.removeItem('gtm_surv_run');
		runId = null;
		card = null;
		newBest = finalStreak > personalBest;
		if (newBest) {
			personalBest = finalStreak;
			localStorage.setItem('gtm_surv_best', String(finalStreak));
			if (finalStreak >= 5) showConfetti = true;
		}
		phase = 'dead';
	}

	function runItBack() {
		showConfetti = false;
		newBest = false;
		deathStats = null;
		streak = 0;
		next();
	}

	async function share() {
		const text = survivalShareText(streak, personalBest);
		const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
		if (isMobile && navigator.share) {
			try {
				await navigator.share({ text });
				return;
			} catch {
				/* cancelled */
			}
		}
		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}
</script>

{#if showConfetti}
	<Confetti />
{/if}

{#if phase === 'ready'}
	<div class="card p-8 sm:p-10 text-center">
		<p class="label mb-3">Survival</p>
		<h2 class="text-white font-black text-3xl mb-3">One wrong = run over.</h2>
		<p class="text-[#8B949E] text-sm mb-2 max-w-sm mx-auto">
			Human or AI, card after card, until you slip. No second chances.
		</p>
		{#if personalBest > 0}
			<p class="text-[#C3F73A] text-sm font-medium mb-6">Personal best: {personalBest}</p>
		{:else}
			<div class="mb-6"></div>
		{/if}
		<button
			onclick={next}
			disabled={waiting}
			class="rounded-xl bg-[#C3F73A] px-10 py-4 text-base font-black text-[#0D1117] hover:bg-[#D4F85C] transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 animate-glow"
		>
			{waiting ? 'Loading…' : 'Start the run'}
		</button>
		{#if submitError}
			<p class="mt-4 text-[#F85149] text-sm animate-shake">{submitError}</p>
		{/if}
	</div>

{:else if phase === 'playing' && card}
	<!-- streak counter -->
	<div class="flex items-center justify-between mb-4">
		<span class="text-[#6E7681] text-xs">{card.themeLabel}</span>
		<p class="text-sm tabular-nums">
			<span class="text-[#6E7681]">streak</span>
			<span class="text-[#C3F73A] font-black text-xl ml-1.5">{streak}</span>
		</p>
	</div>

	{#key card.id}
		<div
			class="card px-5 py-7 sm:px-8 sm:py-9 mb-4 animate-fade-up transition-colors duration-300 text-center
			{feedback ? (feedback.correct ? 'border-[#C3F73A] bg-[#C3F73A06]' : 'border-[#F85149] bg-[#F8514906]') : ''}"
		>
			<p class="text-white text-lg sm:text-xl leading-relaxed font-medium">“{card.text}”</p>
		</div>
	{/key}

	{#if feedback}
		<div
			class="animate-flip-in rounded-xl px-5 py-4 text-center
			{feedback.correct ? 'bg-[#C3F73A14] border border-[#C3F73A]' : 'bg-[#F8514910] border border-[#F85149] animate-shake'}"
		>
			<p class="font-bold text-base {feedback.correct ? 'text-[#C3F73A]' : 'text-[#F85149]'}">
				{#if feedback.correct}
					{feedback.truth === 'human' ? 'Human — correct.' : 'AI — correct.'}
				{:else}
					{feedback.truth === 'human' ? `That was a real human. RUN OVER.` : `That was AI. RUN OVER.`}
				{/if}
			</p>
			<p class="text-[#8B949E] text-sm mt-1">
				{feedback.truth === 'human' ? `Written by ${feedback.label}` : `Generated by ${feedback.label}`}
			</p>
		</div>
	{:else}
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
		{#if submitError}
			<p class="mt-3 text-[#F85149] text-sm text-center animate-shake">{submitError}</p>
		{/if}
	{/if}

{:else if phase === 'dead'}
	<div class="card p-7 sm:p-10 text-center {newBest ? 'border-[#C3F73A]' : 'border-[#F8514940]'}">
		<p class="text-[10px] font-bold tracking-widest uppercase mb-3 {newBest ? 'text-[#C3F73A]' : 'text-[#F85149]'}">
			{newBest ? 'New personal best' : 'Run over'}
		</p>
		<p class="font-black tabular-nums leading-none mb-1 animate-pop text-white" style="font-size:72px">
			{streak}
		</p>
		<p class="text-[#6E7681] text-sm mb-5">survived</p>

		<div class="space-y-1.5 mb-7 text-sm">
			{#if !newBest && personalBest > 0}
				<p class="text-[#8B949E]">Personal best: <span class="text-white font-semibold">{personalBest}</span></p>
			{/if}
			{#if deathStats}
				{#if deathStats.beatPct !== null}
					<p class="text-[#8B949E]">You outlasted <span class="text-white font-semibold">{deathStats.beatPct}%</span> of today's runs</p>
				{/if}
				<p class="text-[#6E7681] text-xs">Today's best run: {deathStats.todayBest}</p>
			{/if}
		</div>

		<div class="flex flex-wrap justify-center gap-2">
			<button
				onclick={runItBack}
				disabled={waiting}
				class="rounded-xl bg-[#C3F73A] px-8 py-3.5 text-base font-black text-[#0D1117] hover:bg-[#D4F85C] transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50"
			>
				Run it back
			</button>
			<button
				onclick={share}
				class="rounded-xl border px-6 py-3.5 text-sm font-bold transition-all
				{copied ? 'border-[#3FB950] text-[#3FB950]' : 'border-[#30363D] text-[#8B949E] hover:text-white hover:border-[#8B949E]'}"
			>
				{copied ? 'Copied!' : 'Share'}
			</button>
		</div>
		<p class="mt-5">
			<a href="/" class="text-[#6E7681] hover:text-[#8B949E] text-xs transition-colors">← Back to the daily</a>
		</p>
	</div>
{/if}
