<script>
	import { onMount } from 'svelte';

	let showPizzaOverlay = false;
	let currentPizzaImage = 'PizzaBenvenuto.png';
	let clickCount = 0;

	onMount(() => {
		setTimeout(() => {
			showPizzaOverlay = true;
		}, 1000);
	});

	function handleOverlayClick() {
		clickCount += 1;
		if (clickCount === 1) {
			currentPizzaImage = 'PizzaBenvenuto2.png';
		} else if (clickCount === 2) {
			showPizzaOverlay = false;
		}
	}
</script>

<svelte:head>
	<!-- DaisyUI + Tailwind da CDN -->
	<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</svelte:head>

<!-- Overlay con pizza -->
{#if showPizzaOverlay}
	<div
		class="fixed inset-0 bg-cyan-200/30 backdrop-blur flex items-center justify-center z-50 cursor-pointer"
		on:click={handleOverlayClick}
	>
		<img src={currentPizzaImage} alt="Pizza" class="max-w-xs h-96 object-contain" />
	</div>
{/if}

<!-- Contenuto principale -->
<main class="min-h-screen bg-white text-center p-6">
	<!-- Logo -->
	<img src="logo.png" alt="Logo" class="mx-auto w-4/5 max-w-sm mb-4" />

	<!-- Pulsanti principali -->
	<div class="flex flex-col items-center gap-5 my-8">
		<button
			class="w-[342px] h-[44px] rounded-[12px] text-white text-center bg-[#70B9BE] flex items-center justify-center"
			on:click={() => (window.location.href = '/accedi')}
		>
			Accedi
		</button>

		<button
			class="w-[342px] h-[44px] rounded-[12px] text-white text-center bg-[#70B9BE] flex items-center justify-center"
			on:click={() => (window.location.href = '/registrati')}
		>
			Registrati
		</button>

		<button
			class="w-[342px] h-[44px] rounded-[12px] text-white text-center bg-[#70B9BE] flex items-center justify-center"
			on:click={() => (window.location.href = '/ricette')}
		>
			Accedi senza account
		</button>
	</div>

	<!-- Footer -->
	<footer class="text-xs text-gray-500 mt-8">© 2025 ALL RIGHTS RESERVED</footer>
</main>
