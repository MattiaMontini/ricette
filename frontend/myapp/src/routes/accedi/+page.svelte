<script>
	import { onMount } from 'svelte';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleLogin() {
		error = '';
		loading = true;

		try {
			const res = await fetch('https://ricette.onrender.com/api/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password })
			});

			const data = await res.json();

			if (!res.ok) {
				error = data.error || 'Credenziali errate o errore nel login';
				loading = false;
				return;
			}

			// Salvo il token JWT nel localStorage
			localStorage.setItem('token', data.token);

			// Puoi salvare anche i dati utente se vuoi
			localStorage.setItem('user', JSON.stringify(data.user));

			// Reindirizzo alla pagina delle ricette
			window.location.href = '/ricette';
		} catch (e) {
			error = 'Errore di connessione al server';
			loading = false;
		}
	}
</script>

<svelte:head>
	<!-- DaisyUI + Tailwind da CDN -->
	<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</svelte:head>

<main class="min-h-screen bg-white flex items-center justify-center p-6">
	<div class="w-full max-w-sm bg-base-100 p-8 rounded-lg shadow-lg relative mt-24">
		<img
			src="PizzaAccedi.png"
			alt="Pizza Seduta"
			class="absolute -top-38 left-1/2 transform -translate-x-1/2 w-48 h-48 object-contain"
		/>

		<h2 class="text-2xl font-bold mb-6 text-center text-[#70B9BE]">Accedi</h2>

		{#if error}
			<p class="text-red-500 text-center mb-4">{error}</p>
		{/if}

		<div class="form-control mb-4">
			<label class="label">
				<span class="label-text">Email</span>
			</label>
			<input
				type="email"
				bind:value={email}
				placeholder="Inserisci la tua email"
				class="input input-bordered"
				required
			/>
		</div>

		<div class="form-control mb-4">
			<label class="label">
				<span class="label-text">Password</span>
			</label>
			<input
				type="password"
				bind:value={password}
				placeholder="Inserisci la tua password"
				class="input input-bordered"
				required
			/>
		</div>

		<div class="form-control mb-4">
			<button
				class="btn w-full text-white"
				style="background-color: #70B9BE;"
				on:click={handleLogin}
				disabled={loading}
			>
				{#if loading}
					Caricamento...
				{:else}
					Accedi
				{/if}
			</button>
		</div>

		<div class="text-sm text-center mt-4">
			Non hai un account?
			<a href="/registrati" class="text-blue-600 hover:underline">Registrati</a>
		</div>

		<div class="text-center mt-6">
			<a href="/" class="text-blue-600 hover:text-blue-800 text-sm font-semibold">
				← Torna alla home
			</a>
		</div>
	</div>
</main>
