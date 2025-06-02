<script>
	import { onMount } from 'svelte';
	import { getRicette } from './lib/api.js';

	let ricette = [];

	onMount(async () => {
		ricette = await getRicette();
	});
</script>

<h1>Le Ricette</h1>
<ul>
	{#each ricette as ricetta}
		<li>{ricetta.titolo}</li>
	{/each}
</ul>
