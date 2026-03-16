import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { loadAllocations, loadRequests, deleteAllocation } from '$lib/server/bigquery.js';
import { seats } from '$lib/data/schedule.js';

export const GET: RequestHandler = async ({ locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const [allocations, requests] = await Promise.all([loadAllocations(), loadRequests()]);

	// Find duplicate allocations (multiple rows for same seat)
	const seatMap = new Map<string, typeof allocations>();
	for (const a of allocations) {
		const key = `${a.eventId}:${a.seatId}`;
		const list = seatMap.get(key) || [];
		list.push(a);
		seatMap.set(key, list);
	}
	const duplicates = [...seatMap.entries()]
		.filter(([, list]) => list.length > 1)
		.map(([key, list]) => ({ key, allocations: list }));

	// Find orphaned allocations (seat IDs that don't exist in schedule)
	const validSeatIds = new Set(seats.map((s) => s.id));
	const orphaned = allocations.filter((a) => !validSeatIds.has(a.seatId));

	return json({
		ok: true,
		allocations,
		requests,
		issues: {
			duplicates,
			orphaned,
		},
	});
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();

	if (body.action === 'deleteAllocation') {
		await deleteAllocation(body.id);
		return json({ ok: true });
	}

	return json({ ok: false, error: 'Unknown action' }, { status: 400 });
};
