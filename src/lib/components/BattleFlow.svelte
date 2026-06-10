<script lang="ts">
	import type { SafeBattle, ModelName, RevealPayload } from '$lib/types';
	import { MODEL_LABELS, CATEGORY_LABELS } from '$lib/types';
	import ModelButton from './ModelButton.svelte';

	let { battle }: { battle: SafeBattle } = $props();

	type Step = 'vote' | 'guess' | 'predict' | 'reveal';

	let step = $state<Step>('vote');
	let choice = $state<'A' | 'B' | 'both_bad' | null>(null);
	let modelGuess = $state<ModelName | null>(null);
	let crowdPrediction = $state<ModelName | null>(null);
	let revealData = $state<RevealPayload | null>(null);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let fingerprint = $state('');
	let swap = $state(false);
	let copied = $state(false);

	const MODELS: ModelName[] = ['chatgpt', 'claude', 'gemini', 'grok', 'perplexity'];

	$effect(() => {
		let fp = localStorage.getItem('gtm_fp');
		if (!fp) {
			fp = crypto.randomUUID();
			localStorage.setItem('gtm_fp', fp);
		}
		fingerprint = fp;

		// Deterministic position swap per visitor+battle
		const hash = [...(fp + battle.id)].reduce((acc, c) => acc + c.charCodeAt(0), 0);
		swap = hash % 2 === 0;

		// Check if already voted
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

	// Accounts for visual swap
	const leftOutput = $derived(swap ? battle.outputs.modelB : battle.outputs.modelA);
	const rightOutput = $derived(swap ? battle.outputs.modelA : battle.outputs.modelB);

	function handleVote(position: 'left' | 'right' | 'both_bad') {
		if (position === 'both_bad') {
			choice = 'both_bad';
		} else if (position === 'left') {
			choice = swap ? 'B' : 'A';
		} else {
			choice = swap ? 'A' : 'B';
		}
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
			step = 'reveal'; // show error on reveal step
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
		if (your_choice === 'both_bad') return pct(stats.both_bad, stats.total);
		const myVotes = your_choice === 'A' ? stats.A : stats.B;
		return pct(myVotes, stats.total);
	}

	async function copyShareText() {
		if (!revealData) return;
		const { stats, model_A_name, model_B_name, your_choice } = revealData;
		const pickedModel =
			your_choice === 'A'
				? MODEL_LABELS[model_A_name]
				: your_choice === 'B'
					? MODEL_LABELS[model_B_name]
					: 'Neither';
		const guessLabel = modelGuess ? MODEL_LABELS[modelGuess] : 'skipped';
		const beat = beatPercent();

		const text = `I picked ${pickedModel}. Thought it was ${guessLabel}. Beat ${beat}% of voters.\n[${MODEL_LABELS[model_A_name]} ${pct(stats.A, stats.total)}% · ${MODEL_LABELS[model_B_name]} ${pct(stats.B, stats.total)}% · Both bad ${pct(stats.both_bad, stats.total)}%]\nguessthemodel.com`;

		await navigator.clipboard.writeText(text);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	const STEPS: Step[] = ['vote', 'guess', 'predict', 'reveal'];
	const stepIndex = $derived(STEPS.indexOf(step));

	function getChosenOutputText(): string {
		if (!choice || choice === 'both_bad') return '';
		return choice === 'A' ? battle.outputs.modelA.text : battle.outputs.modelB.text;
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
		<!-- Prompt -->
		<div class="mb-6">
			<p class="label mb-2">The prompt</p>
			<p class="text-white text-base leading-relaxed bg-[#21262D] rounded-lg px-4 py-3 border border-[#30363D]">
				"{battle.prompt}"
			</p>
		</div>

		<!-- Methodology bar -->
		<div class="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-xs text-[#6E7681]">
			<span>Same prompt</span>
			<span>·</span>
			<span>Temp 0.7</span>
			<span>·</span>
			<span>Max 200 words</span>
			<span>·</span>
			<span>Position randomised</span>
		</div>

		<!-- Outputs side by side -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
			<div class="card p-4 flex flex-col">
				<p class="label mb-3">Model A</p>
				<p class="text-[#8B949E] text-sm leading-relaxed flex-1 whitespace-pre-wrap">{leftOutput.text}</p>
				<button
					onclick={() => handleVote('left')}
					class="mt-4 w-full rounded-lg border border-[#30363D] bg-[#21262D] px-4 py-2.5 text-sm font-medium text-white hover:border-[#C3F73A] hover:bg-[#C3F73A10] hover:text-[#C3F73A] transition-all"
				>
					Model A is better
				</button>
			</div>

			<div class="card p-4 flex flex-col">
				<p class="label mb-3">Model B</p>
				<p class="text-[#8B949E] text-sm leading-relaxed flex-1 whitespace-pre-wrap">{rightOutput.text}</p>
				<button
					onclick={() => handleVote('right')}
					class="mt-4 w-full rounded-lg border border-[#30363D] bg-[#21262D] px-4 py-2.5 text-sm font-medium text-white hover:border-[#C3F73A] hover:bg-[#C3F73A10] hover:text-[#C3F73A] transition-all"
				>
					Model B is better
				</button>
			</div>
		</div>

		<!-- Both bad -->
		<div class="flex justify-center">
			<button
				onclick={() => handleVote('both_bad')}
				class="rounded-lg border border-[#30363D] px-6 py-2 text-sm font-medium text-[#6E7681] hover:border-[#F85149] hover:text-[#F85149] transition-all"
			>
				Both are bad
			</button>
		</div>
	</div>
{:else if step === 'guess'}
	<!-- STEP 2: GUESS THE MODEL -->
	<div class="animate-fade-up">
		{#if choice !== 'both_bad'}
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
			{#each MODELS as model}
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
			{#each MODELS as model}
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
			{@const { stats, model_A_name, model_B_name, model_guess_correct, crowd_prediction_correct, insight } = revealData}

			<!-- Model reveal -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<!-- Model A card -->
				<div class="card p-4 {choice === 'A' ? 'border-[#3FB950]' : ''}">
					<div class="flex items-center justify-between mb-3">
						<p class="label">Model A</p>
						<span class="text-sm font-bold text-white">
							{MODEL_LABELS[swap ? model_B_name : model_A_name]}
							{#if choice === 'A'}
								<span class="ml-1 text-[#3FB950]">← your pick</span>
							{/if}
						</span>
					</div>
					<p class="text-[#8B949E] text-xs leading-relaxed whitespace-pre-wrap line-clamp-6">
						{leftOutput.text}
					</p>
				</div>

				<!-- Model B card -->
				<div class="card p-4 {choice === 'B' ? 'border-[#3FB950]' : ''}">
					<div class="flex items-center justify-between mb-3">
						<p class="label">Model B</p>
						<span class="text-sm font-bold text-white">
							{MODEL_LABELS[swap ? model_A_name : model_B_name]}
							{#if choice === 'B'}
								<span class="ml-1 text-[#3FB950]">← your pick</span>
							{/if}
						</span>
					</div>
					<p class="text-[#8B949E] text-xs leading-relaxed whitespace-pre-wrap line-clamp-6">
						{rightOutput.text}
					</p>
				</div>
			</div>

			<!-- Crowd vote breakdown -->
			<div class="card p-4 mb-4">
				<p class="label mb-3">Crowd vote</p>
				<div class="space-y-2">
					{#each [
						{ label: MODEL_LABELS[model_A_name], count: stats.A, isWinner: stats.A >= stats.B && stats.A >= stats.both_bad },
						{ label: MODEL_LABELS[model_B_name], count: stats.B, isWinner: stats.B > stats.A && stats.B >= stats.both_bad },
						{ label: 'Both bad', count: stats.both_bad, isWinner: false }
					] as row}
						<div class="flex items-center gap-3">
							<span class="text-sm text-[#8B949E] w-28 shrink-0">{row.label}</span>
							<div class="flex-1 h-2 bg-[#21262D] rounded-full overflow-hidden">
								<div
									class="h-full rounded-full transition-all duration-500
									{row.isWinner ? 'bg-[#C3F73A]' : 'bg-[#30363D]'}"
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

			<!-- Your scores -->
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

			<!-- Insight -->
			{#if insight}
				<p class="text-[#8B949E] text-sm mb-5 italic">"{insight}"</p>
			{/if}

			<!-- Share card -->
			<div class="card p-4 mb-4 bg-[#21262D]">
				<p class="label mb-2">Share your result</p>
				<div class="font-mono text-sm text-[#C3F73A] leading-relaxed">
					{#if choice !== 'both_bad'}
						I picked {choice === 'A' ? MODEL_LABELS[model_A_name] : MODEL_LABELS[model_B_name]}.
						Thought it was {modelGuess ? MODEL_LABELS[modelGuess] : 'unknown'}.
						Beat {beatPercent()}% of voters.
					{:else}
						I said both were bad. Beat {beatPercent()}% of voters.
					{/if}
					<br />
					[{MODEL_LABELS[model_A_name]} {pct(stats.A, stats.total)}% · {MODEL_LABELS[model_B_name]} {pct(stats.B, stats.total)}% · Both bad {pct(stats.both_bad, stats.total)}%]
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

			<!-- Next battle link -->
			<a
				href="/"
				class="inline-flex items-center gap-2 rounded-lg bg-[#C3F73A] px-5 py-2.5 text-sm font-bold text-[#0D1117] hover:bg-[#A8D428] transition-colors"
			>
				Next battle →
			</a>
		{/if}
	</div>
{/if}
