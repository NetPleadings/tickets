import { json } from '@sveltejs/kit';
import { loadGuests, insertGuest, updateGuest } from '$lib/server/bigquery.js';

export async function GET() {
	const guests = await loadGuests();
	return json({ ok: true, guests });
}

export async function POST({ request, locals }) {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}
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
