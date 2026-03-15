import type { Event, Allocation } from '$lib/types';

// --- Date helpers ---

export function toDateStr(year: number, month: number, day: number): string {
	return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function todayDateStr(): string {
	const t = new Date();
	return toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
}

export function formatDate(dateStr: string): string {
	const date = new Date(dateStr + 'T12:00:00');
	return date.toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatDateFull(dateStr: string): string {
	const date = new Date(dateStr + 'T12:00:00');
	return date.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMonthYear(dateStr: string): string {
	const date = new Date(dateStr + 'T12:00:00');
	return date.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
}

export function getDayOfWeek(dateStr: string): number {
	return new Date(dateStr + 'T12:00:00').getDay();
}

export function getDayOfMonth(dateStr: string): number {
	return new Date(dateStr + 'T12:00:00').getDate();
}

export function isToday(dateStr: string): boolean {
	return dateStr === todayDateStr();
}

export function isUpcoming(dateStr: string): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return new Date(dateStr + 'T12:00:00') >= today;
}

export function isPast(dateStr: string): boolean {
	return !isUpcoming(dateStr);
}

// --- Calendar grid helpers ---

export function getMonthDays(year: number, month: number): { date: string; inMonth: boolean }[] {
	const firstDay = new Date(year, month, 1);
	const lastDay = new Date(year, month + 1, 0);
	const startPad = firstDay.getDay();
	const days: { date: string; inMonth: boolean }[] = [];

	// Pad start
	for (let i = startPad - 1; i >= 0; i--) {
		const d = new Date(year, month, -i);
		days.push({ date: d.toISOString().split('T')[0], inMonth: false });
	}

	// Month days
	for (let i = 1; i <= lastDay.getDate(); i++) {
		const d = new Date(year, month, i);
		days.push({ date: d.toISOString().split('T')[0], inMonth: true });
	}

	// Pad end to fill grid
	const remaining = 7 - (days.length % 7);
	if (remaining < 7) {
		for (let i = 1; i <= remaining; i++) {
			const d = new Date(year, month + 1, i);
			days.push({ date: d.toISOString().split('T')[0], inMonth: false });
		}
	}

	return days;
}

// --- Allocation helpers ---

export function eventsOnDate(events: Event[], dateStr: string): Event[] {
	return events.filter((e) => e.date === dateStr);
}

export function allocsForEvent(allocations: Allocation[], eventId: string): Allocation[] {
	return allocations.filter((a) => a.eventId === eventId);
}

export interface StatusCounts {
	confirmed: number;
	pending: number;
	restricted: number;
	declined: number;
}

export function countStatuses(allocs: Allocation[]): StatusCounts {
	let confirmed = 0, pending = 0, restricted = 0, declined = 0;
	for (const a of allocs) {
		if (a.status === 'confirmed') confirmed++;
		else if (a.status === 'pending') pending++;
		else if (a.status === 'restricted') restricted++;
		else if (a.status === 'declined') declined++;
	}
	return { confirmed, pending, restricted, declined };
}

export function isSoldOut(counts: StatusCounts, totalSeats: number): boolean {
	return counts.confirmed + counts.pending + counts.restricted >= totalSeats;
}

export function seatDotColor(index: number, counts: StatusCounts, emptyClass = 'bg-crystal-pale'): string {
	const { confirmed, pending, restricted } = counts;
	if (index < confirmed) return 'bg-confirmed';
	if (index < confirmed + pending) return 'bg-pending';
	if (index < confirmed + pending + restricted) return 'bg-graphite/40';
	return emptyClass;
}

export function statusDot(status: Allocation['status']): string {
	switch (status) {
		case 'confirmed': return 'bg-confirmed';
		case 'pending': return 'bg-pending';
		case 'declined': return 'bg-declined';
		case 'restricted': return 'bg-graphite/40';
		default: return 'bg-silver';
	}
}

// --- Lookup map builders ---

export function buildEventsByDate(events: Event[]): Map<string, Event> {
	return new Map(events.map((e) => [e.date, e]));
}

export function buildAllocsByEvent(allocations: Allocation[]): Map<string, Allocation[]> {
	const map = new Map<string, Allocation[]>();
	for (const a of allocations) {
		const arr = map.get(a.eventId);
		if (arr) arr.push(a);
		else map.set(a.eventId, [a]);
	}
	return map;
}

export function buildEventsById(events: Event[]): Map<string, Event> {
	return new Map(events.map((e) => [e.id, e]));
}
