<script lang="ts">
	import { page } from '$app/state';
</script>

<nav class="sticky top-0 z-50 border-b border-[#30363D]" style="background:#0D1117ee;backdrop-filter:blur(12px)">
	<div class="mx-auto max-w-6xl px-4 sm:px-6">
		<div class="flex h-14 items-center justify-between">
			<a href="/" class="flex items-center gap-2 no-underline">
				<div class="flex h-7 w-7 items-center justify-center rounded-md bg-[#C3F73A] text-[#0D1117]">
					<span class="text-sm font-black">?</span>
				</div>
				<span class="font-bold text-white">GuessTheModel</span>
			</a>

			<div class="flex items-center gap-1">
				<a
					href="/"
					class="rounded-md px-3 py-1.5 text-sm transition-colors {page.url.pathname === '/' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'}"
				>
					Home
				</a>
				<a
					href="/leaderboard"
					class="rounded-md px-3 py-1.5 text-sm transition-colors {page.url.pathname === '/leaderboard' ? 'bg-[#21262D] text-white' : 'text-[#8B949E] hover:text-white'}"
				>
					Leaderboard
				</a>
			</div>
		</div>
	</div>
</nav>
