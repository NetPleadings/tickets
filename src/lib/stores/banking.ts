import { writable, get } from 'svelte/store';
import type { BankInventoryItem } from '$lib/types';

const isBrowser = typeof window !== 'undefined';

export const bankInventory = writable<BankInventoryItem[]>([]);
export const bankInventoryLoaded = writable(false);

export async function loadBankInventory() {
	if (!isBrowser) return;
	try {
		const res = await fetch('/api/banking');
		const data = await res.json();
		if (data.ok) {
			bankInventory.set(data.items);
		}
	} catch { /* ignore */ }
	bankInventoryLoaded.set(true);
}

export async function bankTickets(item: BankInventoryItem): Promise<boolean> {
	bankInventory.update((current) => [item, ...current]);

	try {
		const res = await fetch('/api/banking', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'bank', item }),
		});
		const data = await res.json();
		if (!data.ok) {
			await loadBankInventory();
			return false;
		}
		return true;
	} catch {
		await loadBankInventory();
		return false;
	}
}

export async function cancelBankItem(id: string): Promise<boolean> {
	bankInventory.update((current) =>
		current.map((i) => i.id === id ? { ...i, status: 'cancelled' as const } : i)
	);

	try {
		const res = await fetch('/api/banking', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'cancel', id }),
		});
		const data = await res.json();
		if (!data.ok) {
			await loadBankInventory();
			return false;
		}
		return true;
	} catch {
		await loadBankInventory();
		return false;
	}
}

export function getAvailableInventory(): BankInventoryItem[] {
	return get(bankInventory).filter((i) => i.status === 'available' || i.status === 'partially_used');
}

export function getAvailableByClass(ticketClass: string): BankInventoryItem[] {
	return getAvailableInventory().filter((i) => i.ticketClass === ticketClass);
}

export function getTotalAvailableByClass(ticketClass: string): number {
	return getAvailableByClass(ticketClass).reduce((sum, i) => sum + i.quantity, 0);
}
