import { writable, get } from 'svelte/store';
import type { Guest } from '$lib/types';

const isBrowser = typeof window !== 'undefined';

export const guests = writable<Guest[]>([]);
export const guestsLoaded = writable(false);

let nextId = Date.now();

export async function loadGuests() {
	if (!isBrowser) return;
	try {
		const res = await fetch('/api/guests');
		const data = await res.json();
		if (data.ok) {
			guests.set(data.guests);
			for (const g of data.guests) {
				const num = parseInt(g.id.replace('guest-', ''), 10);
				if (num >= nextId) nextId = num + 1;
			}
		}
	} catch { /* ignore */ }
	guestsLoaded.set(true);
}

export function addGuest(params: { name: string; company?: string; email?: string; notes?: string }): Guest {
	const guest: Guest = {
		id: `guest-${nextId++}`,
		name: params.name,
		company: params.company || undefined,
		email: params.email || undefined,
		notes: params.notes || undefined,
		createdAt: new Date().toISOString(),
	};
	guests.update((current) => [...current, guest]);

	fetch('/api/guests', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ action: 'add', guest }),
	}).catch(() => {});

	return guest;
}

export function findGuestByName(name: string): Guest | undefined {
	return get(guests).find((g) => g.name.toLowerCase() === name.toLowerCase());
}

export function getOrCreateGuest(params: { name: string; company?: string; email?: string }): Guest {
	const existing = findGuestByName(params.name);
	if (existing) {
		if (params.company && params.company !== existing.company) {
			guests.update((current) =>
				current.map((g) => g.id === existing.id ? { ...g, company: params.company } : g)
			);
			fetch('/api/guests', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'update', id: existing.id, fields: { company: params.company } }),
			}).catch(() => {});
			return { ...existing, company: params.company };
		}
		return existing;
	}
	return addGuest(params);
}
