<script lang="ts">
	import { page } from '$app/state';

	const status = $derived(page.status);
	const message = $derived(page.error?.message ?? 'Something went sideways.');
</script>

<svelte:head>
	<title>DUPED - {status}</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="gtm-root">
	<div class="title-wrap">
		<div class="burst title-burst">
			<div class="burst-spin" aria-hidden="true"></div>
			<div class="burst-label">
				<div class="burst-top">ERROR</div>
				<div class="burst-main">{status}</div>
			</div>
		</div>
		<h1 class="disp h1">DUPED<em>.</em></h1>
		<p class="sub">
			{status === 404 ? "That page is an AI fake — it doesn't exist." : message}
		</p>
		<a class="playbtn" href="/" style="display:inline-block;text-decoration:none">
			BACK TO THE GAME
		</a>
	</div>
</div>
