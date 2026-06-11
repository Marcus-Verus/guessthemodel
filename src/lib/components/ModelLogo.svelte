<script lang="ts">
	import type { ModelName } from '$lib/types';

	let { model, size = 'sm' }: { model: ModelName; size?: 'sm' | 'md' | 'lg' } = $props();

	const px = $derived(size === 'lg' ? 36 : size === 'md' ? 28 : 20);
</script>

<svg
	width={px}
	height={px}
	viewBox="0 0 32 32"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
	class="shrink-0"
	aria-label={model}
>
	{#if model === 'claude'}
		<!-- Anthropic: 3 overlapping ellipses forming the fan/asterisk mark -->
		<rect width="32" height="32" rx="6" fill="#2A1505"/>
		<ellipse cx="16" cy="16" rx="3.2" ry="10.5" fill="#E8975A" transform="rotate(0 16 16)"/>
		<ellipse cx="16" cy="16" rx="3.2" ry="10.5" fill="#E8975A" transform="rotate(60 16 16)"/>
		<ellipse cx="16" cy="16" rx="3.2" ry="10.5" fill="#E8975A" transform="rotate(120 16 16)"/>

	{:else if model === 'chatgpt'}
		<!-- OpenAI: circle ring + 3 inner spokes (wheel/gear shape) -->
		<rect width="32" height="32" rx="6" fill="#10A37F"/>
		<circle cx="16" cy="16" r="9" stroke="white" stroke-width="1.8" fill="none"/>
		<line x1="16" y1="10" x2="16" y2="22" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
		<line x1="10" y1="22" x2="22" y2="10" stroke="white" stroke-width="1.6" stroke-linecap="round"/>
		<line x1="22" y1="22" x2="10" y2="10" stroke="white" stroke-width="1.6" stroke-linecap="round"/>

	{:else if model === 'gemini'}
		<!-- Gemini: exact four-pointed sparkle — two perpendicular thin diamonds -->
		<rect width="32" height="32" rx="6" fill="#0d1b3e"/>
		<path d="M16 4 L14.4 16 L16 28 L17.6 16 Z" fill="#4285F4"/>
		<path d="M4 16 L16 14.4 L28 16 L16 17.6 Z" fill="#4285F4"/>

	{:else if model === 'grok'}
		<!-- xAI/Grok: bold X -->
		<rect width="32" height="32" rx="6" fill="#0a0a0a"/>
		<line x1="8.5" y1="8.5" x2="23.5" y2="23.5" stroke="white" stroke-width="3.5" stroke-linecap="round"/>
		<line x1="23.5" y1="8.5" x2="8.5" y2="23.5" stroke="white" stroke-width="3.5" stroke-linecap="round"/>

	{:else if model === 'perplexity'}
		<!-- Perplexity: 6-pointed star outline + center fill -->
		<rect width="32" height="32" rx="6" fill="#0a1a1a"/>
		<path
			d="M16 5.5 L19 11 L25.2 11 L21.6 15.8 L23.7 22.5 L16 18.8 L8.3 22.5 L10.4 15.8 L6.8 11 L13 11 Z"
			stroke="#20B2AA" stroke-width="1.4" fill="none" stroke-linejoin="round"
		/>
		<circle cx="16" cy="15" r="2.8" fill="#20B2AA"/>
	{/if}
</svg>
