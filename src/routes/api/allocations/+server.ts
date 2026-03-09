import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { loadAllocations, saveAllocations } from '$lib/server/storage.js';

// GET — load all allocations
export const GET: RequestHandler = async () => {
	const allocations = loadAllocations();
	return json({ ok: true, allocations });
};

// POST — save all allocations (full replace)
export const POST: RequestHandler = async ({ request }) => {
	const { allocations } = await request.json();
	saveAllocations(allocations);
	return json({ ok: true });
};
