<script lang="ts">
	import { SITE_NAME, SITE_URL, OG_IMAGE } from '$lib/seo';
	import {
		CATEGORIES,
		REAL_PRODUCTS,
		buildDailyRounds,
		buildEndlessDeck,
		todaysCategory,
		tomorrowsCategory,
		type Product
	} from '$lib/duped';

	type Phase = 'title' | 'loading' | 'play' | 'results' | 'endlessOver';
	type Mode = 'daily' | 'endless';
	interface Guess {
		correct: boolean;
		isReal: boolean;
		name: string;
	}

	let phase = $state<Phase>('title');
	let mode = $state<Mode>('daily');
	let rounds = $state<Product[]>([]); // daily rounds OR endless deck
	let idx = $state(0);
	let guesses = $state<Guess[]>([]);
	let revealed = $state(false);
	let strikes = $state(0);
	let run = $state(0);
	let bestRun = $state(0);
	let streak = $state(0);
	let games = $state(0);
	let copied = $state(false);
	let usedLive = $state(false);
	let saved = $state<Product[]>([]); // array of real products

	// Cache of live fakes per category id — a plain (non-reactive) ref.
	const liveCache: Record<string, Product[] | null> = {};
	const cat = todaysCategory();
	const tomorrow = tomorrowsCategory();

	const score = $derived(guesses.filter((g) => g.correct).length);
	const p = $derived<Product | undefined>(rounds[idx]);
	const lastGuess = $derived<Guess | undefined>(guesses[guesses.length - 1]);
	const realsThisGame = $derived<Product[]>(
		mode === 'daily'
			? rounds.filter((r) => r.isReal)
			: guesses
					.filter((g) => g.isReal)
					.map((g) => REAL_PRODUCTS.find((rp) => rp.name === g.name))
					.filter((x): x is Product => Boolean(x))
	);

	async function fetchFakes(catLabel: string): Promise<Product[] | null> {
		try {
			const res = await fetch('/api/fakes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ category: catLabel })
			});
			if (!res.ok) return null;
			const data = await res.json();
			return Array.isArray(data.fakes) && data.fakes.length >= 3 ? data.fakes : null;
		} catch {
			return null;
		}
	}

	async function startDaily() {
		mode = 'daily';
		phase = 'loading';
		copied = false;
		let fakes = liveCache[cat.id];
		if (!fakes) {
			fakes = await Promise.race([
				fetchFakes(cat.label),
				new Promise<null>((r) => setTimeout(() => r(null), 9000))
			]);
		}
		usedLive = !!fakes;
		liveCache[cat.id] = null;
		rounds = buildDailyRounds(cat, fakes);
		idx = 0;
		guesses = [];
		revealed = false;
		phase = 'play';
	}

	function startEndless() {
		mode = 'endless';
		copied = false;
		const extras = Object.values(liveCache).flat().filter(Boolean) as Product[];
		rounds = buildEndlessDeck(extras);
		idx = 0;
		guesses = [];
		strikes = 0;
		run = 0;
		revealed = false;
		phase = 'play';
	}

	// Pre-warm fakes for today's category while playing.
	$effect(() => {
		if (phase === 'play' && !liveCache[cat.id]) {
			fetchFakes(cat.label).then((f) => {
				if (f) liveCache[cat.id] = f;
			});
		}
	});

	function guess(saidReal: boolean) {
		if (revealed || !p) return;
		const cur = p;
		const correct = saidReal === cur.isReal;
		guesses = [...guesses, { correct, isReal: !!cur.isReal, name: cur.name }];
		if (mode === 'endless') {
			if (correct) {
				run += 1;
				if (run > bestRun) bestRun = run;
			} else {
				strikes += 1;
			}
		}
		revealed = true;
	}

	function next() {
		if (mode === 'endless') {
			if (strikes >= 3) {
				phase = 'endlessOver';
				return;
			}
			if (idx + 1 >= rounds.length) {
				// reshuffle a fresh deck and keep going
				const extras = Object.values(liveCache).flat().filter(Boolean) as Product[];
				rounds = buildEndlessDeck(extras);
				idx = 0;
			} else {
				idx += 1;
			}
			revealed = false;
			return;
		}
		if (idx + 1 >= rounds.length) {
			streak = score >= 4 ? streak + 1 : 0;
			games += 1;
			phase = 'results';
		} else {
			idx += 1;
			revealed = false;
		}
	}

	function toggleSave(prod: Product) {
		saved = saved.find((x) => x.name === prod.name)
			? saved.filter((x) => x.name !== prod.name)
			: [...saved, prod];
	}
	const isSaved = (prod: Product) => saved.some((x) => x.name === prod.name);

	function shareText(): string {
		if (mode === 'endless') {
			return `Duped ∞ survived ${run} in a row 🤖 (best ${bestRun})\nduped.gg`;
		}
		const grid = guesses.map((g) => (g.correct ? '🟩' : '🟥')).join('');
		const fooled = guesses.find((g) => !g.correct);
		const tail = fooled ? `duped by “${fooled.name}”` : 'un-dupable 😎';
		const fire = streak > 0 ? ` 🔥${streak}` : '';
		return `Duped ${cat.emoji} ${grid} ${score}/5${fire} — ${tail}\nduped.gg`;
	}

	async function copyShare() {
		const txt = shareText();
		try {
			await navigator.clipboard.writeText(txt);
			copied = true;
		} catch {
			const ta = document.createElement('textarea');
			ta.value = txt;
			document.body.appendChild(ta);
			ta.select();
			try {
				document.execCommand('copy');
				copied = true;
			} finally {
				document.body.removeChild(ta);
			}
		}
		setTimeout(() => (copied = false), 2200);
	}

	function catLabelFor(id: string): string {
		return CATEGORIES.find((c) => c.id === id)?.label || 'AI Original';
	}

	const title = `${SITE_NAME} — Real or AI?`;
	const description =
		'Ridiculous products. Some are really sold on Amazon. Some were invented by an AI thirty seconds ago. Daily 5 + endless survival. Don’t get duped.';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={SITE_URL} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={SITE_URL} />
	<meta property="og:image" content={OG_IMAGE} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:image:alt" content="DUPED — real Amazon products vs. AI fakes" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={OG_IMAGE} />
