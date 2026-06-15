<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { SITE_NAME, SITE_URL, OG_IMAGE } from '$lib/seo';
	import {
		CATEGORIES,
		REAL_PRODUCTS,
		buildDailyRounds,
		buildEndlessDeck,
		revealLabel,
		tomorrowsCategory,
		type Product
	} from '$lib/duped';

	let { data }: { data: PageData } = $props();

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
	let playedDay = $state(0); // day index of the last completed daily
	let hydrated = $state(false); // localStorage loaded?

	const cat = $derived(data.daily.category); // category of the loaded puzzle (today, or an archive day)
	const tomorrow = tomorrowsCategory();
	const today = Math.floor(Date.now() / 86400000);

	// Persist brag-state (streak/games/best run/saved finds + played-today)
	// across reloads - the whole point of a daily streak.
	const STORE_KEY = 'duped:v1';
	onMount(() => {
		try {
			const raw = localStorage.getItem(STORE_KEY);
			if (raw) {
				const s = JSON.parse(raw);
				streak = s.streak ?? 0;
				games = s.games ?? 0;
				bestRun = s.bestRun ?? 0;
				saved = Array.isArray(s.saved) ? s.saved : [];
				playedDay = s.playedDay ?? 0;
			}
		} catch {
			/* ignore corrupt storage */
		}
		hydrated = true;
		// Archive links (?day=N) jump straight into that day's puzzle.
		if (data.isArchive) startDaily();
	});
	$effect(() => {
		if (!hydrated || typeof localStorage === 'undefined') return;
		const snapshot = JSON.stringify({ streak, games, bestRun, saved, playedDay });
		try {
			localStorage.setItem(STORE_KEY, snapshot);
		} catch {
			/* quota/private mode - ignore */
		}
	});

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

	function startDaily() {
		track('play_game', { mode: 'daily', category: cat.id });
		logEvent('play_game', { mode: 'daily', category: cat.id });
		mode = 'daily';
		copied = false;
		// The puzzle is preloaded and shared (same #N for everyone), so this is
		// instant - no spinner.
		rounds = data.daily.items.length ? data.daily.items : buildDailyRounds(cat, null);
		usedLive = data.daily.live;
		idx = 0;
		guesses = [];
		revealed = false;
		phase = 'play';
	}

	function startEndless() {
		track('play_game', { mode: 'endless' });
		logEvent('play_game', { mode: 'endless' });
		mode = 'endless';
		copied = false;
		rounds = buildEndlessDeck();
		idx = 0;
		guesses = [];
		strikes = 0;
		run = 0;
		revealed = false;
		phase = 'play';
	}

	function guess(saidReal: boolean) {
		if (revealed || !p) return;
		const cur = p;
		const correct = saidReal === cur.isReal;
		track('guess', {
			mode,
			correct,
			is_real: !!cur.isReal,
			category: cur.cat,
			item: cur.name
		});
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
				track('endless_over', { run, best: bestRun });
				logEvent('endless_over', { run, best: bestRun });
				phase = 'endlessOver';
				return;
			}
			if (idx + 1 >= rounds.length) {
				// reshuffle a fresh deck and keep going
				rounds = buildEndlessDeck();
				idx = 0;
			} else {
				idx += 1;
			}
			revealed = false;
			return;
		}
		if (idx + 1 >= rounds.length) {
			// Streak/games only move on the first completion of TODAY's puzzle, so
			// replaying or playing the archive can't farm the streak.
			if (!data.isArchive && playedDay !== today) {
				streak = score >= 4 ? streak + 1 : 0;
				games += 1;
				playedDay = today;
			}
			track('game_complete', {
				mode: 'daily',
				score,
				out_of: 5,
				streak,
				category: cat.id,
				used_live: usedLive
			});
			logEvent('game_complete', { score, category: cat.id });
			phase = 'results';
		} else {
			idx += 1;
			revealed = false;
		}
	}

	function toggleSave(prod: Product) {
		const removing = saved.some((x) => x.name === prod.name);
		if (!removing) {
			track('save_find', { item: prod.name, category: prod.cat });
			logEvent('save_find', { item: prod.name, category: prod.cat });
		}
		saved = removing
			? saved.filter((x) => x.name !== prod.name)
			: [...saved, prod];
	}
	const isSaved = (prod: Product) => saved.some((x) => x.name === prod.name);

	function shareText(): string {
		if (mode === 'endless') {
			return [`DUPED ∞`, `${run} in a row (best ${bestRun}) 🤖`, 'Play free → duped.gg'].join(
				'\n'
			);
		}
		const grid = guesses.map((g) => (g.correct ? '🟩' : '🟥')).join('');
		const fooled = guesses.find((g) => !g.correct);
		const fire = streak > 0 ? ` 🔥${streak}` : '';
		const tail = fooled ? `Duped by “${fooled.name}” 😅` : 'Un-dupable 😎';
		return [
			`DUPED #${data.daily.number}`,
			`${grid}  ${score}/5${fire}`,
			tail,
			'Play free → duped.gg'
		].join('\n');
	}

	async function copyShare() {
		const txt = shareText();
		logEvent('share', { mode });
		// On mobile, open the native share sheet (big for the Reddit/mobile crowd).
		if (typeof navigator !== 'undefined' && navigator.share) {
			try {
				track('share', { method: 'native', mode, score });
				await navigator.share({ text: txt });
				return;
			} catch (err) {
				// User cancelled the sheet - don't fall through to clipboard.
				if (err instanceof Error && err.name === 'AbortError') return;
			}
		}
		track('share', { method: 'copy', mode, score });
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

	// Thin, safe wrapper around GA4. No-ops if gtag hasn't loaded.
	function track(event: string, params: Record<string, unknown> = {}) {
		if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
			window.gtag('event', event, params);
		}
	}

	// Fire-and-forget beacon to our own store (Supabase) for the ops dashboard.
	function logEvent(type: string, meta: Record<string, unknown> = {}) {
		if (typeof navigator === 'undefined') return;
		try {
			const body = JSON.stringify({ type, meta });
			if (navigator.sendBeacon) {
				navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
			} else {
				fetch('/api/event', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body,
					keepalive: true
				});
			}
		} catch {
			/* analytics must never break the game */
		}
	}

	function amazonClick(item: string, category: string, source: string) {
		track('amazon_click', { item, category, source });
		logEvent('amazon_click', { item, category, source });
	}

	let email = $state('');
	let botField = $state(''); // honeypot - real users never fill this
	let subscribing = $state(false);
	let subscribed = $state(false);

	async function submitEmail(e: SubmitEvent) {
		e.preventDefault();
		if (subscribing || !email) return;
		subscribing = true;
		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, bot: botField })
			});
			const data = await res.json();
			if (data.ok) {
				subscribed = true;
				track('subscribe', {});
				// Best-effort mirror to Netlify Forms (dashboard inbox + notifications).
				// Supabase stays the source of truth for /ops; this never blocks the UX.
				fetch('/', {
					method: 'POST',
					headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
					body: new URLSearchParams({ 'form-name': 'signup', email }).toString()
				}).catch(() => {});
			}
		} catch {
			/* ignore */
		}
		subscribing = false;
	}

	// SERP-tuned: title ~51 chars (<580px), description ~150 chars (<920px).
	const title = 'DUPED - Real Amazon Finds vs. AI Fakes | Daily Game';
	const description =
		'Real Amazon products or AI fakes? Some are genuinely for sale, some an AI just invented. Play the daily 5 and endless survival - don’t get duped.';

	// Structured data for Google/Bing. Split the closing tag so the .svelte
	// parser doesn't end the component script early.
	const jsonLd =
		'<script type="application/ld+json">' +
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'WebApplication',
			name: SITE_NAME,
			alternateName: 'duped.gg',
			url: SITE_URL,
			description,
			applicationCategory: 'GameApplication',
			operatingSystem: 'Any (web browser)',
			browserRequirements: 'Requires JavaScript.',
			image: OG_IMAGE,
			offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
		}) +
		'<\/script>';
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
	<meta property="og:image:alt" content="DUPED - real Amazon products vs. AI fakes" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={OG_IMAGE} />
	{@html jsonLd}
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

