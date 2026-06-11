<script lang="ts">
	import type { SafeBattle, ModelName, RevealPayload, VoteChoice } from '$lib/types';
	import { MODEL_LABELS, MODEL_VERSION_LABELS, BATTLE_MODELS } from '$lib/types';
	import ModelButton from './ModelButton.svelte';

	let { battle }: { battle: SafeBattle } = $props();

	type Step = 'vote' | 'guess' | 'predict' | 'reveal';

	interface VoteHistoryEntry {
		date: string;
		battle_id: string;
		choice: VoteChoice;
		picked_model: ModelName | null;
		model_guess_correct: boolean | null;
		crowd_prediction_correct: boolean | null;
	}

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
		const dates = new Set(history.map((v) => v.date));
		let streak = 0;
		const d = new Date();
		while (true) {
			const ds = d.toISOString().slice(0, 10);
			if (dates.has(ds)) {
				streak++;
				d.setDate(d.getDate() - 1);
			} else {
				break;
			}
		}
		return streak;
	}

	function computeTitles(history: VoteHistoryEntry[]): string[] {
		const titles: string[] = [];
		const real = history.filter((v) => v.choice !== 'all_bad');
		const allBad = history.filter((v) => v.choice === 'all_bad');

		if (history.filter((v) => v.model_guess_correct === true).length >= 10)
			titles.push('🎯 Model Sniper');

		if (history.filter((v) => v.crowd_prediction_correct === true).length >= 7)
			titles.push('🔮 Crowd Reader');

		if (real.length >= 10) {
			const last10 = real.slice(-10).map((v) => v.picked_model).filter(Boolean);
			if (new Set(last10).size >= 4) titles.push('⚡ Bias Breaker');
		}

		if (allBad.length >= 5) titles.push('💀 All Bad Champion');

		if (real.length >= 10) {
			const counts: Record<string, number> = {};
			real.forEach((v) => {
				if (v.picked_model) counts[v.picked_model] = (counts[v.picked_model] ?? 0) + 1;
			});
			const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
			if (top && top[1] / real.length >= 0.7) {
				const loyalist: Record<string, string> = {
					claude: '👑 Claude Loyalist',
					chatgpt: '👑 ChatGPT Loyalist',
					gemini: '👑 Gemini Loyalist',
					grok: '👑 Grok Loyalist',
					perplexity: '👑 Perplexity Loyalist'
				};
				if (loyalist[top[0]]) titles.push(loyalist[top[0]]);
			}
		}

		return titles;
	}

	const STEPS: Step[] = ['vote', 'guess', 'predict', 'reveal'];

	// How many models does this battle have?
	const slotCount = $derived(battle.outputs.modelD ? 5 : 3);

	let step = $state<Step>('vote');
	let choice = $state<VoteChoice | null>(null);
	let modelGuess = $state<ModelName | null>(null);
	let crowdPrediction = $state<ModelName | null>(null);
	let revealData = $state<RevealPayload | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let fingerprint = $state('');
	let positionOrder = $state<VoteChoice[]>(['A', 'B', 'C']);
	let copied = $state(false);
	let expandedCards = $state<Set<string>>(new Set());
	let voteHistory = $state<VoteHistoryEntry[]>([]);
	let streak = $state(0);
	let titles = $state<string[]>([]);

	const stepIndex = $derived(STEPS.indexOf(step));

	$effect(() => {
		let fp = localStorage.getItem('gtm_fp');
		if (!fp) {
			fp = crypto.randomUUID();
			localStorage.setItem('gtm_fp', fp);
		}
		fingerprint = fp;

		// Deterministic position shuffle per visitor+battle
		const hash = [...(fp + battle.id)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
		const allSlots: VoteChoice[] = slotCount === 5 ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C'];
		positionOrder = seededShuffle(allSlots, hash);

		// Load vote history for streak + titles
		try {
			const raw = localStorage.getItem('gtm_history');
			const history: VoteHistoryEntry[] = raw ? JSON.parse(raw) : [];
			voteHistory = history;
			streak = computeStreak(history);
			titles = computeTitles(history);
		} catch {
			// ignore corrupt cache
		}

		// Replay cached vote
		const cached = localStorage.getItem(`gtm_vote_${battle.id}`);
		if (cached) {
			try {
				const parsed = JSON.parse(cached);
				revealData = parsed;
				choice = parsed.your_choice;
				modelGuess = parsed.model_guess;
				crowdPrediction = parsed.crowd_prediction;
				step = 'reveal';
			} catch {
				// ignore corrupt cache
			}
		}
	});

	function getOutput(key: VoteChoice): { text: string } {
		if (key === 'all_bad') return battle.outputs.modelA;
		return (battle.outputs as Record<string, { text: string }>)[`model${key}`] ?? battle.outputs.modelA;
	}

	function getModelName(key: VoteChoice): ModelName {
		if (!revealData || key === 'all_bad') return 'claude';
		const map: Record<string, ModelName | undefined> = {
			A: revealData.model_A_name,
			B: revealData.model_B_name,
			C: revealData.model_C_name,
			D: revealData.model_D_name,
			E: revealData.model_E_name
		};
		return map[key] ?? 'claude';
	}

	function getModelId(key: VoteChoice): string {
		if (!revealData || key === 'all_bad') return '';
		const map: Record<string, string | undefined> = {
			A: revealData.model_A_id,
			B: revealData.model_B_id,
			C: revealData.model_C_id,
			D: revealData.model_D_id,
			E: revealData.model_E_id
		};
		return map[key] ?? '';
	}

	function handleVote(position: number | 'all_bad') {
		choice = position === 'all_bad' ? 'all_bad' : (positionOrder[position] as VoteChoice);
		step = 'guess';
	}

	function handleGuess(model: ModelName) {
		modelGuess = model;
		step = 'predict';
	}

	function skipGuess() {
		step = 'predict';
	}

	function handlePredict(model: ModelName) {
		crowdPrediction = model;
		submitVote();
	}

	function skipPredict() {
		submitVote();
	}

	async function submitVote() {
		if (!choice || !fingerprint) return;
		loading = true;
		error = null;

		try {
			const res = await fetch('/api/vote', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					battle_id: battle.id,
					choice,
					model_guess: modelGuess,
					crowd_prediction: crowdPrediction,
					fingerprint
				})
			});

			const data = await res.json();
			if (!res.ok) throw new Error(data.error || 'Vote failed');

			revealData = data;
			localStorage.setItem(
				`gtm_vote_${battle.id}`,
				JSON.stringify({ ...data, model_guess: modelGuess, crowd_prediction: crowdPrediction })
			);

			// Save to vote history
			const today = new Date().toISOString().slice(0, 10);
			if (!voteHistory.some((h) => h.battle_id === battle.id)) {
				let picked_model: ModelName | null = null;
				if (choice !== 'all_bad') {
					const nameMap: Record<string, ModelName | undefined> = {
						A: data.model_A_name,
						B: data.model_B_name,
						C: data.model_C_name,
						D: data.model_D_name,
						E: data.model_E_name
					};
					picked_model = nameMap[choice] ?? null;
				}
				const entry: VoteHistoryEntry = {
					date: today,
					battle_id: battle.id,
					choice,
					picked_model,
					model_guess_correct: data.model_guess_correct,
					crowd_prediction_correct: data.crowd_prediction_correct
				};
				const newHistory = [...voteHistory, entry].slice(-90);
				voteHistory = newHistory;
				streak = computeStreak(newHistory);
				titles = computeTitles(newHistory);
				localStorage.setItem('gtm_history', JSON.stringify(newHistory));
			}

			step = 'reveal';
		} catch (e: unknown) {
			error = e instanceof Error ? e.message : 'Something went wrong';
			step = 'reveal';
		} finally {
			loading = false;
		}
	}

	function pct(n: number, total: number): number {
		if (total === 0) return 0;
		return Math.round((n / total) * 100);
	}

	function beatPercent(): number {
		if (!revealData) return 0;
		const { stats, your_choice } = revealData;
		if (your_choice === 'all_bad') return pct(stats.all_bad, stats.total);
		const counts: Record<string, number> = {
			A: stats.A, B: stats.B, C: stats.C, D: stats.D ?? 0, E: stats.E ?? 0
		};
		return pct(counts[your_choice] ?? 0, stats.total);
	}

	async function copyShareText() {
		if (!revealData) return;
		const { stats, model_A_name, model_B_name, model_C_name, model_D_name, model_E_name, your_choice } =
			revealData;

		let pickedLabel: string;
		if (your_choice === 'all_bad') {
			pickedLabel = 'None (all bad)';
		} else {
			pickedLabel = MODEL_LABELS[getModelName(your_choice)];
		}

		const guessLabel = modelGuess ? MODEL_LABELS[modelGuess] : 'skipped';
		const beat = beatPercent();

		const allParts = [
			{ label: MODEL_LABELS[model_A_name], v: pct(stats.A, stats.total) },
			{ label: MODEL_LABELS[model_B_name], v: pct(stats.B, stats.total) },
			{ label: MODEL_LABELS[model_C_name], v: pct(stats.C, stats.total) },
			...(model_D_name ? [{ label: MODEL_LABELS[model_D_name], v: pct(stats.D ?? 0, stats.total) }] : []),
			...(model_E_name ? [{ label: MODEL_LABELS[model_E_name], v: pct(stats.E ?? 0, stats.total) }] : [])
		];
		const parts = allParts.filter((p) => p.v > 0).map((p) => `${p.label} ${p.v}%`);

		const guessLine = modelGuess ? ` Guessed ${guessLabel}.` : '';
		const text = `I picked ${pickedLabel}.${guessLine} ${beat}% of voters agreed.\n[${parts.join(' · ')}]\nguessthemodel.com/battle/${battle.id}`;

		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function getChosenOutputText(): string {
		if (!choice || choice === 'all_bad') return '';
		return getOutput(choice).text;
	}

	function toggleExpand(slot: string) {
		const next = new Set(expandedCards);
		if (next.has(slot)) next.delete(slot);
		else next.add(slot);
		expandedCards = next;
	}

	function needsTruncation(text: string): boolean {
		return text.length > 350 || text.split('\n').length > 6;
	}

	function sharePartsStr(): string {
		if (!revealData) return '';
		const { stats, model_A_name, model_B_name, model_C_name, model_D_name, model_E_name } = revealData;
		return [
			{ label: MODEL_LABELS[model_A_name], v: pct(stats.A, stats.total) },
			{ label: MODEL_LABELS[model_B_name], v: pct(stats.B, stats.total) },
			{ label: MODEL_LABELS[model_C_name], v: pct(stats.C, stats.total) },
			...(model_D_name ? [{ label: MODEL_LABELS[model_D_name], v: pct(stats.D ?? 0, stats.total) }] : []),
			...(model_E_name ? [{ label: MODEL_LABELS[model_E_name], v: pct(stats.E ?? 0, stats.total) }] : [])
		].filter(p => p.v > 0).map(p => `${p.label} ${p.v}%`).join(' · ');
	}
</script>

<!-- Step progress dots -->
<div class="flex items-center gap-2 mb-6">
	{#each STEPS as s, i}
		<div
			class="h-1.5 rounded-full transition-all duration-300
			{i <= stepIndex ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}
			{i === stepIndex ? 'w-8' : 'w-4'}"
		></div>
	{/each}
</div>

{#if step === 'vote'}
	<!-- STEP 1: VOTE -->
	<div class="animate-fade-up">
		<div class="mb-6">
			<p class="label mb-2">The prompt</p>
			<p class="text-white text-base leading-relaxed bg-[#21262D] rounded-lg px-4 py-3 border border-[#30363D]">
				"{battle.prompt}"
			</p>
		</div>

		<div class="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-xs text-[#6E7681]">
			<span>Same prompt</span>
			<span>·</span>
			<span>Temp 0.7</span>
			<span>·</span>
			<span>Max 300 words</span>
			<span>·</span>
			<span>Order randomised</span>
		</div>

		<!-- Model outputs grid -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
			{#each Array.from({ length: slotCount }, (_, i) => i) as pos}
				{@const slot = positionOrder[pos]}
				{@const output = getOutput(slot)}
				{@const isExpanded = expandedCards.has(String(pos))}
				<div class="card p-4 flex flex-col">
					<p class="label mb-3">Model {String.fromCharCode(65 + pos)}</p>
					<p class="text-[#8B949E] text-sm leading-relaxed flex-1 whitespace-pre-wrap
						{isExpanded ? '' : 'line-clamp-5'}">
						{output.text}
					</p>
					{#if needsTruncation(output.text)}
						<button
							onclick={() => toggleExpand(String(pos))}
							class="mt-1 text-xs text-[#6E7681] hover:text-[#8B949E] transition-colors text-left"
						>
							{isExpanded ? '↑ Show less' : '↓ Read more'}
						</button>
					{/if}
					<button
						onclick={() => handleVote(pos)}
						class="mt-4 w-full rounded-lg border border-[#30363D] bg-[#21262D] px-4 py-2.5 text-sm font-medium text-white hover:border-[#C3F73A] hover:bg-[#C3F73A10] hover:text-[#C3F73A] transition-all"
					>
						Model {String.fromCharCode(65 + pos)} is best
					</button>
				</div>
			{/each}
		</div>

		<div class="flex justify-center">
			<button
				onclick={() => handleVote('all_bad')}
				class="rounded-lg border border-[#30363D] px-6 py-2 text-sm font-medium text-[#6E7681] hover:border-[#F85149] hover:text-[#F85149] transition-all"
			>
				All are bad
			</button>
		</div>
	</div>

{:else if step === 'guess'}
	<!-- STEP 2: GUESS THE MODEL -->
	<div class="animate-fade-up">
		{#if choice !== 'all_bad'}
			<div class="mb-6">
				<p class="label mb-2">Your pick</p>
				<p class="text-[#8B949E] text-sm leading-relaxed bg-[#21262D] rounded-lg px-4 py-3 border border-[#30363D] line-clamp-4">
					{getChosenOutputText()}
				</p>
			</div>
		{/if}

		<p class="text-white font-semibold text-base mb-1">Which AI wrote the output you picked?</p>
		<p class="text-[#8B949E] text-sm mb-5">Take a guess. You can skip.</p>

		<div class="flex flex-wrap gap-3 mb-6">
			{#each BATTLE_MODELS as model}
				<ModelButton {model} selected={modelGuess === model} onclick={() => handleGuess(model)} />
			{/each}
		</div>

		<button
			onclick={skipGuess}
			class="text-sm text-[#6E7681] hover:text-[#8B949E] transition-colors underline-offset-2 hover:underline"
		>
			Skip
		</button>
	</div>

{:else if step === 'predict'}
	<!-- STEP 3: PREDICT THE CROWD -->
	<div class="animate-fade-up">
		<p class="text-white font-semibold text-base mb-1">Who do you think most people will pick?</p>
		<p class="text-[#8B949E] text-sm mb-5">Predict the crowd vote. You can skip.</p>

		<div class="flex flex-wrap gap-3 mb-6">
			{#each BATTLE_MODELS as model}
				<ModelButton {model} selected={crowdPrediction === model} onclick={() => handlePredict(model)} />
			{/each}
		</div>

		{#if loading}
			<div class="flex items-center gap-2 text-[#8B949E] text-sm">
				<div class="h-4 w-4 rounded-full border-2 border-[#30363D] border-t-[#C3F73A] animate-spin"></div>
				Submitting vote...
			</div>
		{:else}
			<button
				onclick={skipPredict}
				class="text-sm text-[#6E7681] hover:text-[#8B949E] transition-colors underline-offset-2 hover:underline"
			>
				Skip
			</button>
		{/if}
	</div>

{:else if step === 'reveal'}
	<!-- STEP 4: REVEAL -->
	<div class="animate-fade-up">
		{#if loading}
			<div class="flex items-center justify-center gap-2 text-[#8B949E] py-12">
				<div class="h-5 w-5 rounded-full border-2 border-[#30363D] border-t-[#C3F73A] animate-spin"></div>
				<span class="text-sm">Loading results...</span>
			</div>
		{:else if error && !revealData}
			<div class="text-center py-8">
				<p class="text-[#F85149] text-sm">{error}</p>
			</div>
		{:else if revealData}
			{@const { stats, model_A_name, model_B_name, model_C_name, model_D_name, model_E_name, model_guess_correct, crowd_prediction_correct, insight } = revealData}
			{@const maxVotes = Math.max(stats.A, stats.B, stats.C, stats.D ?? 0, stats.E ?? 0)}

			<!-- Model cards in original display order -->
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
				{#each Array.from({ length: slotCount }, (_, i) => i) as pos}
					{@const key = positionOrder[pos]}
					{@const modelName = getModelName(key)}
					{@const modelId = getModelId(key)}
					{@const output = getOutput(key)}
					{@const isMyPick = choice === key}
					<div class="card p-4 {isMyPick ? 'border-[#3FB950]' : ''}">
						<div class="flex items-start justify-between mb-1 gap-2">
							<p class="label shrink-0">Model {String.fromCharCode(65 + pos)}</p>
							<div class="text-right">
								<span class="text-sm font-bold text-white">
									{MODEL_LABELS[modelName]}
									{#if isMyPick}
										<span class="ml-1 text-[#3FB950] text-xs">← your pick</span>
									{/if}
								</span>
								{#if MODEL_VERSION_LABELS[modelId]}
									<p class="text-[#6E7681] text-xs">{MODEL_VERSION_LABELS[modelId]}</p>
								{/if}
							</div>
						</div>
						<p class="text-[#8B949E] text-xs leading-relaxed whitespace-pre-wrap line-clamp-5 mt-2">
							{output.text}
						</p>
					</div>
				{/each}
			</div>

			<!-- Crowd vote breakdown -->
			<div class="card p-4 mb-4">
				<p class="label mb-3">Crowd vote</p>
				<div class="space-y-2">
					{#each [
						{ label: MODEL_LABELS[model_A_name], count: stats.A },
						{ label: MODEL_LABELS[model_B_name], count: stats.B },
						{ label: MODEL_LABELS[model_C_name], count: stats.C },
						...(model_D_name ? [{ label: MODEL_LABELS[model_D_name], count: stats.D ?? 0 }] : []),
						...(model_E_name ? [{ label: MODEL_LABELS[model_E_name], count: stats.E ?? 0 }] : []),
						{ label: 'All bad', count: stats.all_bad }
					] as row, i}
						{@const isWinner = i < slotCount && row.count === maxVotes && row.count > 0}
						<div class="flex items-center gap-3">
							<span class="text-sm text-[#8B949E] w-28 shrink-0">{row.label}</span>
							<div class="flex-1 h-2 bg-[#21262D] rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500 {isWinner ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"
									style="width:{pct(row.count, stats.total)}%"
								></div>
							</div>
							<span class="text-sm font-medium text-white w-10 text-right tabular-nums">
								{pct(row.count, stats.total)}%
							</span>
						</div>
					{/each}
				</div>
				<p class="text-[#6E7681] text-xs mt-3">{stats.total} vote{stats.total !== 1 ? 's' : ''}</p>
			</div>

			<!-- Scores -->
			<div class="flex flex-wrap gap-3 mb-4">
				{#if model_guess_correct !== null}
					<div class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm
						{model_guess_correct ? 'bg-[#3FB95015] border border-[#3FB950] text-[#3FB950]' : 'bg-[#30363D] border border-[#30363D] text-[#6E7681]'}">
						{model_guess_correct ? '✓' : '—'}
						Model guess {model_guess_correct ? 'correct' : 'wrong'}
					</div>
				{/if}
				{#if crowd_prediction_correct !== null}
					<div class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm
						{crowd_prediction_correct ? 'bg-[#3FB95015] border border-[#3FB950] text-[#3FB950]' : 'bg-[#30363D] border border-[#30363D] text-[#6E7681]'}">
						{crowd_prediction_correct ? '✓' : '—'}
						Crowd prediction {crowd_prediction_correct ? 'correct' : 'wrong'}
					</div>
				{/if}
			</div>

			<!-- Streak + titles -->
			{#if streak > 0}
				<div class="flex items-center gap-2 text-sm mb-3">
					<span class="text-[#C3F73A] font-medium">🔥 {streak}-day streak</span>
				</div>
			{/if}
			{#if titles.length > 0}
				<div class="flex flex-wrap gap-2 mb-4">
					{#each titles as title}
						<span class="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-[#C3F73A15] border border-[#C3F73A40] text-[#C3F73A]">
							{title}
						</span>
					{/each}
				</div>
			{/if}

			{#if insight}
				<p class="text-[#8B949E] text-sm mb-5 italic">"{insight}"</p>
			{/if}

			<!-- Share card -->
			<div class="card p-4 mb-4 bg-[#21262D]">
				<p class="label mb-2">Share your result</p>
				<div class="font-mono text-sm text-[#C3F73A] leading-relaxed">
					{#if choice !== 'all_bad' && choice !== null}
						I picked {MODEL_LABELS[getModelName(choice)]}.{modelGuess ? ` Guessed ${MODEL_LABELS[modelGuess]}.` : ''} {beatPercent()}% of voters agreed.
					{:else}
						I said all were bad. {beatPercent()}% of voters agreed.
					{/if}
					<br />
					[{sharePartsStr()}]
					<br />
					guessthemodel.com/battle/{battle.id}
				</div>
				<button
					onclick={copyShareText}
					class="mt-3 rounded-md border border-[#30363D] px-3 py-1.5 text-xs font-medium transition-all
					{copied ? 'border-[#3FB950] text-[#3FB950]' : 'text-[#8B949E] hover:text-white hover:border-[#8B949E]'}"
				>
					{copied ? 'Copied' : 'Copy result'}
				</button>
			</div>

			<a
				href="/"
				class="inline-flex items-center gap-2 rounded-lg bg-[#C3F73A] px-5 py-2.5 text-sm font-bold text-[#0D1117] hover:bg-[#A8D428] transition-colors"
			>
				Next battle →
			</a>
		{/if}
	</div>
{/if}
