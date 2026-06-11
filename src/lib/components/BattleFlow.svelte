<script lang="ts">
	import type { SafeBattle, ModelName, RevealPayload, Slot, GuessMap } from '$lib/types';
	import { MODEL_LABELS, MODEL_VERSION_LABELS, BATTLE_MODELS, ALL_SLOTS } from '$lib/types';
	import type { GameRecord } from '$lib/game';
	import { loadHistory, recordGame, computeStreaks, scoreTitle, buildShareText } from '$lib/game';
	import ModelLogo from './ModelLogo.svelte';
	import Confetti from './Confetti.svelte';
	import Countdown from './Countdown.svelte';
	import StatsModal from './StatsModal.svelte';

	let { battle, battleNumber = 0 }: { battle: SafeBattle; battleNumber?: number } = $props();

	// ── game state ───────────────────────────────────────────────

	const slots = $derived(
		ALL_SLOTS.filter((s) => (battle.outputs as Record<string, unknown>)[`model${s}`])
	);

	let guesses = $state<GuessMap>({});
	let favorite = $state<Slot | null>(null);
	let loading = $state(false);
	let submitError = $state('');

	let revealData = $state<RevealPayload | null>(null);
	let revealedCards = $state(0);
	let showPanel = $state(false);
	let showConfetti = $state(false);
	let displayScore = $state(0);

	let expanded = $state<Partial<Record<Slot, boolean>>>({});
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

	const allTagged = $derived(slots.every((s) => guesses[s]));
	const taggedCount = $derived(slots.filter((s) => guesses[s]).length);
	const canLock = $derived(allTagged && favorite !== null && !loading);
	const revealed = $derived(revealData !== null);

	// ── init ─────────────────────────────────────────────────────

	$effect(() => {
		let fp = localStorage.getItem('gtm_fp');
		if (!fp) {
			fp = crypto.randomUUID();
			localStorage.setItem('gtm_fp', fp);
		}
		fingerprint = fp;

		alreadySubscribed = !!localStorage.getItem('gtm_subscribed');
		history = loadHistory();
		streak = computeStreaks(history).current;

		// already played this battle? restore the reveal without ceremony
		const cached = localStorage.getItem(`gtm_v2_vote_${battle.id}`);
		if (cached) {
			try {
				const p: RevealPayload = JSON.parse(cached);
				revealData = p;
				guesses = p.your_guesses;
				favorite = p.your_favorite;
				revealedCards = slots.length;
				displayScore = p.score;
				showPanel = true;
			} catch {
				/* ignore */
			}
		}
	});

	// ── tagging ──────────────────────────────────────────────────

	function tag(slot: Slot, model: ModelName) {
		if (revealed || loading) return;
		const next: GuessMap = { ...guesses };
		// a model can only be used once — steal it from wherever it was
		for (const s of slots) {
			if (next[s] === model) delete next[s];
		}
		next[slot] = model;
		guesses = next;
	}

	function usedElsewhere(slot: Slot, model: ModelName): boolean {
		return slots.some((s) => s !== slot && guesses[s] === model);
	}

	// ── submit + cinematic reveal ────────────────────────────────

	async function lockIn() {
		if (!canLock || revealed) return;
		loading = true;
		submitError = '';

		try {
			const res = await fetch('/api/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ battle_id: battle.id, fingerprint, favorite, guesses })
			});
			const data: RevealPayload = await res.json();
			if (!res.ok) throw new Error((data as unknown as { message?: string }).message || 'Something broke');

			localStorage.setItem(`gtm_v2_vote_${battle.id}`, JSON.stringify(data));

			const today = new Date().toISOString().slice(0, 10);
			history = recordGame({ date: today, battle_id: battle.id, score: data.score, out_of: data.out_of });
			streak = computeStreaks(history).current;

			playReveal(data);
		} catch (e) {
			submitError = e instanceof Error ? e.message : 'Something broke — try again.';
			loading = false;
		}
	}

	function playReveal(data: RevealPayload) {
		revealData = data;
		// the server is the source of truth — if this fingerprint already voted
		// (another tab, another day), reflect the original submission
		guesses = data.your_guesses;
		favorite = data.your_favorite;
		const stagger = 500;
		slots.forEach((_, i) => {
			setTimeout(() => (revealedCards = i + 1), 300 + i * stagger);
		});
		setTimeout(() => {
			loading = false;
			showPanel = true;
			panelEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			if (data.score > 0) {
				let c = 0;
				const iv = setInterval(() => {
					c++;
					displayScore = Math.min(c, data.score);
					if (c >= data.score) clearInterval(iv);
				}, 160);
			}
			if (data.score === data.out_of) showConfetti = true;
		}, 300 + slots.length * stagger + 350);
	}

	// ── reveal helpers ───────────────────────────────────────────

	const correctBySlot = $derived.by(() => {
		const map: Partial<Record<Slot, boolean>> = {};
		if (!revealData) return map;
		for (const s of slots) map[s] = revealData.your_guesses[s] === revealData.truth[s]?.name;
		return map;
	});

	const correctArray = $derived(slots.map((s) => correctBySlot[s] ?? false));

	const crowdFavoriteSlot = $derived.by(() => {
		if (!revealData) return null;
		const entries = Object.entries(revealData.crowd.fav) as [Slot, number][];
		if (entries.length === 0) return null;
		return entries.sort((a, b) => b[1] - a[1])[0][0];
	});

	function favPct(slot: Slot): number {
		if (!revealData || revealData.crowd.players === 0) return 0;
		return Math.round(((revealData.crowd.fav[slot] ?? 0) / revealData.crowd.players) * 100);
	}

	const beatPct = $derived.by(() => {
		if (!revealData) return null;
		const { score_dist, scored_players } = revealData.crowd;
		if (scored_players < 5) return null;
		const beaten = score_dist.slice(0, revealData.score).reduce((a, b) => a + b, 0);
		return Math.round((beaten / scored_players) * 100);
	});

	const oddsLine = $derived.by(() => {
		if (!revealData) return '';
		const { score, out_of } = revealData;
		if (score === out_of && out_of === 5) return 'Random tagging hits 5/5 once every 120 tries.';
		if (score === out_of && out_of === 3) return 'Random tagging gets this right once every 6 tries.';
		if (score === 0) return 'The models are officially indistinguishable to you. Most players land here.';
		return '';
	});

	const title = $derived(revealData ? scoreTitle(revealData.score, revealData.out_of) : '');

	// ── share ────────────────────────────────────────────────────

	async function share() {
		if (!revealData) return;
		const text = buildShareText({
			battleNumber,
			score: revealData.score,
			outOf: revealData.out_of,
			correct: correctArray,
			streak
		});
		if (navigator.share) {
			try {
				await navigator.share({ text });
				return;
			} catch {
				/* user cancelled — fall through to clipboard */
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

	function truncateWords(text: string, max: number): string {
		const words = text.trim().split(/\s+/);
		return words.length <= max ? text : words.slice(0, max).join(' ') + '…';
	}
</script>

{#if showConfetti}
	<Confetti />
{/if}

<StatsModal bind:open={statsOpen} {history} />

<div class={revealed ? '' : 'pb-24'}>

	<!-- ══ PROMPT ══════════════════════════════════════════════ -->
	<p class="text-white font-semibold text-base mb-1">
		{slots.length} answers. {slots.length} AIs. Tag who wrote what.
	</p>
	<div class="rounded-lg bg-[#21262D] border border-[#30363D] px-4 py-3 mb-2 text-sm text-[#E6EDF3] leading-relaxed">
		"{battle.prompt}"
	</div>
	{#if !revealed}
		<p class="text-[#6E7681] text-xs mb-5">
			Same lineup, same order, for everyone today. Each model is used exactly once — star the best answer, then lock in.
		</p>
	{:else}
		<div class="mb-5"></div>
	{/if}

	<!-- ══ RESPONSE CARDS ═══════════════════════════════════════ -->
	<div class="space-y-3">
		{#each slots as slot, i}
			{@const output = (battle.outputs as Record<string, { text: string }>)[`model${slot}`]}
			{@const isExpanded = expanded[slot] ?? false}
			{@const wordsLong = output.text.trim().split(/\s+/).length > 70}
			{@const isRevealed = revealedCards > i && revealData}
			{@const truth = revealData?.truth[slot]}
			{@const wasCorrect = correctBySlot[slot] ?? false}
			{@const isCrowdFav = crowdFavoriteSlot === slot && (revealData?.crowd.players ?? 0) > 0}

			<div
				class="card p-4 transition-all duration-300
				{isRevealed ? (wasCorrect ? 'border-[#C3F73A66]' : 'border-[#F8514940]') : ''}"
			>
				<!-- Card header -->
				<div class="flex items-center justify-between mb-2">
					<span class="text-[#6E7681] text-[10px] font-bold tracking-widest uppercase">Response {i + 1}</span>
					{#if !revealed}
						<button
							onclick={() => (favorite = favorite === slot ? null : slot)}
							class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border transition-all
							{favorite === slot
								? 'border-[#C3F73A] bg-[#C3F73A15] text-[#C3F73A]'
								: 'border-[#30363D] text-[#6E7681] hover:text-[#8B949E] hover:border-[#8B949E]'}"
							aria-pressed={favorite === slot}
						>
							<svg width="11" height="11" viewBox="0 0 24 24" fill={favorite === slot ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2">
								<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
							</svg>
							Best answer
						</button>
					{:else if revealData && favorite === slot}
						<span class="text-[10px] font-bold text-[#C3F73A] tracking-widest uppercase">Your favorite</span>
					{/if}
				</div>

				<!-- Identity reveal (flips in one card at a time) -->
				{#if isRevealed && truth}
					<div class="animate-flip-in rounded-lg px-3 py-2.5 mb-3 flex items-center justify-between gap-2
						{wasCorrect ? 'bg-[#C3F73A10] border border-[#C3F73A40]' : 'bg-[#F8514908] border border-[#F8514930]'}">
						<div class="flex items-center gap-2.5 min-w-0">
							<ModelLogo model={truth.name} size="md" />
							<div class="min-w-0">
								<p class="text-white text-sm font-bold leading-tight">{MODEL_LABELS[truth.name]}</p>
								{#if MODEL_VERSION_LABELS[truth.model_id]}
									<p class="text-[#6E7681] text-[10px]">{MODEL_VERSION_LABELS[truth.model_id]}</p>
								{/if}
							</div>
						</div>
						<div class="text-right shrink-0">
							{#if wasCorrect}
								<p class="text-[#C3F73A] text-xs font-bold">✓ You got it</p>
							{:else}
								<p class="text-[#F85149] text-xs font-bold">✗ You said {revealData ? MODEL_LABELS[revealData.your_guesses[slot] ?? 'claude'] : ''}</p>
							{/if}
							{#if (revealData?.crowd.players ?? 0) > 0}
								<p class="text-[#6E7681] text-[10px] mt-0.5">
									{favPct(slot)}% favorited{isCrowdFav ? ' · crowd favorite' : ''}
								</p>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Response text -->
				<p class="text-[#8B949E] text-sm leading-relaxed whitespace-pre-wrap {isExpanded ? '' : 'line-clamp-5'}">
					{isExpanded ? output.text : truncateWords(output.text, 70)}
				</p>
				{#if wordsLong}
					<button
						onclick={() => (expanded = { ...expanded, [slot]: !isExpanded })}
						class="mt-1.5 text-xs text-[#6E7681] hover:text-[#8B949E] transition-colors"
					>
						{isExpanded ? '↑ Less' : '↓ Read full answer'}
					</button>
				{/if}

				<!-- Tag chips (pre-reveal) -->
				{#if !revealed}
					<div class="mt-3.5 pt-3 border-t border-[#21262D]">
						<div class="flex items-center justify-between gap-3 flex-wrap">
							<div class="flex items-center gap-1.5">
								{#each BATTLE_MODELS as model}
									{@const here = guesses[slot] === model}
									{@const elsewhere = usedElsewhere(slot, model)}
									<button
										onclick={() => tag(slot, model)}
										disabled={loading}
										title={MODEL_LABELS[model]}
										aria-label="Tag as {MODEL_LABELS[model]}"
										aria-pressed={here}
										class="rounded-lg p-1.5 border transition-all
										{here
											? 'border-[#C3F73A] bg-[#C3F73A12] scale-110'
											: elsewhere
												? 'border-transparent opacity-30 hover:opacity-60'
												: 'border-[#30363D] hover:border-[#8B949E] hover:scale-105'}"
									>
										<ModelLogo {model} size="sm" />
									</button>
								{/each}
							</div>
							<span class="text-xs {guesses[slot] ? 'text-[#C3F73A] font-medium' : 'text-[#6E7681]'}">
								{guesses[slot] ? MODEL_LABELS[guesses[slot]!] : 'Who wrote this?'}
							</span>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- ══ STICKY LOCK BAR (pre-reveal) ══════════════════════════ -->
	{#if !revealed}
		<div class="fixed bottom-0 inset-x-0 z-40 border-t border-[#30363D]" style="background:#0D1117f2;backdrop-filter:blur(12px)">
			<div class="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
				<div class="min-w-0">
					<p class="text-white text-sm font-semibold tabular-nums">
						{taggedCount}/{slots.length} tagged
					</p>
					<p class="text-[#6E7681] text-xs truncate">
						{#if !allTagged}
							Tag every response with a different AI
						{:else if favorite === null}
							Now star the best answer
						{:else}
							Ready — no take-backs
						{/if}
					</p>
				</div>
				<button
					onclick={lockIn}
					disabled={!canLock}
					class="shrink-0 rounded-lg px-6 py-3 text-sm font-bold transition-all
					{canLock
						? 'bg-[#C3F73A] text-[#0D1117] hover:bg-[#D4F85C] animate-glow'
						: 'bg-[#21262D] text-[#6E7681] cursor-not-allowed'}"
				>
					{#if loading}
						<span class="flex items-center gap-2">
							<span class="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin"></span>
							Revealing…
						</span>
					{:else}
						Lock it in
					{/if}
				</button>
			</div>
		</div>
		{#if submitError}
			<p class="mt-4 text-[#F85149] text-sm animate-shake">{submitError} <button onclick={lockIn} class="underline underline-offset-2 hover:text-white transition-colors">Retry</button></p>
		{/if}
	{/if}

	<!-- ══ RESULT PANEL ══════════════════════════════════════════ -->
	{#if showPanel && revealData}
		<div bind:this={panelEl} class="mt-6 animate-fade-up">
			<div class="card p-6 sm:p-8 text-center relative overflow-hidden
				{revealData.score === revealData.out_of ? 'border-[#C3F73A]' : ''}">

				<p class="label mb-3">{battleNumber ? `Battle #${battleNumber}` : 'Result'}</p>

				<p class="font-black tabular-nums leading-none mb-2 animate-pop
					{revealData.score === revealData.out_of ? 'text-[#C3F73A]' : 'text-white'}"
					style="font-size:64px">
					{displayScore}<span class="text-[#6E7681] text-3xl font-bold">/{revealData.out_of}</span>
				</p>

				<p class="text-lg font-bold mb-4 {revealData.score === revealData.out_of ? 'text-[#C3F73A]' : revealData.score === 0 ? 'text-[#F85149]' : 'text-white'}">
					{title}
				</p>

				<!-- Result grid (screenshot bait) -->
				<div class="flex justify-center gap-1.5 mb-5">
					{#each correctArray as c}
						<div class="h-8 w-8 rounded-md {c ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"></div>
					{/each}
				</div>

				<!-- Context lines -->
				<div class="space-y-1.5 mb-6 text-sm">
					{#if beatPct !== null}
						<p class="text-[#8B949E]">You beat <span class="text-white font-semibold">{beatPct}%</span> of today's players</p>
					{/if}
					{#if oddsLine}
						<p class="text-[#6E7681] text-xs">{oddsLine}</p>
					{/if}
					{#if crowdFavoriteSlot && revealData.crowd.players > 1}
						{@const cf = revealData.truth[crowdFavoriteSlot]}
						{#if cf}
							<p class="text-[#8B949E]">
								Crowd's favorite answer: <span class="text-white font-semibold">{MODEL_LABELS[cf.name]}</span> ({favPct(crowdFavoriteSlot)}%)
								{#if favorite === crowdFavoriteSlot}
									— you agreed
								{:else if favorite && revealData.truth[favorite]}
									— you picked {MODEL_LABELS[revealData.truth[favorite]!.name]}
								{/if}
							</p>
						{/if}
					{/if}
					{#if streak >= 2}
						<p class="text-[#C3F73A] font-medium">{streak}-day streak{streak >= 7 ? ' · on fire' : ''}{streak >= 30 ? ' · legendary' : ''}</p>
					{/if}
				</div>

				<!-- Actions -->
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
</div>
