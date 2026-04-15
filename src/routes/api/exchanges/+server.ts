import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types.js';
import {
	loadExchangeTransactions,
	loadExchangeTransactionItems,
	insertExchangeTransaction,
	insertExchangeTransactionItem,
	loadAvailableBankInventory,
	updateBankItemQuantity,
	updateBankItemStatus,
	loadActiveExchangeRules,
} from '$lib/server/bigquery.js';
import type { ExchangeTransaction, ExchangeTransactionItem } from '$lib/types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const transactionId = url.searchParams.get('transactionId');
	if (transactionId) {
		const items = await loadExchangeTransactionItems(transactionId);
		return json({ ok: true, items });
	}

	const transactions = await loadExchangeTransactions();
	return json({ ok: true, transactions });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (locals.user.role !== 'admin') {
		return json({ ok: false, error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json();

	switch (body.action) {
		case 'execute': {
			const { ruleId, targetEventId, targetGameDate, bankItemIds, notes } = body;

			if (!ruleId || !targetEventId || !targetGameDate || !bankItemIds?.length) {
				return json({ ok: false, error: 'Missing required fields' }, { status: 400 });
			}

			// Load and validate the rule
			const rules = await loadActiveExchangeRules();
			const rule = rules.find((r) => r.id === ruleId);
			if (!rule) {
				return json({ ok: false, error: 'Exchange rule not found or inactive' }, { status: 400 });
			}

			// Load available inventory and validate selected items
			const inventory = await loadAvailableBankInventory();
			const inventoryMap = new Map(inventory.map((i) => [i.id, i]));

			let totalAvailable = 0;
			for (const itemId of bankItemIds) {
				const item = inventoryMap.get(itemId);
				if (!item) {
					return json({ ok: false, error: `Bank item ${itemId} not found or not available` }, { status: 400 });
				}
				if (item.ticketClass !== rule.fromTicketClass) {
					return json({ ok: false, error: `Bank item ${itemId} class "${item.ticketClass}" does not match rule source class "${rule.fromTicketClass}"` }, { status: 400 });
				}
				totalAvailable += item.quantity;
			}

			if (totalAvailable < rule.fromQuantity) {
				return json({ ok: false, error: `Need ${rule.fromQuantity} tickets but only ${totalAvailable} available from selected items` }, { status: 400 });
			}

			// Create transaction
			const now = new Date().toISOString();
			const txId = `exch-${Date.now()}`;
			const tx: ExchangeTransaction = {
				id: txId,
				ruleId: rule.id,
				ruleName: rule.name,
				targetEventId,
				targetGameDate,
				fromTicketClass: rule.fromTicketClass,
				fromQuantity: rule.fromQuantity,
				toTicketClass: rule.toTicketClass,
				toQuantity: rule.toQuantity,
				status: 'completed',
				performedBy: locals.user.email,
				notes: notes || '',
				createdAt: now,
			};

			await insertExchangeTransaction(tx);

			// Consume inventory and create transaction items
			let remaining = rule.fromQuantity;
			for (const itemId of bankItemIds) {
				if (remaining <= 0) break;
				const item = inventoryMap.get(itemId)!;
				const consume = Math.min(item.quantity, remaining);

				const txItem: ExchangeTransactionItem = {
					id: `exchi-${Date.now()}-${itemId.slice(-6)}`,
					transactionId: txId,
					bankInventoryId: itemId,
					quantityConsumed: consume,
					createdAt: now,
				};
				await insertExchangeTransactionItem(txItem);

				const newQty = item.quantity - consume;
				if (newQty <= 0) {
					await updateBankItemStatus(itemId, 'used');
				} else {
					await updateBankItemQuantity(itemId, newQty, 'partially_used');
				}

				remaining -= consume;
			}

			return json({ ok: true, transaction: tx });
		}

		default:
			return json({ ok: false, error: 'Unknown action' }, { status: 400 });
	}
};
