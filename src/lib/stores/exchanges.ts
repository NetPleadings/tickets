import { writable } from 'svelte/store';
import type { ExchangeTransaction, ExchangeTransactionItem } from '$lib/types';

const isBrowser = typeof window !== 'undefined';

export const exchangeTransactions = writable<ExchangeTransaction[]>([]);
export const exchangeTransactionsLoaded = writable(false);

export async function loadExchangeTransactions() {
	if (!isBrowser) return;
	try {
		const res = await fetch('/api/exchanges');
		const data = await res.json();
		if (data.ok) {
			exchangeTransactions.set(data.transactions);
		}
	} catch { /* ignore */ }
	exchangeTransactionsLoaded.set(true);
}

export async function executeExchange(params: {
	ruleId: string;
	targetEventId: string;
	targetGameDate: string;
	bankItemIds: string[];
	notes?: string;
}): Promise<{ ok: boolean; transaction?: ExchangeTransaction; error?: string }> {
	try {
		const res = await fetch('/api/exchanges', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'execute', ...params }),
		});
		const data = await res.json();
		if (data.ok) {
			exchangeTransactions.update((current) => [data.transaction, ...current]);
			return { ok: true, transaction: data.transaction };
		}
		return { ok: false, error: data.error };
	} catch {
		return { ok: false, error: 'Network error' };
	}
}

export async function loadTransactionItems(transactionId: string): Promise<ExchangeTransactionItem[]> {
	try {
		const res = await fetch(`/api/exchanges?transactionId=${transactionId}`);
		const data = await res.json();
		return data.ok ? data.items : [];
	} catch {
		return [];
	}
}
