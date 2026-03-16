import { json } from '@sveltejs/kit';
import {
	loadRequests,
	loadRequestsByEmail,
	insertRequest,
	updateRequestStatus,
	insertAllocation,
	type TicketRequest,
} from '$lib/server/bigquery.js';
import { getBookingWindowDays } from '$lib/server/auth.js';
import { events, seats } from '$lib/data/schedule.js';

export async function GET({ locals }) {
	const allRequests = await loadRequests();

	// Admins and managers see everything
	if (locals.user.role === 'admin' || locals.user.role === 'manager') {
		return json({ ok: true, requests: allRequests });
	}

	// Viewers see their own requests in full detail
	const myRequests = allRequests.filter((r) => r.requesterEmail === locals.user.email);

	// Plus all other pending requests with minimal info (for availability counts)
	const otherPending = allRequests
		.filter((r) => r.status === 'pending' && r.requesterEmail !== locals.user.email)
		.map((r) => ({
			id: r.id,
			eventId: r.eventId,
			seatCount: r.seatCount,
			status: r.status,
			requesterEmail: '',
			requesterName: '',
			createdAt: r.createdAt,
		}));

	return json({ ok: true, requests: [...myRequests, ...otherPending] });
}

export async function POST({ request, locals }) {
	const body = await request.json();

	switch (body.action) {
		case 'create': {
			// Check booking window
			const windowDays = await getBookingWindowDays();
			const event = events.find((e) => e.id === body.eventId);
			if (!event) {
				return json({ ok: false, error: 'Event not found' }, { status: 400 });
			}

			// Admins are exempt from booking window
			if (locals.user.role !== 'admin') {
				const eventDate = new Date(event.date + 'T00:00:00');
				const cutoff = new Date();
				cutoff.setDate(cutoff.getDate() + windowDays);
				if (eventDate > cutoff) {
					return json({ ok: false, error: `This game is outside the booking window (${windowDays} days). Check back later.` }, { status: 400 });
				}
			}

			// Validate companions — max 3, each must have a name and type
			const companions = Array.isArray(body.companions)
				? body.companions.slice(0, 3).map((c: { name: string; type: string; email?: string; company?: string }) => ({
					name: String(c.name || '').trim(),
					type: c.type === 'guest' ? 'guest' as const : 'team' as const,
					email: c.email ? String(c.email).trim() : undefined,
					company: c.company ? String(c.company).trim() : undefined,
				})).filter((c: { name: string }) => c.name)
				: undefined;

			const req: TicketRequest = {
				id: `req-${Date.now()}`,
				eventId: body.eventId,
				requesterEmail: locals.user.email,
				requesterName: body.requesterName || locals.user.email.split('@')[0],
				seatCount: body.seatCount || 1,
				companions: companions?.length ? companions : undefined,
				status: 'pending',
				createdAt: new Date().toISOString(),
				notes: body.notes || '',
			};
			await insertRequest(req);
			return json({ ok: true, request: req });
		}

		case 'approve': {
			if (locals.user.role !== 'admin') {
				return json({ ok: false, error: 'Forbidden' }, { status: 403 });
			}
			await updateRequestStatus(body.id, 'approved', locals.user.email);

			// Auto-create allocations for requester + companions on available seats
			if (body.eventId && body.requesterEmail && body.requesterName) {
				const { loadAllocations: loadAllocs } = await import('$lib/server/bigquery.js');
				const existing = await loadAllocs();
				const eventAllocs = existing.filter((a) => a.eventId === body.eventId);
				const eventSeats = seats.filter((s) => s.eventId === body.eventId);
				const availableSeats = eventSeats.filter(
					(s) => !eventAllocs.some((a) => a.seatId === s.id)
				);

				// Load the full request to get companions
				const allRequests = await loadRequests();
				const req = allRequests.find((r) => r.id === body.id);

				// Build list of people to assign: requester + companions
				const toAssign: { name: string; email: string; isGuest: boolean; company?: string }[] = [
					{ name: body.requesterName, email: body.requesterEmail, isGuest: false },
				];
				if (req?.companions) {
					for (const c of req.companions) {
						toAssign.push({
							name: c.name,
							email: c.email || '',
							isGuest: c.type === 'guest',
							company: c.company,
						});
					}
				}

				const seatCount = Math.min(toAssign.length, availableSeats.length);
				const newAllocations = [];
				for (let i = 0; i < seatCount; i++) {
					const person = toAssign[i]!;
					const seat = availableSeats[i]!;
					const alloc = {
						id: `alloc-${Date.now() + i}`,
						eventId: body.eventId,
						seatId: seat.id,
						assignee: person.name,
						assigneeEmail: person.email,
						status: 'pending' as const,
						assignedBy: locals.user.email,
						assignedAt: new Date().toISOString(),
						notes: `From request ${body.id}`,
						isGuest: person.isGuest,
						guestCompany: person.company ?? '',
					};
					await insertAllocation(alloc);
					newAllocations.push(alloc);
				}
				return json({ ok: true, allocations: newAllocations, seatsAssigned: seatCount, seatsRequested: toAssign.length });
			}
			return json({ ok: true });
		}

		case 'reject': {
			if (locals.user.role !== 'admin') {
				return json({ ok: false, error: 'Forbidden' }, { status: 403 });
			}
			await updateRequestStatus(body.id, 'rejected', locals.user.email);
			return json({ ok: true });
		}

		case 'cancel': {
			// Users can cancel their own pending requests
			const allRequests = await loadRequests();
			const req = allRequests.find((r) => r.id === body.id);
			if (!req) {
				return json({ ok: false, error: 'Request not found' }, { status: 404 });
			}
			if (req.requesterEmail !== locals.user.email && locals.user.role !== 'admin') {
				return json({ ok: false, error: 'Forbidden' }, { status: 403 });
			}
			if (req.status !== 'pending') {
				return json({ ok: false, error: 'Only pending requests can be cancelled' }, { status: 400 });
			}
			await updateRequestStatus(body.id, 'cancelled', locals.user.email);
			return json({ ok: true });
		}

		default:
			return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	}
}