</svelte:head>

{#snippet stars(rating: number)}
	<span class="stars" aria-label={`${rating} out of 5 stars`}>
		{#each [1, 2, 3, 4, 5] as i (i)}
			<span style="opacity:{i <= Math.round(rating) ? 1 : 0.25}">★</span>
		{/each}
		<span class="rating-num">{rating.toFixed(1)}</span>
	</span>
{/snippet}

{#snippet productPhoto(emoji: string | undefined, img: string | undefined, small: boolean)}
	<div class="photo {small ? 'photo-sm' : ''}" aria-hidden="true">
		{#if img}
			<img class="photo-img" src={img} alt="" />
		{:else}
			<span class="photo-emoji">{emoji || '📦'}</span>
		{/if}
		<span class="photo-tag">PRODUCT PHOTO</span>
	</div>
{/snippet}

{#snippet starburst(correct: boolean, isReal: boolean)}
	<div class="burst {correct ? 'burst-good' : 'burst-bad'}">
		<div class="burst-spin" aria-hidden="true"></div>
		<div class="burst-label">
			<div class="burst-top">{correct ? 'CLOCKED IT' : 'DUPED!'}</div>
			<div class="burst-main">{isReal ? 'REAL' : 'AI'}</div>
		</div>
	</div>
{/snippet}

{#snippet shopList(items: Product[], heading: string)}
	{#if items.length}
		<div class="realshop">
			<h3>{heading}</h3>
			{#each items as r (r.name)}
				<div class="shopitem">
					<span class="em">{r.emoji}</span>
					<span class="nm">
						{r.name}<br />
						<span class="price">{r.price}</span>
					</span>
					<button
						class="heart {isSaved(r) ? 'heart-on' : ''}"
						onclick={() => toggleSave(r)}
						aria-label={isSaved(r) ? 'Remove from saved finds' : 'Save this find'}
					>
						{isSaved(r) ? '♥' : '♡'}
					</button>
					{#if r.buy}
						<a class="go" href={r.buy} target="_blank" rel="noopener noreferrer">AMAZON →</a>
					{/if}
				</div>
			{/each}
			<p class="disclose">
				As an Amazon Associate, duped.gg may earn from qualifying purchases.
			</p>
		</div>
	{/if}
{/snippet}

<div class="gtm-root">
	{#if phase !== 'title'}
		<header class="topbar">
			<div class="disp logo">
				DUPED
				<small>
					{mode === 'endless'
						? 'ENDLESS · 3 STRIKES'
						: `${cat.emoji} ${cat.label.toUpperCase()}`}
				</small>
			</div>
			{#if mode === 'endless' && phase === 'play'}
				<div class="endlesshud">
					<span>RUN {run}</span>
					{#each [0, 1, 2] as i (i)}
						<span class="x {i < strikes ? 'hit' : ''}">✕</span>
					{/each}
				</div>
			{:else}
				<div class="dots" aria-label="round progress">
					{#each [0, 1, 2, 3, 4] as i (i)}
						{@const g = guesses[i]}
						<span
							class="dot {g
								? g.correct
									? 'on-good'
									: 'on-bad'
								: i === idx && phase === 'play'
									? 'now'
									: ''}"
						></span>
					{/each}
				</div>
			{/if}
		</header>
	{/if}

	{#if phase === 'title'}
		<div class="title-wrap">
			<div class="burst title-burst">
				<div class="burst-spin" aria-hidden="true"></div>
				<div class="burst-label">
					<div class="burst-top">REAL OR</div>
					<div class="burst-main">AI?</div>
				</div>
			</div>
			<h1 class="disp h1">DUPED<em>.</em></h1>
			<p class="sub">
				Ridiculous products. Some are really sold on Amazon. Some were invented by an AI thirty
				seconds ago. Don't get duped.
			</p>
			<div class="catline">
				TODAY'S CATEGORY: {cat.emoji} {cat.label.toUpperCase()}
			</div>
			<button class="playbtn" onclick={startDaily}>PLAY TODAY'S 5</button>
			<button class="endlessbtn" onclick={startEndless}>∞ ENDLESS — 3 STRIKES AND OUT</button>
			<div class="meta">NO SIGNUP · 60 SECONDS · BRAG FOREVER</div>
			{#if saved.length > 0}
				<div class="savedwrap">
					{@render shopList(saved, `♥ SAVED FINDS (${saved.length})`)}
				</div>
			{/if}
			<footer class="footer">
				duped.gg · contact: <a href="mailto:mark@duped.gg">mark@duped.gg</a>
			</footer>
		</div>
	{/if}

	{#if phase === 'loading'}
		<div class="loadwrap">
			<div class="spinner" aria-hidden="true"></div>
			<div class="disp" style="font-size:17px">
				AN AI IS INVENTING {cat.label.toUpperCase()}…
			</div>
			<p class="sub" style="margin-top:10px">Mixing them with real ones. No peeking.</p>
		</div>
	{/if}

	{#if phase === 'play' && p && !revealed}
		<div class="card" style="margin-top:26px">
			<div class="pricetag">{p.price}</div>
			<div class="eyebrow">
				{mode === 'endless'
					? `Streak ${run} · ${catLabelFor(p.cat)}`
					: `Round ${idx + 1} of 5 · ${cat.label}`}
			</div>
			{@render productPhoto(p.emoji, p.img, false)}
			<h2 class="disp pname">{p.name}</h2>
			<p class="ptag">{p.tagline}</p>
			{@render stars(p.rating)}
			<div class="reviewbox">
				<p>“{p.review}”</p>
				<span>Verified purchase · helpful (1,204)</span>
			</div>
		</div>
		<div class="btnrow">
			<button class="vbtn real" onclick={() => guess(true)}>
				REAL<small>YOU CAN BUY THIS</small>
			</button>
			<button class="vbtn ai" onclick={() => guess(false)}>
				AI MADE IT<small>PURE INVENTION</small>
			</button>
		</div>
	{/if}

	{#if phase === 'play' && p && revealed && lastGuess}
		<div class="reveal-card pop">
			{@render starburst(lastGuess.correct, !!p.isReal)}
			{@render productPhoto(p.emoji, p.img, true)}
			<h2 class="disp pname" style="margin:6px 0 4px;font-size:20px">{p.name}</h2>
			<p class="fact">{p.fact}</p>
			<div class="crowd">
				ONLY {p.crowd}% OF PLAYERS GOT THIS ONE
				<div class="crowdbar">
					<div style="width:{p.crowd}%"></div>
				</div>
			</div>
			{#if p.isReal}
				<button
					class="heartcorner {isSaved(p) ? 'heart-on' : ''}"
					onclick={() => toggleSave(p)}
					aria-label={isSaved(p) ? 'Remove from saved finds' : 'Save this find'}
				>
					{isSaved(p) ? '♥' : '♡'}
				</button>
			{/if}
			{#if p.isReal && p.buy}
				<a class="buybtn" href={p.buy} target="_blank" rel="noopener noreferrer">
					IT'S REALLY ON AMAZON →<small>SEE FOR YOURSELF</small>
				</a>
			{/if}
			<button class="nextbtn" onclick={next}>
				{mode === 'endless'
					? strikes >= 3
						? 'GAME OVER →'
						: 'NEXT →'
					: idx + 1 >= rounds.length
						? 'SEE MY RESULTS'
						: 'NEXT PRODUCT →'}
			</button>
		</div>
	{/if}

	{#if phase === 'results'}
		<div class="card" style="margin-top:30px;text-align:center">
			<div class="eyebrow">FINAL VERDICT · {cat.label.toUpperCase()}</div>
			<div class="disp scoreline">
				{score}<span>/5</span>
			</div>
			<div class="grid" aria-label="result grid">
				{#each guesses as g, i (i)}
					<span>{g.correct ? '🟩' : '🟥'}</span>
				{/each}
			</div>
			{#if guesses.find((g) => !g.correct)}
				<p class="fooledby">
					Duped by <b>“{guesses.find((g) => !g.correct)?.name}”</b>
				</p>
			{:else}
				<p class="fooledby">Un-dupable. The machines couldn't touch you. 😎</p>
			{/if}
			<div class="statrow">
				<div class="stat">
					<b>{streak}</b>
					<small>WIN STREAK</small>
				</div>
				<div class="stat">
					<b>{games}</b>
					<small>GAMES PLAYED</small>
				</div>
				<div class="stat">
					<b>{bestRun}</b>
					<small>BEST ∞ RUN</small>
				</div>
			</div>
			<button class="sharebtn" onclick={copyShare}>
				{copied ? 'COPIED! PASTE IT IN THE CHAT' : 'COPY SHARE GRID'}
			</button>
			<button class="againbtn" onclick={startEndless}>∞ KEEP GOING — ENDLESS MODE</button>
			<button class="againbtn" onclick={startDaily}>REPLAY {cat.label.toUpperCase()}</button>
			<div class="tmrw">
				TOMORROW: {tomorrow.emoji} {tomorrow.label.toUpperCase()} — COME BACK
			</div>
			{@render shopList(realsThisGame, 'THE REAL ONES — YES, ACTUALLY FOR SALE')}
			<div class="live">
				{usedLive
					? "This round's fakes were generated live by Claude."
					: 'Played with the house collection of fakes.'}
			</div>
		</div>
	{/if}

	{#if phase === 'endlessOver'}
		<div class="card" style="margin-top:30px;text-align:center">
			<div class="eyebrow">ENDLESS · GAME OVER</div>
			<div class="disp scoreline">
				{run}<span> in a row</span>
			</div>
			<p class="fooledby">
				Three strikes. Best run this session: <b>{bestRun}</b>.
			</p>
			<button class="sharebtn" onclick={copyShare}>
				{copied ? 'COPIED! PASTE IT IN THE CHAT' : 'COPY MY RUN'}
			</button>
			<button class="againbtn" onclick={startEndless}>∞ RUN IT BACK</button>
			<button class="againbtn" onclick={startDaily}>BACK TO TODAY'S 5</button>
			{@render shopList(realsThisGame, 'REAL ONES YOU MET THIS RUN')}
		</div>
	{/if}
</div>
