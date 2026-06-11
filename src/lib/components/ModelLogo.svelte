<script lang="ts">
	import type { ModelName } from '$lib/types';

	let { model, size = 'sm' }: { model: ModelName; size?: 'sm' | 'md' } = $props();

	const configs: Record<ModelName, { bg: string; text: string; label: string }> = {
		chatgpt:    { bg: '#10A37F', text: '#fff',     label: 'G' },
		claude:     { bg: '#D4A87B', text: '#1a0a00',  label: 'C' },
		gemini:     { bg: '#4285F4', text: '#fff',     label: 'G' },
		grok:       { bg: '#1a1a1a', text: '#fff',     label: 'X' },
		perplexity: { bg: '#20B2AA', text: '#fff',     label: 'P' }
	};

	const cfg = $derived(configs[model]);
	const dim = $derived(size === 'md' ? 'h-7 w-7 text-sm' : 'h-5 w-5 text-xs');
</script>

<div
	class="rounded-md flex items-center justify-center font-bold shrink-0 {dim}"
	style="background:{cfg.bg};color:{cfg.text}"
>
	{cfg.label}
</div>