{#snippet starburst(correct: boolean, isReal: boolean, label: string)}
	<div class="burst {correct ? 'burst-good' : 'burst-bad'}">
		<div class="burst-spin" aria-hidden="true"></div>
		<div class="burst-label">
			<div class="burst-top">{label}</div>
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
						<a
							class="go"
							href={r.buy}
							target="_blank"
							rel="noopener noreferrer sponsored"
							onclick={() => amazonClick(r.name, r.cat, 'shop_list')}
						>AMAZON →</a>
					{/if}
				</div>
			{/each}
			<p class="disclose">
				As an Amazon Associate, duped.gg earns from qualifying purchases. Prices are
				approximate and shown for the game - check Amazon for the current price.
			</p>
		</div>
	{/if}
{/snippet}

{#snippet emailCapture()}
	{#if subscribed}
		<p class="subnote">Thanks! See you tomorrow. 👋</p>
	{:else}
		<form class="emailform" onsubmit={submitEmail}>
			<input
				type="email"
				bind:value={email}
				placeholder="you@email.com"
				aria-label="Email"
				required
			/>
			<input
				type="text"
				tabindex="-1"
				autocomplete="off"
				aria-hidden="true"
				bind:value={botField}
				name="bot"
				style="display:none"
			/>
			<button type="submit" disabled={subscribing}>
				{subscribing ? '…' : 'NOTIFY ME'}
			</button>
		</form>
		<p class="subnote">Get tomorrow's category. A quick heads-up, no spam.</p>
	{/if}
{/snippet}

<div class="gtm-root">
	{#if phase !== 'title'}
		<header class="topbar">
			<a class="disp logo" href="/" aria-label="DUPED home">
				DUPED
				<small>
					{mode === 'endless'
						? 'ENDLESS · 3 STRIKES'
						: `${cat.emoji} ${cat.label.toUpperCase()}`}
				</small>
			</a>
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
				DUPED #{data.daily.number} · {cat.emoji} {cat.label.toUpperCase()}
			</div>
			<button class="playbtn" onclick={startDaily}>PLAY TODAY'S 5</button>
			{#if data.playedToday >= 10}
				<div class="proof">🟢 {data.playedToday.toLocaleString()} played today</div>
			{/if}
			<div class="meta">NO SIGNUP · 60 SECONDS · BRAG FOREVER</div>
			<a class="archivelink" href="/archive">▦ Past days</a>

			{#if saved.length > 0}
				<div class="savedwrap">
					{@render shopList(saved, `♥ SAVED FINDS (${saved.length})`)}
				</div>
			{/if}
			<footer class="footer">
				<a href="/faq">FAQ</a> · <a href="/archive">Past days</a> · contact:
				<a href="mailto:mark@duped.gg">mark@duped.gg</a>
				<br />
				<span style="opacity:.8">
					As an Amazon Associate, duped.gg earns from qualifying purchases.
				</span>
			</footer>
		</div>
	{/if}

	{#if phase === 'play' && p && !revealed}
		<div class="card" style="margin-top:26px">
			<div class="pricetag">{p.price}</div>
			<div class="eyebrow">
				{mode === 'endless'
					? `Streak ${run} · ${catLabelFor(p.cat)}`
					: `DUPED #${data.daily.number} · Round ${idx + 1} of 5`}
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
			{@render starburst(lastGuess.correct, !!p.isReal, revealLabel(lastGuess.correct, guesses.length - 1))}
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
				<a
					class="buybtn"
					href={p.buy}
					target="_blank"
					rel="noopener noreferrer sponsored"
					onclick={() => amazonClick(p.name, p.cat, 'reveal')}
				>
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

			<!-- The payoff first: the real ones are actually for sale. -->
			{@render shopList(realsThisGame, 'WAIT, THESE ARE REAL - SHOP THEM')}

			<button class="sharebtn" onclick={copyShare}>
				{copied ? 'COPIED! PASTE IT IN THE CHAT' : 'COPY SHARE GRID'}
			</button>
			<button class="againbtn" onclick={startEndless}>∞ KEEP GOING - ENDLESS MODE</button>
			<button class="againbtn" onclick={startDaily}>REPLAY {cat.label.toUpperCase()}</button>

			<div class="statrow">
				<div class="stat">
					<b>{streak}</b>
					<small>WIN STREAK</small>
				</div>
				<div class="stat">
					<b>{games}</b>
					<small>GAMES</small>
				</div>
				<div class="stat">
					<b>{bestRun}</b>
					<small>BEST ∞ RUN</small>
				</div>
			</div>
			{#if data.isArchive}
				<a class="tmrw" href="/" style="text-decoration:none">▦ BACK TO TODAY'S</a>
			{:else}
				<div class="tmrw">
					TOMORROW: {tomorrow.emoji} {tomorrow.label.toUpperCase()}
				</div>
			{/if}
			{@render emailCapture()}
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
			{@render shopList(realsThisGame, 'REAL ONES YOU MET - SHOP THEM')}
			<button class="sharebtn" onclick={copyShare}>
				{copied ? 'COPIED! PASTE IT IN THE CHAT' : 'COPY MY RUN'}
			</button>
			<button class="againbtn" onclick={startEndless}>∞ RUN IT BACK</button>
			<button class="againbtn" onclick={startDaily}>BACK TO TODAY'S 5</button>
			{@render emailCapture()}
		</div>
	{/if}
</div>
