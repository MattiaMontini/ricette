// src/lib/stores/auth.js
import { writable } from 'svelte/store';

export const user = writable(null);

export function loginUser(token, userData) {
  localStorage.setItem('token', token);
  user.set(userData);
}

export function logoutUser() {
  localStorage.removeItem('token');
  user.set(null);
}

// Carica utente dal localStorage all'avvio
export function loadUserFromStorage() {
  const token = localStorage.getItem('token');
  if (token) {
    // Potresti anche decodificare il token se vuoi mostrare il nome utente
    fetch('http://localhost:3000/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => user.set(data.user))
      .catch(() => logoutUser());
  }
}
