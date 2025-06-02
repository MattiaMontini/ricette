<script>
	import { onMount } from 'svelte';

	let titolo = '';
	let autore = '';
	let ingredienti = [{ nome: '', quantita: '' }];
	let istruzioni = [''];
	let tempoPreparazione = '';
	let tempoCottura = '';
	let porzioni = '';
	let categoria = '';
	let difficolta = '';
	let immagine = null;
	let categorie = [];
	let error = '';
	let success = '';

	// Overlay pizza
	let showPizzaOverlay = false;

	onMount(async () => {
		const userData = localStorage.getItem('user');
		if (userData) {
			try {
				const user = JSON.parse(userData);
				if (user && user.nome && user.cognome) {
					autore = `${user.nome} ${user.cognome}`.trim();
				} else {
					autore = userData;
				}
			} catch {
				autore = userData;
			}
		}

		try {
			const res = await fetch('http://localhost:3000/categorie');
			if (res.ok) {
				categorie = await res.json();
			} else {
				console.error('Errore caricamento categorie');
			}
		} catch (e) {
			console.error('Errore caricamento categorie:', e);
		}
	});

	function aggiungiIngrediente() {
		ingredienti = [...ingredienti, { nome: '', quantita: '' }];
	}

	function rimuoviIngrediente(index) {
		ingredienti = ingredienti.filter((_, i) => i !== index);
	}

	function aggiungiIstruzione() {
		istruzioni = [...istruzioni, ''];
	}

	function rimuoviIstruzione(index) {
		istruzioni = istruzioni.filter((_, i) => i !== index);
	}

	async function handleSubmit() {
		error = '';
		success = '';

		if (!titolo.trim()) {
			error = 'Inserisci il titolo.';
			return;
		}

		if (!autore.trim()) {
			error = "Inserisci l'autore.";
			return;
		}

		if (!porzioni || isNaN(porzioni) || porzioni <= 0) {
			error = 'Inserisci un numero valido di porzioni.';
			return;
		}

		if (!difficolta || difficolta < 1 || difficolta > 5) {
			error = 'Inserisci una difficoltà valida da 1 a 5.';
			return;
		}

		if (!categoria) {
			error = 'Seleziona una categoria.';
			return;
		}

		if (ingredienti.length === 0 || ingredienti.some((i) => !i.nome.trim() || !i.quantita.trim())) {
			error = 'Inserisci almeno un ingrediente con nome e quantità valide.';
			return;
		}

		if (istruzioni.length === 0 || istruzioni.some((i) => !i.trim())) {
			error = "Inserisci almeno un'istruzione valida.";
			return;
		}

		if (!immagine) {
			error = "Seleziona un'immagine.";
			return;
		}

		try {
			const token = localStorage.getItem('token');
			if (!token) {
				error = 'Utente non autenticato.';
				return;
			}

			const formData = new FormData();
			formData.append('titolo', titolo.trim());
			formData.append('autore', autore.trim());
			formData.append('ingredienti', JSON.stringify(ingredienti));
			formData.append('istruzioni', JSON.stringify(istruzioni.map((i) => i.trim())));
			formData.append('tempoPreparazione', tempoPreparazione || '');
			formData.append('tempoCottura', tempoCottura || '');
			formData.append('porzioni', porzioni);
			formData.append('categoria', categoria);
			formData.append('difficolta', difficolta);
			formData.append('immagine', immagine);

			const res = await fetch('http://localhost:3000/ricette', {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${token}`
				},
				body: formData
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || "Errore durante l'aggiunta della ricetta");
			}

			success = 'Ricetta aggiunta con successo!';
			showPizzaOverlay = true;

			setTimeout(() => {
				showPizzaOverlay = false;
			}, 3000); // nasconde overlay dopo 3 secondi

			// Reset campi
			titolo = '';
			ingredienti = [{ nome: '', quantita: '' }];
			istruzioni = [''];
			tempoPreparazione = '';
			tempoCottura = '';
			porzioni = '';
			categoria = '';
			difficolta = '';
			immagine = null;
			document.getElementById('immagine').value = '';
		} catch (e) {
			error = e.message;
		}
	}
</script>

<svelte:head>
	<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css" />
	<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
</svelte:head>

<!-- Overlay pizza -->
{#if showPizzaOverlay}
	<div class="fixed inset-0 bg-cyan-200/30 backdrop-blur flex items-center justify-center z-50">
		<img src="PizzaAggiunto.png" alt="Pizza" class="max-w-xs h-96 object-contain" />
	</div>
{/if}

<!-- Form per aggiungere ricetta -->
<section class="max-w-xl mx-auto p-6 sm:p-8 md:p-10 bg-white rounded shadow-md">
	<h1 class="text-2xl font-bold mb-4">Aggiungi una nuova ricetta</h1>

	{#if error}
		<div class="alert alert-error mb-4">{error}</div>
	{/if}

	{#if success}
		<div class="alert alert-success mb-4">{success}</div>
	{/if}

	<form on:submit|preventDefault={handleSubmit} class="space-y-4 overflow-x-auto">
		<!-- Titolo -->
		<div>
			<label class="label"><span class="label-text font-semibold">Titolo</span></label>
			<input type="text" bind:value={titolo} class="input input-bordered w-full" required />
		</div>

		<!-- Autore -->
		<div>
			<label class="label"><span class="label-text font-semibold">Autore</span></label>
			<input type="text" bind:value={autore} class="input input-bordered w-full" readonly />
		</div>

		<!-- Ingredienti -->
		<div>
			<label class="label font-semibold">Ingredienti</label>
			{#each ingredienti as ingrediente, i}
				<div class="flex gap-2 mb-2">
					<input
						type="text"
						bind:value={ingredienti[i].nome}
						placeholder="Nome"
						class="input input-bordered flex-grow"
					/>
					<input
						type="text"
						bind:value={ingredienti[i].quantita}
						placeholder="Quantità"
						class="input input-bordered w-32"
					/>
					{#if ingredienti.length > 1}
						<button
							type="button"
							class="btn btn-error btn-square"
							on:click={() => rimuoviIngrediente(i)}>✕</button
						>
					{/if}
				</div>
			{/each}
			<button type="button" class="btn btn-outline btn-sm" on:click={aggiungiIngrediente}
				>+ Aggiungi ingrediente</button
			>
		</div>

		<!-- Istruzioni -->
		<div>
			<label class="label font-semibold">Istruzioni</label>
			{#each istruzioni as istruzione, i}
				<div class="flex gap-2 mb-2">
					<textarea bind:value={istruzioni[i]} class="textarea textarea-bordered flex-grow" rows="2"
					></textarea>
					{#if istruzioni.length > 1}
						<button
							type="button"
							class="btn btn-error btn-square"
							on:click={() => rimuoviIstruzione(i)}>✕</button
						>
					{/if}
				</div>
			{/each}
			<button type="button" class="btn btn-outline btn-sm" on:click={aggiungiIstruzione}
				>+ Aggiungi istruzione</button
			>
		</div>

		<!-- Tempi -->
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<label class="label font-semibold">Tempo Preparazione</label>
				<input
					type="number"
					min="0"
					bind:value={tempoPreparazione}
					class="input input-bordered w-full"
				/>
			</div>
			<div>
				<label class="label font-semibold">Tempo Cottura</label>
				<input
					type="number"
					min="0"
					bind:value={tempoCottura}
					class="input input-bordered w-full"
				/>
			</div>
		</div>

		<!-- Porzioni -->
		<div>
			<label class="label font-semibold">Porzioni</label>
			<input
				type="number"
				min="1"
				bind:value={porzioni}
				class="input input-bordered w-full"
				required
			/>
		</div>

		<!-- Categoria -->
		<div>
			<label class="label font-semibold">Categoria</label>
			<select bind:value={categoria} class="select select-bordered w-full" required>
				<option value="" disabled>Seleziona categoria</option>
				{#each categorie as c}
					<option value={c}>{c}</option>
				{/each}
			</select>
		</div>

		<!-- Difficoltà -->
		<div>
			<label class="label font-semibold">Difficoltà (1-5)</label>
			<input
				type="number"
				min="1"
				max="5"
				bind:value={difficolta}
				class="input input-bordered w-full"
				required
			/>
		</div>

		<!-- Immagine -->
		<div>
			<label class="label font-semibold">Immagine</label>
			<input
				id="immagine"
				type="file"
				accept="image/*"
				on:change={(e) => (immagine = e.target.files[0])}
				class="file-input file-input-bordered w-full"
				required
			/>
		</div>

		<!-- Submit -->
		<div class="flex justify-center">
			<button type="submit" class="btn btn-primary">Aggiungi Ricetta</button>
		</div>
	</form>

	<div class="mt-6 flex justify-center">
		<a href="/ricette" class="btn btn-outline btn-sm">← Torna alle ricette</a>
	</div>
</section>

<style>
	button.btn-primary {
		background-color: #70b9be;
		border-color: #70b9be;
		color: white;
	}

	button.btn-primary:hover {
		background-color: #5ca6aa;
		border-color: #5ca6aa;
	}

	button.btn-error.btn-square {
		min-width: 2.5rem;
	}

	form {
		overflow-x: auto;
	}
</style>
