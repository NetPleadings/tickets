import { json } from '@sveltejs/kit';
import { getBookingWindowDays } from '$lib/server/auth';

export async function GET({ locals }) {
	const windowDays = await getBookingWindowDays();
	return json({
		ok: true,
		user: locals.user,
		bookingWindowDays: windowDays,
	});
}
