import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
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
	const today = new Date();
	const d = new Date(dateStr + 'T12:00:00');
	return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
}

export function isUpcoming(dateStr: string): boolean {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return new Date(dateStr + 'T12:00:00') >= today;
}

export function isPast(dateStr: string): boolean {
	return !isUpcoming(dateStr);
}

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

export function statusDot(status: string): string {
	switch (status) {
		case 'confirmed': return 'bg-confirmed';
		case 'pending': return 'bg-pending';
		case 'declined': return 'bg-declined';
		default: return 'bg-silver';
	}
}
