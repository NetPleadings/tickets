import { writable } from 'svelte/store';
import type { ExchangeRule } from '$lib/types';

const isBrowser = typeof window !== 'undefined';

export const exchangeRules = writable<ExchangeRule[]>([]);
export const exchangeRulesLoaded = writable(false);

export async function loadExchangeRules() {
	if (!isBrowser) return;
	try {
		const res = await fetch('/api/exchange-rules');
		const data = await res.json();
		if (data.ok) {
			exchangeRules.set(data.rules);
		}
	} catch { /* ignore */ }
	exchangeRulesLoaded.set(true);
}

export async function createExchangeRule(rule: ExchangeRule): Promise<boolean> {
	exchangeRules.update((current) => [rule, ...current]);

	try {
		const res = await fetch('/api/exchange-rules', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'create', rule }),
		});
		const data = await res.json();
		if (!data.ok) {
			await loadExchangeRules();
			return false;
		}
		return true;
	} catch {
		await loadExchangeRules();
		return false;
	}
}

export async function updateExchangeRule(id: string, fields: Partial<ExchangeRule>): Promise<boolean> {
	exchangeRules.update((current) =>
		current.map((r) => r.id === id ? { ...r, ...fields, updatedAt: new Date().toISOString() } : r)
	);

	try {
		const res = await fetch('/api/exchange-rules', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'update', id, fields }),
		});
		const data = await res.json();
		if (!data.ok) {
			await loadExchangeRules();
			return false;
		}
		return true;
	} catch {
		await loadExchangeRules();
		return false;
	}
}

export async function toggleExchangeRule(id: string, active: boolean): Promise<boolean> {
	exchangeRules.update((current) =>
		current.map((r) => r.id === id ? { ...r, active, updatedAt: new Date().toISOString() } : r)
	);

	try {
		const res = await fetch('/api/exchange-rules', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'toggle', id, active }),
		});
		const data = await res.json();
		if (!data.ok) {
			await loadExchangeRules();
			return false;
		}
		return true;
	} catch {
		await loadExchangeRules();
		return false;
	}
}
