<script lang="ts">
	import { CATEGORIES, CATEGORY_LABELS, type Category } from '$lib/types';

	let { active = 'all' }: { active?: Category | 'all' } = $props();

	const tabs = [
		{ id: 'all', label: 'All', href: '/' },
		...CATEGORIES.map((c) => ({ id: c, label: CATEGORY_LABELS[c], href: `/${c}` }))
	];
</script>

<div class="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
	{#each tabs as tab}
		<a
			href={tab.href}
			class="shrink-0 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap
			{active === tab.id
				? 'bg-[#21262D] text-white border border-[#30363D]'
				: 'text-[#8B949E] hover:text-white hover:bg-[#21262D]'}"
		>
			{tab.label}
		</a>
	{/each}
</div>
