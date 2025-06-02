<script>
	import { includeIgnoreFile } from '@eslint/compat';
	import { onMount, onDestroy } from 'svelte';
	import { getRicette } from '$lib/api.js';
	import Card from '$lib/Card.svelte';

	let ricette = [];

	// Filtri
	let ricercaTitolo = '';
	let filtroDifficolta = null; // null o numero da 1 a 5
	let filtroTempo = null; // massimo tempo in minuti

	let isAuthenticated = false;
	let showUserMenu = false;
	let user = null;
	let numeroCarrello = 0;
	let ingredienti = [];

	onMount(async () => {
		ricette = await getRicette();

		const token = localStorage.getItem('token');
		isAuthenticated = !!token;

	
		if (isAuthenticated) {
				const userString = localStorage.getItem('user');
				user = userString ? JSON.parse(userString) : null;

				// Recupera il numero di elementi nel carrello dal backend
				try {
					const res = await fetch('http://localhost:3000/api/carrello', {
						headers: {
							Authorization: `Bearer ${token}`
						}
					});
					if (res.ok) {
						const dati = await res.json();
						ingredienti = Array.isArray(dati) ? dati : [];
						numeroCarrello = dati.length;
					}
				} catch (err) {
					console.error('Errore durante il fetch del carrello:', err);
				}
			}


		const closeMenu = () => {
			showUserMenu = false;
		};
		window.addEventListener('click', closeMenu);
		onDestroy(() => {
			window.removeEventListener('click', closeMenu);
		});
	});

	async function caricaNumeroCarrello() {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const res = await fetch('http://localhost:3000/api/carrello', {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) {
				throw new Error('Errore nella richiesta');
			}

			const ingredienti = await res.json();
			numeroCarrello = Array.isArray(ingredienti) ? ingredienti.length : 0;
		} catch (err) {
			console.error('Errore caricamento carrello:', err);
			numeroCarrello = 0;
		}
	}

	function toggleUserMenu(event) {
		event.stopPropagation();
		showUserMenu = !showUserMenu;
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		isAuthenticated = false;
		user = null;
		showUserMenu = false;
		window.location.reload();
	}

	// Filtri per i 3 caroselli
	$: ricetteFiltrateTitolo = ricercaTitolo
		? ricette.filter((r) => r.titolo.toLowerCase().includes(ricercaTitolo.toLowerCase()))
		: ricette;

	$: ricetteFiltrateDifficolta = filtroDifficolta
		? ricette.filter((r) => r.difficolta === +filtroDifficolta)
		: ricette;

	$: ricetteFiltrateTempo = filtroTempo
		? ricette.filter((r) => r.tempoPreparazione <= +filtroTempo)
		: ricette;
</script>

<svelte:head>
	<!-- DaisyUI + Tailwind da CDN -->
	<link href="https://fonts.googleapis.com/css2?family=Afacad&display=swap" rel="stylesheet" />
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
		rel="stylesheet"
	/>
	<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
	<link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
</svelte:head>

