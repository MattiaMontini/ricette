import { getRicetta } from "$lib/api";

export async function load({ params }) {
    const { id } = params;
    const ricetta = await getRicetta(id);
    return { ricetta };
}