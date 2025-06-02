<script>
	let { titolo, immagine, tempoPreparazione, porzioni, difficolta } = $props();
</script>

<div class="card">
	<img class="immagine" src={immagine} alt={titolo} />
	<div class="contenuto">
		<h2>{titolo}</h2>
		<p><strong>Tempo:</strong> {tempoPreparazione} min</p>
		<p><strong>Porzioni:</strong> {porzioni}</p>
		<p>
			<strong>Difficoltà:</strong>
			{#each Array(difficolta) as _}
				<span class="stelle">★</span>
			{/each}
		</p>
	</div>
</div>

<style>
	.card {
		width: 220px;
		border: 1px solid #ddd;
		border-radius: 10px;
		overflow: hidden;
		box-shadow: 0 3px 8px rgba(0, 0, 0, 0.08);
		background-color: #fff;
		transition: transform 0.2s;
	}

	.card:hover {
		transform: scale(1.03);
	}

	.immagine {
		width: 100%;
		height: 140px;
		object-fit: cover;
	}

	.contenuto {
		padding: 12px;
		text-align: left;
	}

	h2 {
		font-size: 1rem;
		margin-bottom: 8px;
		color: #000;
	}

	p {
		margin: 3px 0;
		font-size: 0.85rem;
		color: #555;
	}

	.stelle {
		color: gold;
	}
</style>
