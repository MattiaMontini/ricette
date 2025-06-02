<script>
	import { onMount, onDestroy } from 'svelte';
	import { getRicette, getCategorie } from '$lib/api.js';
	import Card from '$lib/Card.svelte';

	let ricette = [];
	let categorie = [];
	let categoriaSelezionata = null;
	let isAuthenticated = false;
	let showUserMenu = false;
	let user = null;
	let numeroCarrello = 0;

	onMount(async () => {
		try {
			ricette = await getRicette();
			categorie = await getCategorie();
			await caricaNumeroCarrello();

			// Verifica autenticazione
			const token = localStorage.getItem('token');
			isAuthenticated = !!token;

			// Se autenticato, recupera info utente da localStorage (devi salvare nome e email)
			if (isAuthenticated) {
				const userString = localStorage.getItem('user');
				user = userString ? JSON.parse(userString) : null;
			}

			// Chiudi il menu se clicchi fuori
			const closeMenu = () => {
				showUserMenu = false;
			};
			window.addEventListener('click', closeMenu);
			onDestroy(() => {
				window.removeEventListener('click', closeMenu);
			});
		} catch (error) {
			console.error('Errore nel fetch:', error);
		}
	});

	async function caricaNumeroCarrello() {
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const res = await fetch('https://ricette.onrender.com/api/carrello', {
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

	function filtraPerCategoria(nomeCategoria) {
		categoriaSelezionata = nomeCategoria;
	}

	function toggleUserMenu(event) {
		event.stopPropagation(); // evita che il click chiuda subito il menu
		showUserMenu = !showUserMenu;
	}

	function logout() {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		isAuthenticated = false;
		user = null;
		showUserMenu = false;
		// Facoltativo: ricarica la pagina o naviga altrove
		window.location.reload();
	}

	$: ricetteFiltrate = categoriaSelezionata
		? ricette.filter((r) => r.categoria === categoriaSelezionata)
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

<!-- NAVBAR -->
<nav class="navbar relative">
	<div class="navbar-left">
		<span class="logo">RecipeMe</span>
	</div>
	<div class="navbar-right relative">
		<a href="/cerca" title="Cerca" class="icon-button">
			<span class="material-symbols-outlined">search</span>
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

		{#if showUserMenu}
			<div class="user-menu" on:click|stopPropagation>
				{#if isAuthenticated}
					<p class="font-semibold mb-1">{user?.nome}</p>
					<p class="email text-gray-600 mb-3">{user?.email}</p>
					<button
						on:click={logout}
						class="bg-[#70B9BE] hover:bg-[#5ca6aa] text-white font-bold py-2 px-4 rounded w-full"
					>
						Logout
					</button>
				{:else}
					<p class="font-semibold mb-3">Benvenuto!</p>
					<a
						href="/accedi"
						class="bg-[#70B9BE] hover:bg-[#5ca6aa] text-white font-bold py-2 px-4 rounded w-full mb-2 text-center block"
					>
						Accedi
					</a>
					<a
						href="/registrati"
						class="border border-[#70B9BE] text-[#70B9BE] hover:bg-[#f0fdfd] font-bold py-2 px-4 rounded w-full text-center block"
					>
						Registrati
					</a>
				{/if}
			</div>
		{/if}
	</div>
</nav>

<!-- CATEGORIE -->
<section class="px-4 sm:px-6 mx-2 sm:mx-0 mb-6">
	<h2 class="mt-6">Categorie</h2>
	<div class="carosello categorie flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4">
		<button
			class:selected={categoriaSelezionata === null}
			class="snap-start flex-shrink-0"
			on:click={() => filtraPerCategoria(null)}
		>
			Tutte
		</button>

		{#each categorie as categoria}
			<button
				class:selected={categoriaSelezionata &&
					categoria.toLowerCase() === categoriaSelezionata.toLowerCase()}
				class="snap-start flex-shrink-0"
				on:click={() => filtraPerCategoria(categoria)}
			>
				{categoria}
			</button>
		{/each}
	</div>
</section>

<!-- RICETTE PER CATEGORIA -->
<section class="px-4 sm:px-6 mx-2 sm:mx-0 mb-6">
	<h2>Ricette per categoria</h2>
	<div class="carosello flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4">
		{#each ricetteFiltrate as ricetta}
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
</section>

<!-- TUTTE LE RICETTE -->
<section class="px-4 sm:px-6 mx-2 sm:mx-0 mb-6">
	<h2>Tutte le ricette</h2>
	{#if ricette.length > 0}
		<div class="carosello flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4">
			{#each ricette as ricetta}
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
		<p>Caricamento ricette...</p>
	{/if}
</section>

<!-- RICETTE VELOCI -->
<section class="px-4 sm:px-6 mx-2 sm:mx-0 mb-6">
	<h2>Ricette veloci</h2>
	{#if ricette.length > 0}
		<div class="carosello flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4">
			{#each ricette.filter((r) => r.tempoPreparazione <= 15) as ricetta}
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
		<p>Caricamento ricette...</p>
	{/if}
</section>

<!-- BOTTONE AGGIUNGI RICETTA FLOTTANTE -->
{#if isAuthenticated}
	<a
		href="/aggiungiRicetta"
		class="btn-float"
		title="Aggiungi ricetta"
		aria-label="Aggiungi ricetta"
	>
		<span class="material-symbols-outlined plus-icon">add</span>
	</a>
{/if}

<style>
	.carosello {
		scrollbar-width: none; /* Firefox */
		-ms-overflow-style: none; /* Internet Explorer 10+ */
	}

	.carosello::-webkit-scrollbar {
		display: none; /* Chrome, Safari and Opera */
	}

	.categorie {
		display: flex;
		flex-wrap: nowrap;
		gap: 10px;
		transform: translateY(5px);
		overflow-x: auto;
		padding-bottom: 0.5rem;
		scroll-snap-type: x mandatory;
		-webkit-overflow-scrolling: touch;
	}

	.categorie button {
		padding: 0.5rem 1rem;
		border: none;
		background-color: #f1f5f5; /* colore grigio chiaro richiesto */
		color: #333; /* testo scuro */
		cursor: pointer;
		border-radius: 20px;
		font-weight: bold;
		transition:
			background-color 0.3s ease,
			transform 0.2s ease;
		flex-shrink: 0;
		scroll-snap-align: start;
	}

	.categorie button:hover {
		background-color: #d1d5db; /* un po' più scuro al passaggio */
		transform: scale(1.05);
	}

	.categorie button.selected {
		background-color: #70b9be; /* colore azzurro selezionato */
		color: white;
	}

	.navbar {
		display: flex;
		justify-content: space-between;
		align-items: center; /* Allinea logo e icone sulla stessa linea */
		background-color: #ffffff; /* Bianco */
		color: #333;
		padding: 0.75rem 1.5rem;
		border-bottom: 1px solid #e2e8f0; /* Grigio chiaro */
		position: relative;
	}

	.navbar-left .logo {
		font-family: 'Pacifico', cursive;
		font-weight: 400;
		font-size: 1.4rem;
		color: #333;
		letter-spacing: 0.02em; /* leggero spazio tra le lettere */
		line-height: 100%;
	}

	.navbar-right {
		display: flex;
		align-items: center;
		gap: 1rem;
		position: relative;
	}

	.navbar-right button {
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
	.card-link {
		text-decoration: none;
		color: inherit;
		display: inline-block;
		transition: transform 0.2s ease;
	}

	.card-link:hover {
		transform: scale(1.02);
	}

	h2 {
		font-family: 'Afacad', sans-serif;
		color: #3a3a3a;
		font-weight: 600;
		font-size: 25px;
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

	.user-menu a {
		text-decoration: none;
		display: block;
		font-weight: 600;
		font-size: 0.9rem;
		padding: 0.5rem 0;
		border-radius: 0.375rem;
	}

	.user-menu a:hover {
		background-color: #e0f7f8;
	}

	.user-menu a:first-child {
		background-color: #70b9be;
		color: white;
		margin-bottom: 0.5rem;
		text-align: center;
	}

	.user-menu a:first-child:hover {
		background-color: #5ca6aa;
	}

	.user-menu a:last-child {
		border: 1px solid #70b9be;
		color: #70b9be;
		text-align: center;
	}

	.user-menu a:last-child:hover {
		background-color: #f0fdfd;
	}

	/* BOTTONE FLOTTANTE */
	.btn-float {
		position: fixed;
		bottom: 2rem;
		right: 2rem;
		width: 56px;
		height: 56px;
		background-color: #70b9be;
		color: white;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
		cursor: pointer;
		transition:
			background-color 0.3s ease,
			transform 0.2s ease;
		z-index: 10000;
		text-decoration: none;
		font-size: 2.5rem;
		user-select: none;
	}

	.btn-float:hover {
		background-color: #5ca6aa;
		transform: scale(1.1);
	}

	.plus-icon {
		font-size: 2.8rem;
		line-height: 1;
	}

	.icon-button {
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
