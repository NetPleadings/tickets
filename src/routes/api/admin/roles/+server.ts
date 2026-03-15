import { json } from '@sveltejs/kit';
import { loadRoles, upsertRole, deleteRole } from '$lib/server/auth';

export async function GET({ locals }) {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}
	const roles = await loadRoles();
	return json({ ok: true, roles });
}

export async function POST({ request, locals }) {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}
	const body = await request.json();

	switch (body.action) {
		case 'set':
			await upsertRole(body.email, body.role, locals.user.email);
			return json({ ok: true });

		case 'remove':
			await deleteRole(body.email);
			return json({ ok: true });

		default:
			return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	}
}
