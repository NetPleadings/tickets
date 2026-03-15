import { writable, get } from 'svelte/store';

export interface RequestCompanion {
	name: string;
	type: 'team' | 'guest';
	email?: string;
	company?: string;
}

export interface TicketRequest {
	id: string;
	eventId: string;
	requesterEmail: string;
	requesterName: string;
	seatCount: number;
	companions?: RequestCompanion[];
	status: 'pending' | 'approved' | 'rejected' | 'cancelled';
	reviewedBy?: string;
	reviewedAt?: string;
	notes?: string;
	createdAt: string;
}

const isBrowser = typeof window !== 'undefined';

export const requests = writable<TicketRequest[]>([]);
export const requestsLoaded = writable(false);

export async function loadRequests() {
	if (!isBrowser) return;
	try {
		const res = await fetch('/api/requests');
		const data = await res.json();
		if (data.ok) requests.set(data.requests);
	} catch { /* ignore */ }
	requestsLoaded.set(true);
}

export async function createRequest(params: {
	eventId: string;
	requesterName: string;
	seatCount: number;
	companions?: RequestCompanion[];
	notes?: string;
}): Promise<{ ok: boolean; error?: string }> {
	try {
		const res = await fetch('/api/requests', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'create', ...params }),
		});
		const data = await res.json();
		if (data.ok && data.request) {
			requests.update((current) => [data.request, ...current]);
		}
		return data;
	} catch {
		return { ok: false, error: 'Network error' };
	}
}

export async function approveRequest(id: string, eventId: string, requesterEmail: string, requesterName: string, seatCount: number) {
	try {
		const res = await fetch('/api/requests', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'approve', id, eventId, requesterEmail, requesterName, seatCount }),
		});
		const data = await res.json();
		if (data.ok) {
			requests.update((current) =>
				current.map((r) => r.id === id ? { ...r, status: 'approved' as const } : r)
			);
		}
		return data;
	} catch {
		return { ok: false };
	}
}

export async function rejectRequest(id: string) {
	try {
		const res = await fetch('/api/requests', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'reject', id }),
		});
		const data = await res.json();
		if (data.ok) {
			requests.update((current) =>
				current.map((r) => r.id === id ? { ...r, status: 'rejected' as const } : r)
			);
		}
		return data;
	} catch {
		return { ok: false };
	}
}

export async function cancelRequest(id: string): Promise<{ ok: boolean; error?: string }> {
	try {
		const res = await fetch('/api/requests', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'cancel', id }),
		});
		const data = await res.json();
		if (data.ok) {
			requests.update((current) =>
				current.map((r) => r.id === id ? { ...r, status: 'cancelled' as const } : r)
			);
		}
		return data;
	} catch {
		return { ok: false, error: 'Network error' };
	}
}

export function getPendingRequestsForEvent(eventId: string): TicketRequest[] {
	return get(requests).filter((r) => r.eventId === eventId && r.status === 'pending');
}
