import { writable } from 'svelte/store';

export type Role = 'admin' | 'manager' | 'viewer';

export interface CurrentUser {
	email: string;
	role: Role;
}

const isBrowser = typeof window !== 'undefined';

export const currentUser = writable<CurrentUser | null>(null);
export const bookingWindowDays = writable<number>(60);
export const userLoaded = writable(false);
// Admin preview mode — when true, admins see the app as a manager would
export const previewAsManager = writable(false);

export async function loadCurrentUser() {
	if (!isBrowser) return;
	try {
		const res = await fetch('/api/me');
		const data = await res.json();
		if (data.ok) {
			currentUser.set(data.user);
			bookingWindowDays.set(data.bookingWindowDays);
		}
	} catch { /* ignore */ }
	userLoaded.set(true);
}

export function isAdmin(role: Role): boolean {
	return role === 'admin';
}

export function isManagerOrAbove(role: Role): boolean {
	return role === 'admin' || role === 'manager';
}

/**
 * Returns the effective role, accounting for admin preview mode.
 * Use this for UI visibility decisions (not server-side enforcement).
 */
export function getEffectiveRole(role: Role, previewing: boolean): Role {
	if (role === 'admin' && previewing) return 'manager';
	return role;
}
