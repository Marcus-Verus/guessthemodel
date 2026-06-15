<script lang="ts">
	import { SITE_URL } from '$lib/seo';

	const faqs = [
		{
			q: 'What is DUPED?',
			a: 'Every product you see is either really for sale on Amazon or invented out of thin air. Your job is to tell which. Some are genuinely real. Some never existed.'
		},
		{
			q: 'How does the daily work?',
			a: 'One puzzle a day, numbered like #1, #2, and so on. Everyone gets the same five products that day, so your score is comparable. The category changes with the day of the week.'
		},
		{
			q: 'Which ones are real?',
			a: 'The "real" picks are actual novelty products sold on Amazon, and we link straight to them so you can see for yourself. The fakes are made up to sound just plausible enough.'
		},
		{
			q: 'What is Endless mode?',
			a: 'A survival run. Keep guessing real or fake for as long as you can. Three wrong and you are out. It pulls from the whole collection, not just today’s category.'
		},
		{
			q: 'Can I play past days?',
			a: 'Yes. Tap "Past days" on the home screen to open the archive and replay any day you missed. Replays do not change your streak.'
		},
		{
			q: 'How do streaks work?',
			a: 'Get at least 4 of 5 on the daily to keep your streak alive. Your streak, games played, and saved finds are stored on your device, so they survive a refresh.'
		},
		{
			q: 'Are the prices real?',
			a: 'Prices are approximate and shown for the game. Always check Amazon for the current price before buying.'
		},
		{
			q: 'How does duped.gg make money?',
			a: 'As an Amazon Associate, duped.gg earns from qualifying purchases made through the links on the real products. It costs you nothing extra.'
		},
		{
			q: 'Who makes this?',
			a: 'A one-person project. Questions, ideas, or weird products to add? Email mark@duped.gg.'
		}
	];
</script>

<svelte:head>
	<title>DUPED - FAQ</title>
	<meta name="description" content="How DUPED works: the daily, real vs. AI, endless mode, streaks, and more." />
	<link rel="canonical" href={`${SITE_URL}/faq`} />
</svelte:head>

<div class="gtm-root">
	<div class="faq-wrap">
		<a class="back" href="/">← duped.gg</a>
		<h1 class="disp h1" style="font-size:34px">FAQ</h1>
		{#each faqs as item (item.q)}
			<div class="faq">
				<h2>{item.q}</h2>
				<p>{item.a}</p>
			</div>
		{/each}
		<a class="back" href="/" style="margin-top:24px">← Back to the game</a>
	</div>
</div>

<style>
	.faq-wrap {
		width: 100%;
		max-width: 560px;
		padding-top: 24px;
	}
	.back {
		display: inline-block;
		color: #c9d2ff;
		text-decoration: none;
		font-size: 13px;
		font-weight: 700;
		margin-bottom: 14px;
	}
	.faq {
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.16);
		border-radius: 12px;
		padding: 16px 18px;
		margin-bottom: 12px;
	}
	.faq h2 {
		font-size: 16px;
		color: #fff;
		margin-bottom: 6px;
	}
	.faq p {
		font-size: 14px;
		line-height: 1.55;
		color: #c9d2ff;
	}
</style>
