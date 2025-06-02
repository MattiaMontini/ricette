<script>
	let nome = '';
	let cognome = '';
	let email = '';
	let password = '';
	let confermaPassword = '';
	let errore = '';
	let mostraPassword = false;

	// Requisiti dinamici
	$: hasMinLength = password.length >= 8;
	$: hasUpper = /[A-Z]/.test(password);
	$: hasLower = /[a-z]/.test(password);
	$: hasNumber = /[0-9]/.test(password);
	$: hasSymbol = /[^A-Za-z0-9]/.test(password);

	function validaPassword() {
		return hasMinLength && hasUpper && hasLower && hasNumber && hasSymbol;
	}

	async function handleRegister() {
		errore = '';

		if (!validaPassword()) {
			errore = 'La password non rispetta tutti i criteri richiesti.';
			return;
		}

		if (password !== confermaPassword) {
			errore = 'Le password non coincidono.';
			return;
		}

		try {
			const res = await fetch('https://ricette.onrender.com/api/registrazione', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ nome, cognome, email, password })
			});

			const data = await res.json();

			if (!res.ok) {
				errore = data.error || 'Errore durante la registrazione';
				return;
			}

			// Salvo token e dati utente
			localStorage.setItem('token', data.token);
			localStorage.setItem('user', JSON.stringify(data.user));

			// Reindirizzo a /ricette
			window.location.href = '/ricette';
		} catch (e) {
			errore = 'Errore di connessione al server';
		}
	}
</script>

<svelte:head>
	<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</svelte:head>

<main class="min-h-screen bg-white flex items-center justify-center p-6">
	<div class="w-full max-w-sm bg-base-100 p-8 rounded-lg shadow-lg relative mt-40">
		<!-- Immagine pizza -->
		<img
			src="PizzaRegistrati.png"
			alt="Pizza Seduta"
			class="absolute -top-38 left-1/2 transform -translate-x-1/2 w-48 h-48 object-contain"
		/>

		<h2 class="text-2xl font-bold mb-6 text-center text-[#70B9BE]">Registrati</h2>

		<!-- Nome -->
		<div class="form-control mb-4">
			<label class="label"><span class="label-text">Nome</span></label>
			<input
				type="text"
				bind:value={nome}
				placeholder="Inserisci il tuo nome"
				class="input input-bordered"
				required
			/>
		</div>

		<!-- Cognome -->
		<div class="form-control mb-4">
			<label class="label"><span class="label-text">Cognome</span></label>
			<input
				type="text"
				bind:value={cognome}
				placeholder="Inserisci il tuo cognome"
				class="input input-bordered"
				required
			/>
		</div>

		<!-- Email -->
		<div class="form-control mb-4">
			<label class="label"><span class="label-text">Email</span></label>
			<input
				type="email"
				bind:value={email}
				placeholder="Inserisci la tua email"
				class="input input-bordered"
				required
			/>
		</div>

		<!-- Password -->
		<div class="form-control mb-2">
			<label class="label"><span class="label-text">Password</span></label>
			<input
				type={mostraPassword ? 'text' : 'password'}
				bind:value={password}
				placeholder="Crea una password"
				class="input input-bordered"
				required
			/>
		</div>

		<!-- Mostra/nascondi password -->
		<label class="label cursor-pointer justify-start gap-2 mb-2">
			<input type="checkbox" bind:checked={mostraPassword} class="checkbox checkbox-sm" />
			<span class="label-text text-sm">Mostra password</span>
		</label>

		<!-- Requisiti password -->
		<ul class="text-sm mb-4 space-y-1">
			<li class={hasMinLength ? 'text-green-600' : 'text-red-500'}>
				{hasMinLength ? '✅' : '❌'} Minimo 8 caratteri
			</li>
			<li class={hasUpper ? 'text-green-600' : 'text-red-500'}>
				{hasUpper ? '✅' : '❌'} Almeno una lettera maiuscola
			</li>
			<li class={hasLower ? 'text-green-600' : 'text-red-500'}>
				{hasLower ? '✅' : '❌'} Almeno una lettera minuscola
			</li>
			<li class={hasNumber ? 'text-green-600' : 'text-red-500'}>
				{hasNumber ? '✅' : '❌'} Almeno un numero
			</li>
			<li class={hasSymbol ? 'text-green-600' : 'text-red-500'}>
				{hasSymbol ? '✅' : '❌'} Almeno un simbolo (!, @, #...)
			</li>
		</ul>

		<!-- Conferma password -->
		<div class="form-control mb-4">
			<label class="label"><span class="label-text">Conferma Password</span></label>
			<input
				type={mostraPassword ? 'text' : 'password'}
				bind:value={confermaPassword}
				placeholder="Conferma la password"
				class="input input-bordered"
				required
			/>
		</div>

		<!-- Errore -->
		{#if errore}
			<div class="text-red-500 text-sm mb-4">{errore}</div>
		{/if}

		<!-- Pulsante -->
		<div class="form-control mb-4">
			<button
				class="btn w-full text-white"
				style="background-color: #70B9BE;"
				on:click={handleRegister}
			>
				Registrati
			</button>
		</div>

		<!-- Link login -->
		<div class="text-sm text-center mt-4">
			Hai già un account?
			<a href="/accedi" class="text-blue-600 hover:underline">Accedi</a>
		</div>

		<!-- Link home -->
		<div class="text-center mt-6">
			<a href="/" class="text-blue-600 hover:text-blue-800 text-sm font-semibold">
				← Torna alla home
			</a>
		</div>
	</div>
</main>
