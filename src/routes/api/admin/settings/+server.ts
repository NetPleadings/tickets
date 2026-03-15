import { json } from '@sveltejs/kit';
import { getSetting, setSetting } from '$lib/server/auth';

export async function GET({ locals }) {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}
	const bookingWindowDays = await getSetting('booking_window_days') ?? '60';
	return json({ ok: true, settings: { bookingWindowDays } });
}

export async function POST({ request, locals }) {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}
	const body = await request.json();

	if (body.key && body.value !== undefined) {
		await setSetting(body.key, String(body.value), locals.user.email);
		return json({ ok: true });
	}

	return json({ ok: false, error: 'Missing key/value' }, { status: 400 });
}
