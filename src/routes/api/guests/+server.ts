import { json } from '@sveltejs/kit';
import { loadGuests, insertGuest, updateGuest } from '$lib/server/bigquery.js';

export async function GET() {
	const guests = await loadGuests();
	return json({ ok: true, guests });
}

export async function POST({ request }: { request: Request }) {
	const body = await request.json();

	switch (body.action) {
		case 'add':
			await insertGuest(body.guest);
			return json({ ok: true });

		case 'update':
			await updateGuest(body.id, body.fields);
			return json({ ok: true });

		default:
			return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	}
}
