import { writable, get } from 'svelte/store';
import type { Allocation } from '$lib/types';

const isBrowser = typeof window !== 'undefined';

export const allocations = writable<Allocation[]>([]);
export const allocationsLoaded = writable(false);

let nextId = Date.now();

// Load from server
export async function loadAllocations() {
	if (!isBrowser) return;
	try {
		const res = await fetch('/api/allocations');
		const data = await res.json();
		if (data.ok) {
			allocations.set(data.allocations);
			// Set nextId past any existing
			for (const a of data.allocations) {
				const num = parseInt(a.id.replace('alloc-', ''), 10);
				if (num >= nextId) nextId = num + 1;
			}
		}
	} catch { /* ignore */ }
	allocationsLoaded.set(true);
}

// Persist to server
async function persist() {
	if (!isBrowser) return;
	const current = get(allocations);
	try {
		await fetch('/api/allocations', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ allocations: current }),
		});
	} catch { /* ignore */ }
}

export function assignSeat(params: {
	eventId: string;
	seatId: string;
	assignee: string;
	assigneeEmail?: string;
	isGuest?: boolean;
	guestCompany?: string;
	status?: Allocation['status'];
}) {
	const alloc: Allocation = {
		id: `alloc-${nextId++}`,
		eventId: params.eventId,
		seatId: params.seatId,
		assignee: params.assignee,
		assigneeEmail: params.assigneeEmail,
		status: params.status ?? 'pending',
		assignedBy: 'Admin',
		assignedAt: new Date().toISOString(),
		isGuest: params.isGuest ?? false,
		guestCompany: params.guestCompany,
	};

	allocations.update((current) => [...current, alloc]);
	persist();
	return alloc;
}

export function confirmSeat(allocationId: string) {
	allocations.update((current) =>
		current.map((a) => a.id === allocationId ? { ...a, status: 'confirmed' as const } : a)
	);
	persist();
}

export function declineSeat(allocationId: string) {
	allocations.update((current) =>
		current.map((a) => a.id === allocationId ? { ...a, status: 'declined' as const } : a)
	);
	persist();
}

export function unassignSeat(allocationId: string) {
	allocations.update((current) => current.filter((a) => a.id !== allocationId));
	persist();
}

export function getAllocsForEvent(eventId: string): Allocation[] {
	return get(allocations).filter((a) => a.eventId === eventId);
}

export function getFrequentAssignees(): { name: string; email: string; count: number; isGuest: boolean; guestCompany?: string }[] {
	const allocs = get(allocations);
	const counts = new Map<string, { name: string; email: string; count: number; isGuest: boolean; guestCompany?: string }>();

	for (const a of allocs) {
		// Use email as key for team members, name for guests
		const key = a.isGuest ? `guest:${a.assignee.toLowerCase()}` : (a.assigneeEmail ?? a.assignee);
		const existing = counts.get(key);
		if (existing) {
			existing.count++;
		} else {
			counts.set(key, {
				name: a.assignee,
				email: a.assigneeEmail ?? '',
				count: 1,
				isGuest: a.isGuest ?? false,
				guestCompany: a.guestCompany,
			});
		}
	}

	return [...counts.values()].sort((a, b) => b.count - a.count);
}
