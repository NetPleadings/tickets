import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	loadAllocations,
	insertAllocation,
	updateAllocationStatus,
	deleteAllocation,
} from '$lib/server/bigquery.js';

export const GET: RequestHandler = async () => {
	const allocations = await loadAllocations();
	return json({ ok: true, allocations });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// Only admins can directly assign/unassign/update allocations
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();

	switch (body.action) {
		case 'assign':
			await insertAllocation(body.allocation);
			return json({ ok: true });

		case 'updateStatus':
			await updateAllocationStatus(body.id, body.status);
			return json({ ok: true });

		case 'unassign':
			await deleteAllocation(body.id);
			return json({ ok: true });

		default:
			return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	}
};
