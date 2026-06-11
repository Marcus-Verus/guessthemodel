<script lang="ts">
	import type { SafeBattle, ModelName, RevealPayload, VoteChoice } from '$lib/types';
	import { MODEL_LABELS, BATTLE_MODELS } from '$lib/types';
	import ModelButton from './ModelButton.svelte';

	let { battle }: { battle: SafeBattle } = $props();

	type Step = 'vote' | 'guess' | 'predict' | 'reveal';

	// Six permutations of [A, B, C] — chosen by hash so each visitor sees a different order
	const ORDERINGS: VoteChoice[][] = [
		['A', 'B', 'C'],
		['A', 'C', 'B'],
		['B', 'A', 'C'],
		['B', 'C', 'A'],
		['C', 'A', 'B'],
		['C', 'B', 'A']
	];

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

	$effect(() => {
		let fp = localStorage.getItem('gtm_fp');
		if (!fp) {
			fp = crypto.randomUUID();
			localStorage.setItem('gtm_fp', fp);
		}
		fingerprint = fp;

		// Deterministic position shuffle per visitor+battle
		const hash = [...(fp + battle.id)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
		positionOrder = ORDERINGS[hash % 6];

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

	function getOutput(key: VoteChoice) {
		if (key === 'all_bad') return battle.outputs.modelA; // never called for all_bad
		return battle.outputs[`model${key}` as 'modelA' | 'modelB' | 'modelC'];
	}

	function getModelName(key: VoteChoice): ModelName {
		if (!revealData || key === 'all_bad') return 'claude';
		if (key === 'A') return revealData.model_A_name;
		if (key === 'B') return revealData.model_B_name;
		return revealData.model_C_name;
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
		const myVotes = your_choice === 'A' ? stats.A : your_choice === 'B' ? stats.B : stats.C;
		return pct(myVotes, stats.total);
	}

	async function copyShareText() {
		if (!revealData) return;
		const { stats, model_A_name, model_B_name, model_C_name, your_choice } = revealData;

		let pickedLabel: string;
		if (your_choice === 'all_bad') {
			pickedLabel = 'None (all bad)';
		} else if (your_choice === 'A') {
			pickedLabel = MODEL_LABELS[model_A_name];
		} else if (your_choice === 'B') {
			pickedLabel = MODEL_LABELS[model_B_name];
		} else {
			pickedLabel = MODEL_LABELS[model_C_name];
		}

		const guessLabel = modelGuess ? MODEL_LABELS[modelGuess] : 'skipped';
		const beat = beatPercent();

		const text = `I picked ${pickedLabel}. Thought it was ${guessLabel}. Beat ${beat}% of voters.\n[${MODEL_LABELS[model_A_name]} ${pct(stats.A, stats.total)}% · ${MODEL_LABELS[model_B_name]} ${pct(stats.B, stats.total)}% · ${MODEL_LABELS[model_C_name]} ${pct(stats.C, stats.total)}%]\nguessthemodel.com`;

		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function getChosenOutputText(): string {
		if (!choice || choice === 'all_bad') return '';
		return getOutput(choice).text;
	}

	const STEPS: Step[] = ['vote', 'guess', 'predict', 'reveal'];
	const stepIndex = $derived(STEPS.indexOf(step));
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
			<span>Max 200 words</span>
			<span>·</span>
			<span>Order randomised</span>
		</div>

		<!-- Three outputs -->
		<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			{#each [0, 1, 2] as pos}
				{@const output = getOutput(positionOrder[pos])}
				<div class="card p-4 flex flex-col">
					<p class="label mb-3">Model {String.fromCharCode(65 + pos)}</p>
					<p class="text-[#8B949E] text-sm leading-relaxed flex-1 whitespace-pre-wrap">{output.text}</p>
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
			{@const { stats, model_A_name, model_B_name, model_C_name, model_guess_correct, crowd_prediction_correct, insight } = revealData}

			<!-- Three model cards in display order -->
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				{#each [0, 1, 2] as pos}
					{@const key = positionOrder[pos]}
					{@const modelName = getModelName(key)}
					{@const output = getOutput(key)}
					{@const isMyPick = choice === key}
					<div class="card p-4 {isMyPick ? 'border-[#3FB950]' : ''}">
						<div class="flex items-center justify-between mb-3">
							<p class="label">Model {String.fromCharCode(65 + pos)}</p>
							<span class="text-sm font-bold text-white">
								{MODEL_LABELS[modelName]}
								{#if isMyPick}
									<span class="ml-1 text-[#3FB950] text-xs">← your pick</span>
								{/if}
							</span>
						</div>
						<p class="text-[#8B949E] text-xs leading-relaxed whitespace-pre-wrap line-clamp-6">
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
						{ label: 'All bad', count: stats.all_bad }
					] as row, i}
						{@const isWinner = i < 3 && row.count === Math.max(stats.A, stats.B, stats.C) && row.count > 0}
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
						{model_guess_correct ? 'bg-[#3FB95015] border border-[#3FB950] text-[#3FB950]' : 'bg-[#F8514915] border border-[#F85149] text-[#F85149]'}">
						{model_guess_correct ? '✓' : '✗'}
						Model guess {model_guess_correct ? 'correct' : 'wrong'}
					</div>
				{/if}
				{#if crowd_prediction_correct !== null}
					<div class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm
						{crowd_prediction_correct ? 'bg-[#3FB95015] border border-[#3FB950] text-[#3FB950]' : 'bg-[#F8514915] border border-[#F85149] text-[#F85149]'}">
						{crowd_prediction_correct ? '✓' : '✗'}
						Crowd prediction {crowd_prediction_correct ? 'correct' : 'wrong'}
					</div>
				{/if}
			</div>

			{#if insight}
				<p class="text-[#8B949E] text-sm mb-5 italic">"{insight}"</p>
			{/if}

			<!-- Share card -->
			<div class="card p-4 mb-4 bg-[#21262D]">
				<p class="label mb-2">Share your result</p>
				<div class="font-mono text-sm text-[#C3F73A] leading-relaxed">
					{#if choice !== 'all_bad' && choice !== null}
						I picked {MODEL_LABELS[getModelName(choice)]}.
						Thought it was {modelGuess ? MODEL_LABELS[modelGuess] : 'unknown'}.
						Beat {beatPercent()}% of voters.
					{:else}
						I said all were bad. Beat {beatPercent()}% of voters.
					{/if}
					<br />
					[{MODEL_LABELS[model_A_name]} {pct(stats.A, stats.total)}% · {MODEL_LABELS[model_B_name]} {pct(stats.B, stats.total)}% · {MODEL_LABELS[model_C_name]} {pct(stats.C, stats.total)}%]
					<br />
					guessthemodel.com
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
