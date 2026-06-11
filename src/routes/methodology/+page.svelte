<svelte:head>
	<title>Methodology — GuessTheModel</title>
	<meta name="description" content="How GuessTheModel runs blind AI battles: same prompt, same temperature, randomised display order, one vote per person. The social human benchmark." />
</svelte:head>

<div class="mx-auto max-w-2xl px-4 sm:px-6 py-10">

	<div class="mb-10">
		<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#C3F73A30] bg-[#C3F73A08] mb-4">
			<span class="h-1.5 w-1.5 rounded-full bg-[#C3F73A]"></span>
			<span class="text-[#C3F73A] text-xs font-medium tracking-wide uppercase">Social human benchmark</span>
		</div>
		<h1 class="text-2xl sm:text-3xl font-bold text-white mb-3">Methodology</h1>
		<p class="text-[#8B949E]">
			How battles are run, how votes are counted, and what the data actually means.
		</p>
	</div>

	<div class="space-y-10">

		<!-- Section: How battles are built -->
		<section>
			<h2 class="text-white font-semibold text-base mb-4 flex items-center gap-2">
				<span class="h-5 w-5 rounded flex items-center justify-center text-xs font-bold bg-[#21262D] text-[#C3F73A]">1</span>
				How battles are built
			</h2>
			<div class="card p-5 space-y-3 text-sm text-[#8B949E] leading-relaxed">
				<p>A single prompt is sent to all five models — Claude, ChatGPT, Gemini, Grok, and Perplexity — at the same time using the same parameters:</p>
				<ul class="space-y-1.5 pl-4 list-disc marker:text-[#C3F73A]">
					<li>Temperature: <span class="text-white">0.7</span> (same creative range for everyone)</li>
					<li>Max tokens: <span class="text-white">512</span> (equal length ceiling)</li>
					<li>No system prompt, no persona, no special instructions</li>
					<li>Current flagship model for each provider — the version standard users actually get</li>
				</ul>
				<p>
					Responses are stored once and never modified. Every voter sees the exact same five outputs.
					This is not A/B tested — there is no variant.
				</p>
			</div>
		</section>

		<!-- Section: How display order is randomised -->
		<section>
			<h2 class="text-white font-semibold text-base mb-4 flex items-center gap-2">
				<span class="h-5 w-5 rounded flex items-center justify-center text-xs font-bold bg-[#21262D] text-[#C3F73A]">2</span>
				Display order is randomised per visitor
			</h2>
			<div class="card p-5 space-y-3 text-sm text-[#8B949E] leading-relaxed">
				<p>
					Position bias is real — people vote for whichever option appears first more often than chance.
					To eliminate this, we randomise the order each visitor sees using a seeded shuffle tied to their
					browser fingerprint. Two people viewing the same battle see the models in different orders.
				</p>
				<p>
					The model identity behind each slot (A–E) is fixed in our database. Only the visual order you see
					changes. This means aggregate vote counts per slot reflect genuine preference, not position effects.
				</p>
			</div>
		</section>

		<!-- Section: One vote per person -->
		<section>
			<h2 class="text-white font-semibold text-base mb-4 flex items-center gap-2">
				<span class="h-5 w-5 rounded flex items-center justify-center text-xs font-bold bg-[#21262D] text-[#C3F73A]">3</span>
				One vote per person per battle
			</h2>
			<div class="card p-5 space-y-3 text-sm text-[#8B949E] leading-relaxed">
				<p>
					Votes are deduplicated by browser fingerprint — a random ID generated on first visit and stored
					in your browser's localStorage. No account, no email, no cookies.
				</p>
				<p>
					We do not collect or transmit the fingerprint to any third party. It exists solely to prevent
					the same person from voting twice on the same battle.
				</p>
				<p>
					Coordinated voting (e.g. an AI company's employees all voting for their own model) is a real risk
					for any open platform. Our current mitigation is fingerprint deduplication.
					We publish the raw vote counts so anomalies are visible.
				</p>
			</div>
		</section>

		<!-- Section: How metrics are calculated -->
		<section>
			<h2 class="text-white font-semibold text-base mb-4 flex items-center gap-2">
				<span class="h-5 w-5 rounded flex items-center justify-center text-xs font-bold bg-[#21262D] text-[#C3F73A]">4</span>
				How win rate and vote share are calculated
			</h2>
			<div class="card p-5 space-y-3 text-sm text-[#8B949E] leading-relaxed">
				<div class="space-y-4">
					<div>
						<p class="text-white font-medium mb-1">Win rate</p>
						<p>The model with the most votes in a battle wins that battle. Ties don't count as a win for anyone.
						Win rate = battles won ÷ battles appeared in. Ranges from 0% to 100%.</p>
					</div>
					<div>
						<p class="text-white font-medium mb-1">Vote share</p>
						<p>Votes received by a model ÷ total votes cast in battles featuring that model.
						Measures how often people actively chose it, not just whether it came first.</p>
					</div>
					<div>
						<p class="text-white font-medium mb-1">"All bad" votes</p>
						<p>Recorded and published but excluded from both metrics. A high "all bad" rate
						on a category is a meaningful signal in its own right.</p>
					</div>
				</div>
			</div>
		</section>

		<!-- Section: What this does and doesn't measure -->
		<section>
			<h2 class="text-white font-semibold text-base mb-4 flex items-center gap-2">
				<span class="h-5 w-5 rounded flex items-center justify-center text-xs font-bold bg-[#21262D] text-[#C3F73A]">5</span>
				What this measures — and what it doesn't
			</h2>
			<div class="card p-5 space-y-3 text-sm text-[#8B949E] leading-relaxed">
				<p class="text-white font-medium">What it measures:</p>
				<ul class="space-y-1.5 pl-4 list-disc marker:text-[#C3F73A] mb-3">
					<li>Human preference — which output people actually liked, blind of brand</li>
					<li>Relative quality across a specific set of prompts and task types</li>
					<li>Crowd consensus at scale — wisdom of the room, not one reviewer's taste</li>
				</ul>
				<p class="text-white font-medium">What it doesn't measure:</p>
				<ul class="space-y-1.5 pl-4 list-disc marker:text-[#C3F73A]">
					<li>Factual accuracy — we don't fact-check outputs</li>
					<li>Reasoning or coding correctness — outputs are judged on presentation, not execution</li>
					<li>Generalised capability — results reflect the categories and prompts we've run</li>
					<li>Safety or alignment properties</li>
				</ul>
				<p class="mt-3">
					Treat leaderboard rankings as directional signals about <em>human preference on this task set</em>,
					not as definitive capability rankings.
				</p>
			</div>
		</section>

		<!-- Section: Data access -->
		<section>
			<h2 class="text-white font-semibold text-base mb-4 flex items-center gap-2">
				<span class="h-5 w-5 rounded flex items-center justify-center text-xs font-bold bg-[#21262D] text-[#C3F73A]">6</span>
				Data access
			</h2>
			<div class="card p-5 space-y-3 text-sm text-[#8B949E] leading-relaxed">
				<p>
					Aggregate results are public on the <a href="/leaderboard" class="text-[#C3F73A] hover:underline">leaderboard</a>.
					Individual vote records are anonymised (no user identity is ever stored — only fingerprint hashes and vote choices).
				</p>
				<p>
					For research access, bulk data exports, or partnership enquiries, reach out via the
					<a href="/faq" class="text-[#C3F73A] hover:underline">FAQ</a> contact link.
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