<nav class="navbar relative">
	<div class="navbar-left">
		<span class="logo">RecipeMe</span>
	</div>
	<div class="navbar-right relative">
		<a href="/ricette" title="Home">
			<span class="material-symbols-outlined">home</span>
		</a>

		<a href="/carrello" title="Carrello" class="icon-button relative">
			<span class="material-symbols-outlined">shopping_cart</span>
			{#if numeroCarrello > 0}
				<span class="badge-carrello">{numeroCarrello}</span>
			{/if}
		</a>
		<button title="Utente" on:click={toggleUserMenu} class="relative">
			<span class="material-symbols-outlined">person</span>
		</button>

		{#if showUserMenu && isAuthenticated}
			<div class="user-menu" on:click|stopPropagation>
				<p class="font-semibold mb-1">{user?.nome}</p>
				<p class="email text-gray-600 mb-3">{user?.email}</p>
				<button on:click={logout}>Logout</button>
			</div>
		{/if}
	</div>
</nav>

<section class="px-4 sm:px-6 mx-2 sm:mx-0 mb-6 mt-6">
	<!-- Carosello per titolo -->
	<h2>Cerca per titolo</h2>
	<input
		type="text"
		placeholder="Cerca per titolo..."
		bind:value={ricercaTitolo}
		class="input input-bordered w-full max-w-md my-4"
	/>
	{#if ricetteFiltrateTitolo.length > 0}
		<div class="carosello flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4">
			{#each ricetteFiltrateTitolo as ricetta}
				<a
					class="card-link snap-start inline-block transition-transform hover:scale-105"
					href={`/ricetta/${ricetta.id}`}
				>
					<Card
						titolo={ricetta.titolo}
						immagine={ricetta.immagine}
						tempoPreparazione={ricetta.tempoPreparazione}
						porzioni={ricetta.porzioni}
						difficolta={ricetta.difficolta}
					/>
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-gray-600 mt-4">Nessuna ricetta trovata.</p>
	{/if}
</section>

<section class="px-4 sm:px-6 mx-2 sm:mx-0 mb-6 mt-6">
	<!-- Carosello per difficoltà -->
	<h2>Filtra per difficoltà</h2>
	<select bind:value={filtroDifficolta} class="select select-bordered w-full max-w-xs my-4">
		<option value="">Tutte</option>
		<option value="1">1 - Molto facile</option>
		<option value="2">2 - Facile</option>
		<option value="3">3 - Media</option>
		<option value="4">4 - Difficile</option>
		<option value="5">5 - Molto difficile</option>
	</select>
	{#if ricetteFiltrateDifficolta.length > 0}
		<div class="carosello flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4">
			{#each ricetteFiltrateDifficolta as ricetta}
				<a
					class="card-link snap-start inline-block transition-transform hover:scale-105"
					href={`/ricetta/${ricetta.id}`}
				>
					<Card
						titolo={ricetta.titolo}
						immagine={ricetta.immagine}
						tempoPreparazione={ricetta.tempoPreparazione}
						porzioni={ricetta.porzioni}
						difficolta={ricetta.difficolta}
					/>
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-gray-600 mt-4">Nessuna ricetta trovata per questa difficoltà.</p>
	{/if}
</section>

<section class="px-4 sm:px-6 mx-2 sm:mx-0 mb-6 mt-6">
	<!-- Carosello per tempo di preparazione -->
	<h2>Filtra per tempo di preparazione</h2>
	<input
		type="number"
		min="1"
		placeholder="Inserisci tempo massimo in minuti"
		bind:value={filtroTempo}
		class="input input-bordered w-full max-w-xs my-4"
	/>
	{#if ricetteFiltrateTempo.length > 0}
		<div class="carosello flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4">
			{#each ricetteFiltrateTempo as ricetta}
				<a
					class="card-link snap-start inline-block transition-transform hover:scale-105"
					href={`/ricetta/${ricetta.id}`}
				>
					<Card
						titolo={ricetta.titolo}
						immagine={ricetta.immagine}
						tempoPreparazione={ricetta.tempoPreparazione}
						porzioni={ricetta.porzioni}
						difficolta={ricetta.difficolta}
					/>
				</a>
			{/each}
		</div>
	{:else}
		<p class="text-gray-600 mt-4">Nessuna ricetta trovata per questo tempo.</p>
	{/if}
</section>

<style>
	h2 {
		font-family: 'Afacad', sans-serif;
		color: #3a3a3a;
		font-weight: 600;
		font-size: 25px;
	}

	.input {
		font-size: 1rem;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		border: 1px solid #d1d5db;
	}

	.input:focus {
		outline: none;
		border-color: #70b9be;
		box-shadow: 0 0 0 2px rgba(112, 185, 190, 0.2);
	}

	.carosello {
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* IE 10+ */
	}

	.carosello::-webkit-scrollbar {
		display: none; /* Chrome, Safari, Opera */
	}

	.card-link {
		max-width: 350px;
		margin-left: 0;
		margin-right: 0;
		display: inline-block;
		transition: transform 0.3s ease;
		scroll-snap-align: start;
	}

	.navbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background-color: #ffffff;
		color: #333;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid #e2e8f0;
		position: relative;
	}

	.navbar-left .logo {
		font-family: 'Pacifico', cursive;
		font-size: 1.4rem;
		color: #333;
		letter-spacing: 0.02em;
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: 1rem;
		position: relative;
	}

	.navbar-right button,
	.navbar-right a {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: #555;
		transition:
			transform 0.2s ease,
			color 0.2s ease;
		display: flex;
		align-items: center;
	}

	.user-menu {
		position: absolute;
		right: 0;
		top: 100%;
		margin-top: 0.5rem;
		width: 220px;
		background: white;
		border-radius: 0.375rem;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		padding: 1rem;
		z-index: 9999;
		color: black;
		border: 1px solid #e5e7eb;
	}

	.user-menu p.email {
		word-break: break-word;
		white-space: normal;
		overflow-wrap: break-word;
		font-size: 0.9rem;
		color: #666;
	}

	.user-menu button {
		background-color: #4b9ca3;
		color: white;
		font-weight: 600;
		padding: 0.4rem 0.8rem;
		border-radius: 0.375rem;
		width: 100%;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
	}

	.user-menu button:hover {
		background-color: #3a888f;
	}
	.badge-carrello {
		position: absolute;
		top: -6px;
		right: -6px;
		background-color: #ef4444; /* rosso */
		color: white;
		border-radius: 9999px;
		padding: 2px 6px;
		font-size: 0.75rem;
		font-weight: bold;
		line-height: 1;
	}
</style>
