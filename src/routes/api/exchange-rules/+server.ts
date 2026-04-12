import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	loadExchangeRules,
	loadActiveExchangeRules,
	insertExchangeRule,
	updateExchangeRule,
} from '$lib/server/bigquery.js';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const activeOnly = url.searchParams.get('active') === 'true';
	const rules = activeOnly ? await loadActiveExchangeRules() : await loadExchangeRules();
	return json({ ok: true, rules });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();

	switch (body.action) {
		case 'create': {
			const rule = body.rule;
			if (!rule?.id || !rule?.name || !rule?.fromTicketClass || !rule?.toTicketClass) {
				return json({ ok: false, error: 'Missing required fields' }, { status: 400 });
			}
			if (rule.fromQuantity < 1 || rule.toQuantity < 1) {
				return json({ ok: false, error: 'Quantities must be at least 1' }, { status: 400 });
			}
			await insertExchangeRule(rule);
			return json({ ok: true });
		}

		case 'update': {
			if (!body.id || !body.fields) {
				return json({ ok: false, error: 'Missing id or fields' }, { status: 400 });
			}
			if (body.fields.fromQuantity !== undefined && body.fields.fromQuantity < 1) {
				return json({ ok: false, error: 'Quantities must be at least 1' }, { status: 400 });
			}
			if (body.fields.toQuantity !== undefined && body.fields.toQuantity < 1) {
				return json({ ok: false, error: 'Quantities must be at least 1' }, { status: 400 });
			}
			await updateExchangeRule(body.id, body.fields);
			return json({ ok: true });
		}

		case 'toggle': {
			if (!body.id || body.active === undefined) {
				return json({ ok: false, error: 'Missing id or active flag' }, { status: 400 });
			}
			await updateExchangeRule(body.id, { active: body.active });
			return json({ ok: true });
		}

		default:
			return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	}
};
