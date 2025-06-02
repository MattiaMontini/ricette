const BASE_URL = 'https://ricette.onrender.com';


export async function getRicette() {
  const res = await fetch(`${BASE_URL}/ricette`);
  return await res.json();
}

export async function generaListaSpesa(payload) {
  const res = await fetch(`${BASE_URL}/lista-spesa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}
export async function aggiungiRicetta(formData, token) {
  const res = await fetch(`${BASE_URL}/ricette`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore durante l\'aggiunta della ricetta');
  }
  return await res.json();
}


export async function getCategorie() {
  const res = await fetch(`${BASE_URL}/categorie`); // o il tuo endpoint reale
  if (!res.ok) throw new Error('Errore nel fetch delle categorie');
  return await res.json();
}

export async function getRicetta(id) {
  const res = await fetch(`${BASE_URL}/ricette/${id}`);
  if (!res.ok) throw new Error('Errore nel fetch della ricetta');
  return await res.json();
}

export async function svuotaCarrello(token) {
  const res = await fetch(`${BASE_URL}/api/carrello`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore durante lo svuotamento del carrello');
  }
  return await res.json();
}

export async function rimuoviIngredienteCarrello(nomeIngrediente, token) {
  const res = await fetch(`${BASE_URL}/api/carrello/${encodeURIComponent(nomeIngrediente)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || 'Errore durante la rimozione dell\'ingrediente');
  }

  return await res.json();
}
