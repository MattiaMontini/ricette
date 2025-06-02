<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { getRicetta } from '$lib/api.js';

	let utenteAutenticato = false;
	let numeroCarrello = 0;
	let isAuthenticated = true;
	let showUserMenu = false;
	let user = null;
	let ingredienti = [];

	onMount(async () => {
		const token = localStorage.getItem('token'); // cambia la chiave se diversa
		utenteAutenticato = !!token;
		// Se autenticato, recupera info utente da localStorage
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

		// Chiudi il menu se clicchi fuori
		const closeMenu = () => {
			showUserMenu = false;
		};
		window.addEventListener('click', closeMenu);
		onDestroy(() => {
			window.removeEventListener('click', closeMenu);
		});
	});

	let ricetta = null;
	let errore = null;
	let porzioniAttive = 1;
	const unsubscribe = page.subscribe(($page) => {
		const id = $page.params.id;
		if (id) {
			caricaRicetta(id);
		}
	});

	async function caricaRicetta(id) {
		try {
			ricetta = await getRicetta(id);
			porzioniAttive = ricetta?.porzioni || 1;
		} catch (e) {
			errore = 'Errore nel caricamento della ricetta.';
		}
	}

	function estraiNumero(quantita) {
		if (!quantita) return NaN;
		const match = quantita.match(/[\d,.]+/);
		if (match) {
			return parseFloat(match[0].replace(',', '.'));
		}
		return NaN;
	}

	function estraiUnita(quantita) {
		if (!quantita) return '';
		const match = quantita.match(/[a-zA-Z%°]+/);
		return match ? match[0] : '';
	}

	function calcolaQuantita(ingrediente) {
		if (!ricetta || !ricetta.porzioni) return ingrediente.quantita || '';

		const contieneNumero = /[\d,.]/.test(ingrediente.quantita);

		if (!contieneNumero) {
			// Non ci sono numeri, mostra la stringa originale
			return ingrediente.quantita;
		}

		const quantitaNum = estraiNumero(ingrediente.quantita);

		// Se il numero estratto non è valido, mostra la stringa originale
		if (isNaN(quantitaNum) || quantitaNum === 0) {
			return ingrediente.quantita;
		}

		const porzioniOriginali = ricetta.porzioni;
		const quantitaCalcolata = (quantitaNum * porzioniAttive) / porzioniOriginali;

		// Mostra senza decimali se intero, altrimenti con 2 decimali
		return Number.isInteger(quantitaCalcolata)
			? quantitaCalcolata.toString()
			: quantitaCalcolata.toFixed(2);
	}

	async function aggiungiAlCarrello() {
		if (!ricetta || !ricetta.ingredienti) return;

		const token = localStorage.getItem('token');
		if (!token) {
			alert('Devi essere loggato per aggiungere al carrello.');
			return;
		}

		// Calcola le quantità per le porzioni scelte
		const ingredienti = ricetta.ingredienti.map((ingrediente) => {
			const quantitaNum = estraiNumero(ingrediente.quantita);
			const unita = ingrediente.unita || estraiUnita(ingrediente.quantita);

			if (isNaN(quantitaNum)) {
				return { nome: ingrediente.nome, quantita: 'q.b.', unita: '' };
			}

			const porzioniOriginali = ricetta.porzioni;
			const quantitaCalcolata = (quantitaNum * porzioniAttive) / porzioniOriginali;

			return {
				nome: ingrediente.nome,
				quantita: quantitaCalcolata.toFixed(2),
				unita
			};
		});

		try {
			const res = await fetch('http://localhost:3000/api/carrello', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				},
				body: JSON.stringify({ ingredienti })
			});

			if (!res.ok) {
				const err = await res.json();
				throw new Error(err.error || 'Errore durante l’aggiunta al carrello');
			}

			alert('Ingredienti aggiunti al carrello!');
		} catch (err) {
			alert(err.message);
		}
	}

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
</script>

<svelte:head>
	<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
		rel="stylesheet"
	/>
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

{#if errore}
	<div class="alert alert-error shadow-lg max-w-xl mx-auto mt-8">
		<span>{errore}</span>
	</div>
{:else if !ricetta}
	<div class="text-center text-gray-600 mt-12 text-lg">Caricamento ricetta...</div>
{:else}
	<article class="max-w-3xl mx-auto p-6">
		<div class="card bg-base-100 shadow-xl">
			<figure>
				<img
					class="w-full max-h-96 object-cover"
					src={'/' + ricetta.immagine}
					alt={`Immagine di ${ricetta.titolo}`}
				/>
			</figure>
			<div class="card-body">
				<h1 class="card-title text-3xl font-bold text-primary">{ricetta.titolo}</h1>
				<p class="text-sm text-gray-500 mb-2 flex items-center gap-2">
					<span class="material-symbols-outlined text-[#70B9BE]">person</span>
					<strong>{ricetta.autore}</strong>
				</p>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm text-gray-700 mb-4">
					<div><strong>Preparazione:</strong> {ricetta.tempoPreparazione} min</div>
					<div><strong>Porzioni originali:</strong> {ricetta.porzioni}</div>
					<div class="flex items-center gap-1">
						<strong>Difficoltà:</strong>
						{#each Array(ricetta.difficolta) as _}
							<span class="stelle">★</span>
						{/each}
					</div>
				</div>

				<div class="mb-4 flex items-center gap-2">
					<label class="font-semibold">Porzioni:</label>
					<button
						class="btn btn-sm btn-outline"
						on:click={() => (porzioniAttive = Math.max(1, porzioniAttive - 1))}>-</button
					>
					<span class="mx-2">{porzioniAttive}</span>
					<button class="btn btn-sm btn-outline" on:click={() => (porzioniAttive += 1)}>+</button>
				</div>

				<section class="mb-6">
					<h2 class="text-xl font-semibold mb-2">Ingredienti</h2>
					<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
						{#each ricetta.ingredienti as ingrediente}
							<div class="card shadow-sm bg-base-200 text-sm p-3">
								<div class="font-medium">{ingrediente.nome}</div>
								<div class="text-gray-600">
									{calcolaQuantita(ingrediente)}
									{ingrediente.unita || estraiUnita(ingrediente.quantita)}
								</div>
							</div>
						{/each}
					</div>
				</section>

				<section class="mb-6">
					<h2 class="text-xl font-semibold mb-4">Preparazione</h2>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{#each ricetta.istruzioni as passo, index}
							<div class="card bg-base-200 shadow-md">
								<div class="card-body p-4">
									<h3 class="card-title text-md font-semibold mb-2">Fase {index + 1}</h3>
									<p class="text-gray-700 text-sm">{passo}</p>
								</div>
							</div>
						{/each}
					</div>
				</section>
				{#if utenteAutenticato}
					<button
						class="btn btn-sm"
						style="background-color: #70B9BE; border-color: #70B9BE; color: white;"
						on:click={aggiungiAlCarrello}
					>
						Aggiungi al carrello
					</button>
				{/if}

				<div class="max-w-3xl mx-auto px-6 py-4">
					<a href="/ricette" class="btn btn-outline btn-sm"> ← Torna alle ricette </a>
				</div>
			</div>
		</div>
	</article>
{/if}

<style>
	h1 {
		color: #70b9be;
	}
	.stelle {
		color: gold;
		font-size: 1.1rem;
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
