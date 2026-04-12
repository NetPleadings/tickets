import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	loadBankInventory,
	loadAvailableBankInventory,
	insertBankItem,
	updateBankItemStatus,
	updateBankItemQuantity,
} from '$lib/server/bigquery.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const availableOnly = url.searchParams.get('available') === 'true';
	const items = availableOnly ? await loadAvailableBankInventory() : await loadBankInventory();
	return json({ ok: true, items });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();

	switch (body.action) {
		case 'bank': {
			const item = body.item;
			if (!item?.id || !item?.sourceEventId || !item?.sourceGameDate || !item?.ticketClass) {
				return json({ ok: false, error: 'Missing required fields' }, { status: 400 });
			}
			await insertBankItem(item);
			return json({ ok: true });
		}

		case 'cancel': {
			if (!body.id) {
				return json({ ok: false, error: 'Missing id' }, { status: 400 });
			}
			await updateBankItemStatus(body.id, 'cancelled');
			return json({ ok: true });
		}

		case 'updateQuantity': {
			if (!body.id || body.quantity === undefined || !body.status) {
				return json({ ok: false, error: 'Missing fields' }, { status: 400 });
			}
			await updateBankItemQuantity(body.id, body.quantity, body.status);
			return json({ ok: true });
		}

		default:
			return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	}
};
