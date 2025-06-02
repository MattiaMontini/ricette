<script>
	import { onMount } from 'svelte';

	let ingredienti = [];
	let errore = '';
	let numeroCarrello = 0;
	let isAuthenticated = true;
	let showUserMenu = false;
	let user = null;

	onMount(async () => {
		try {
			const token = localStorage.getItem('token');
			isAuthenticated = !!token;

			// Se autenticato, recupera info utente da localStorage
			if (isAuthenticated) {
				const userString = localStorage.getItem('user');
				user = userString ? JSON.parse(userString) : null;

				// Recupera il numero di elementi nel carrello dal backend
				try {
					const res = await fetch('https://ricette.onrender.com/api/carrello', {
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
		} catch (error) {
			console.error('Errore onMount:', error);
		}
	});

	async function svuotaCarrello() {
		try {
			const token = localStorage.getItem('token');
			if (!token) throw new Error('Non autenticato');

			const res = await fetch('https://ricette.onrender.com/api/carrello', {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) {
				throw new Error('Errore durante la cancellazione del carrello');
			}

			// Aggiorna la lista ingredienti e numeroCarrello
			ingredienti = [];
			numeroCarrello = 0;
		} catch (error) {
			errore = error.message;
			console.error(error);
		}
	}

	async function rimuoviIngrediente(nome) {
		try {
			const token = localStorage.getItem('token');
			if (!token) throw new Error('Non autenticato');

			const res = await fetch(`https://ricette.onrender.com/api/carrello/${encodeURIComponent(nome)}`, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${token}`
				}
			});

			if (!res.ok) throw new Error("Errore nella rimozione dell'ingrediente");

			// Aggiorna lista dopo rimozione
			ingredienti = ingredienti.filter((i) => i.nome !== nome);
			numeroCarrello = ingredienti.length;
		} catch (err) {
			console.error('Errore rimozione ingrediente:', err);
			errore = err.message;
		}
	}

	async function scaricaPDF() {
		const { jsPDF } = window.jspdf;
		const doc = new jsPDF();

		// Aggiungi logo
		const logo = new Image();
		logo.src = '/logo.png'; // Usa il tuo percorso corretto (es. /logo.png)
		await new Promise((resolve) => {
			logo.onload = resolve;
		});
		doc.addImage(logo, 'PNG', 150, 10, 40, 40); // (x, y, width, height)

		// Titolo
		doc.setFontSize(18);
		doc.text('Il tuo carrello', 20, 30);

		// Lista ingredienti
		doc.setFontSize(12);
		let y = 45;
		ingredienti.forEach((ingr, i) => {
			doc.text(`- ${ingr.nome}: ${ingr.quantita} ${ingr.unita}`, 20, y);
			y += 8;
			if (y > 280) {
				doc.addPage();
				y = 20;
			}
		});

		doc.save('carrello.pdf');
	}

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
	<!-- DaisyUI + Tailwind da CDN -->
	<link href="https://fonts.googleapis.com/css2?family=Afacad&display=swap" rel="stylesheet" />
	<link
		href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined"
		rel="stylesheet"
	/>
	<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
	<link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet" />
	<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
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
	<div class="alert alert-error text-red-600">{errore}</div>
{:else if ingredienti.length === 0}
	<div class="text-center mt-8">Il tuo carrello è vuoto.</div>
{:else}
	<article class="max-w-xl mx-auto p-4">
		<h1 class="text-2xl font-bold mb-4 text-center">Il tuo carrello</h1>
		<ul class="space-y-2">
			{#each ingredienti as ingr}
				<li class="p-2 bg-base-200 rounded shadow flex justify-between items-center">
					<div>
						<span>{ingr.nome}</span> - <span>{ingr.quantita} {ingr.unita}</span>
					</div>
					<button
						class="ml-4 bg-red-500 hover:bg-red-600 text-white text-sm font-bold py-1 px-2 rounded"
						on:click={() => rimuoviIngrediente(ingr.nome)}
					>
						X
					</button>
				</li>
			{/each}
		</ul>

		<button
			on:click={svuotaCarrello}
			class="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded block mx-auto"
		>
			Svuota carrello
		</button>

		<button
			on:click={scaricaPDF}
			class="mt-6 bg-[#70B9BE] hover:bg-[#5ca6aa] text-white font-bold py-2 px-4 rounded block mx-auto"
		>
			Scarica PDF
		</button>
	</article>
{/if}

<div class="max-w-3xl mx-auto px-6 py-4 flex justify-center">
	<a href="/ricette" class="btn btn-outline btn-sm"> ← Torna alle ricette </a>
</div>

<style>
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

	.bg-base-200 {
		background-color: #f3f4f6;
	}

	.alert-error {
		background-color: #fee2e2;
		border: 1px solid #fca5a5;
		padding: 1rem;
		border-radius: 0.5rem;
		text-align: center;
		margin: 1rem auto;
		max-width: 400px;
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
