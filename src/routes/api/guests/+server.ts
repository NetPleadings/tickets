import { json } from '@sveltejs/kit';
import { loadGuests, saveGuests } from '$lib/server/storage';

export async function GET() {
	const guests = loadGuests();
	return json({ ok: true, guests });
}

export async function POST({ request }) {
	const body = await request.json();
	const guests = body.guests;
	saveGuests(guests);
	return json({ ok: true });
}
