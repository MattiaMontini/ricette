import { getRicette } from '$lib/api.js';

export async function load() {
    return { ricette: await getRicette() };
}
