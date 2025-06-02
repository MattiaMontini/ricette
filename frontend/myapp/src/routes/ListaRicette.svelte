<script>
	import { onMount } from 'svelte';
	import { getRicette } from '$lib/api.js';

	let ricette = [];

	onMount(async () => {
		ricette = await getRicette();
	});
</script>

<ul>
	{#each ricette as ricetta}
		<li>{ricetta.nome} - {ricetta.descrizione}</li>
	{/each}
</ul>
