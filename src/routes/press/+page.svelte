<svelte:head>
	<title>Press — GuessTheModel</title>
	<meta name="description" content="Press information and media kit for GuessTheModel — the social human benchmark for AI. Contact, data access, and the story angle." />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 sm:px-6 py-10">

	<div class="mb-10">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C3F73A30] bg-[#C3F73A08] mb-4">
			<span class="h-1.5 w-1.5 rounded-full bg-[#C3F73A]"></span>
			<span class="text-[#C3F73A] text-xs font-medium tracking-wide uppercase">Press & Media</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-3">The story</h1>
		<p class="text-[#8B949E]">Everything you need to cover GuessTheModel.</p>
	</div>

	<div class="space-y-8">

		<!-- The hook -->
		<div class="card p-6">
			<h2 class="text-white font-semibold text-base mb-3">The one-liner</h2>
			<p class="text-[#C3F73A] text-lg font-medium leading-snug">
				"A blind taste test for AI — and most people can't tell which model they're reading."
			</p>
		</div>

		<!-- What it is -->
		<section>
			<h2 class="text-white font-semibold text-base mb-3">What it is</h2>
			<div class="card p-5 text-sm text-[#8B949E] leading-relaxed space-y-3">
				<p>
					GuessTheModel is the social human benchmark for AI. Every day, the same prompt is sent to five
					leading AI models — Claude, ChatGPT, Gemini, Grok, and Perplexity — under identical conditions.
					The outputs are displayed with no model names attached, in a shuffled order that is identical for
					every visitor — the daily puzzle is shared, like a crossword.
				</p>
				<p>
					Players see one answer at a time and tap which AI they think wrote it — instant reveal after
					every tap, five rounds, score out of five. The finale shows how their score compares to
					everyone else's that day, plus which answer the crowd crowned best.
				</p>
				<p>
					The result is a continuously updated, crowd-sourced benchmark that no AI company controls,
					funds, or influences.
				</p>
			</div>
		</section>

		<!-- Why it matters -->
		<section>
			<h2 class="text-white font-semibold text-base mb-3">Why it matters</h2>
			<div class="card p-5 text-sm text-[#8B949E] leading-relaxed space-y-3">
				<p>
					Most AI benchmarks are created by the AI companies themselves, run on synthetic test sets,
					or require technical expertise to interpret. GuessTheModel is different:
				</p>
				<ul class="space-y-2 pl-4 list-disc marker:text-[#C3F73A]">
					<li><span class="text-white">No brand names until after you vote</span> — brand bias is structurally eliminated</li>
					<li><span class="text-white">Real prompts, real tasks</span> — not capability tests, but the things people actually use AI for</li>
					<li><span class="text-white">Crowd consensus at scale</span> — one reviewer's taste doesn't set the ranking</li>
					<li><span class="text-white">Ongoing</span> — new battle every day, rankings update in real time</li>
				</ul>
			</div>
		</section>

		<!-- Story angles -->
		<section>
			<h2 class="text-white font-semibold text-base mb-3">Story angles</h2>
			<div class="space-y-3">
				{#each [
					{ angle: 'The blind taste test', detail: 'Most people cannot reliably identify which AI wrote a response. The gap between brand perception and actual preference is measurable — and surprising.' },
					{ angle: 'The benchmark nobody owns', detail: 'While AI labs race to top leaderboards they helped design, a crowd-sourced alternative is building a different kind of evidence.' },
					{ angle: 'Can you tell which AI wrote this?', detail: 'An interactive piece — send reporters the link and let them vote before they write. The wrong-guess rate makes the story.' },
					{ angle: 'The AI personality test', detail: 'Ask all 5 models the same controversial question. The differences in tone, hedging, and confidence reveal something real about each model\'s character.' }
				] as item}
					<div class="card p-4">
						<p class="text-white font-medium text-sm mb-1">"{item.angle}"</p>
						<p class="text-[#6E7681] text-xs leading-relaxed">{item.detail}</p>
					</div>
				{/each}
			</div>
		</section>

		<!-- Facts -->
		<section>
			<h2 class="text-white font-semibold text-base mb-3">Facts for your article</h2>
			<div class="card p-5 text-sm text-[#8B949E] leading-relaxed space-y-2">
				<ul class="space-y-2 pl-4 list-disc marker:text-[#C3F73A]">
					<li>5 models compared per battle: Claude (Anthropic), ChatGPT (OpenAI), Gemini (Google), Grok (xAI), Perplexity</li>
					<li>Same prompt, same temperature (0.7), same max token limit for all models</li>
					<li>Display order is randomised per visitor — position bias is structurally removed</li>
					<li>One vote per person per battle, tracked by anonymous browser fingerprint</li>
					<li>New battle published every day</li>
					<li>All aggregate vote data is public on the <a href="/leaderboard" class="text-[#C3F73A] hover:underline">leaderboard</a></li>
				</ul>
			</div>
		</section>

		<!-- Contact -->
		<section>
			<h2 class="text-white font-semibold text-base mb-3">Contact</h2>
			<div class="card p-5 text-sm text-[#8B949E] leading-relaxed space-y-2">
				<p>For press enquiries, data access, or an embargo briefing:</p>
				<p>
					<a href="mailto:mark@guessthemodel.com" class="text-[#C3F73A] hover:underline font-medium">
						mark@guessthemodel.com
					</a>
				</p>
				<p class="text-[#6E7681] text-xs mt-3">
					We're happy to provide raw vote data, schedule a briefing, or arrange early access
					to upcoming battle results for reporters working on a story.
				</p>
			</div>
		</section>

	</div>

	<div class="mt-10 text-center">
		<a href="/" class="text-[#6E7681] hover:text-[#8B949E] text-sm transition-colors">
			← Back to battles
		</a>
	</div>

</div>
