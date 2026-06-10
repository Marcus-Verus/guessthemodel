<script lang="ts">
	import type { ModelName } from '$lib/types';
	import { MODEL_LABELS } from '$lib/types';

	let {
		model,
		selected = false,
		disabled = false,
		size = 'md',
		onclick
	}: {
		model: ModelName;
		selected?: boolean;
		disabled?: boolean;
		size?: 'sm' | 'md';
		onclick?: () => void;
	} = $props();
</script>

<button
	{onclick}
	{disabled}
	class="rounded-lg border font-medium transition-all
	{size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2.5 text-sm'}
	{selected
		? 'border-[#C3F73A] bg-[#C3F73A10] text-[#C3F73A]'
		: 'border-[#30363D] bg-[#21262D] text-[#8B949E] hover:border-[#8B949E] hover:text-white'}
	{disabled && !selected ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}"
>
	{MODEL_LABELS[model]}
</button>
