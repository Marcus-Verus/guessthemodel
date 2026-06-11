<script lang="ts">
	let openIndex = $state<number | null>(null);

	const FAQ = [
		{
			q: 'How does it work?',
			a: 'Each battle shows the same prompt answered by 5 AI models — no names shown. You vote for the best response, guess which model wrote it, predict what the crowd will pick, then the reveal shows everything. Vote → Guess → Predict → Reveal.'
		},
		{
			q: 'Which AI models are included?',
			a: 'Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google), Grok (xAI), and Perplexity. We always use the current flagship version available to standard users. When a major model updates, that\'s a content event — you\'ll see it on the leaderboard.'
		},
		{
			q: 'Are the comparisons fair?',
			a: 'Yes. Every model gets the exact same prompt, the same temperature (0.7), the same maximum length, and the display order is randomised per visitor so position can\'t bias your vote. You can see the methodology bar on every battle.'
		},
		{
			q: 'Are outputs cached?',
			a: 'Yes. Model responses are generated once and stored — every voter sees the same outputs. This keeps costs low (one API call per battle, not per visitor) and makes the vote data comparable across time.'
		},
		{
			q: 'Do I need an account?',
			a: 'No. Your vote history, streak, and player titles are tracked using a random ID stored in your browser. No signup, no email — but your history won\'t carry over to a different device or browser.'
		},
		{
			q: 'What is "All are bad"?',
			a: 'If you genuinely think all outputs are poor, vote "All are bad." We publish this data publicly — a high "all bad" rate on a category is a more honest signal about where AI still struggles than picking the least-bad answer.'
		},
		{
			q: 'How is my streak calculated?',
			a: 'Your streak counts consecutive days on which you voted on at least one battle. Miss a day and it resets to zero. It\'s tracked locally in your browser.'
		},
		{
			q: 'How do I earn player titles?',
			a: '🎯 Model Sniper — guess the correct model 10+ times total.\n🔮 Crowd Reader — predict the crowd winner 7+ times total.\n⚡ Bias Breaker — vote for 4+ different models in your last 10 votes.\n👑 [Model] Loyalist — 70%+ of your votes go to the same model (10+ votes).\n💀 All Bad Champion — vote "all bad" 5+ times total.'
		},
		{
			q: 'Why is this better than benchmarks?',
			a: 'Most benchmarks are created or influenced by the AI companies themselves. This is real humans judging real outputs on real tasks — with no model names shown until after you\'ve voted. Brand bias is eliminated by design. The crowd data is what actually happened, not what a lab wanted to publish.'
		},
		{
			q: 'Can I vote on past battles?',
			a: 'Yes. Every battle has a permanent link (shown below the battle card on the homepage). All archived battles are fully voteable and counted in the leaderboard.'
		}
	];

	function toggle(i: number) {
		openIndex = openIndex === i ? null : i;
	}
</script>

<svelte:head>
	<title>FAQ — GuessTheModel</title>
	<meta name="description" content="How does GuessTheModel work? Which AI models are included, how are battles kept fair, and how are player titles earned." />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 sm:px-6 py-10">

	<div class="mb-8">
		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-2">FAQ</h1>
		<p class="text-[#8B949E]">Everything about how GuessTheModel works.</p>
	</div>

	<div class="space-y-2">
		{#each FAQ as item, i}
			<div class="card overflow-hidden">
				<button
					onclick={() => toggle(i)}
					class="w-full flex items-center justify-between px-5 py-4 text-left"
				>
					<span class="text-white font-medium text-sm pr-4">{item.q}</span>
					<span class="text-[#8B949E] text-lg shrink-0 transition-transform duration-200
						{openIndex === i ? 'rotate-45' : ''}">
						+
					</span>
				</button>
				{#if openIndex === i}
					<div class="px-5 pb-5">
						<p class="text-[#8B949E] text-sm leading-relaxed whitespace-pre-line">{item.a}</p>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<div class="mt-10 text-center">
		<a href="/" class="text-[#6E7681] hover:text-[#8B949E] text-sm transition-colors">
			← Back to battles
		</a>
	</div>

</div>
