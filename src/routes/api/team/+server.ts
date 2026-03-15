import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import { listOrgUsers } from '$lib/server/directory.js';

export const GET: RequestHandler = async () => {
	// All authenticated users can see the team directory (used for companion picker).
	// IAP ensures only MinuteBox employees reach this endpoint.
	try {
		const users = await listOrgUsers();
		return json({ ok: true, users });
	} catch (err) {
		const message = err instanceof Error ? err.message : String(err);
		return json({ ok: false, error: message, users: [] });
	}
};
