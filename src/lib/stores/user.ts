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
// Admin preview mode — cycles through: off (admin) → manager → viewer
export type PreviewMode = 'off' | 'manager' | 'viewer';
export const previewMode = writable<PreviewMode>('off');
// Keep backward compat alias
export const previewAsManager = {
	subscribe: (fn: (v: boolean) => void) => {
		return previewMode.subscribe((m) => fn(m !== 'off'));
	},
	update: (_fn: (v: boolean) => boolean) => {
		previewMode.update((m) => {
			if (m === 'off') return 'manager';
			if (m === 'manager') return 'viewer';
			return 'off';
		});
	},
};

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
/**
 * Returns the effective role, accounting for admin preview mode.
 * Use this for UI visibility decisions (not server-side enforcement).
 * Accepts either a boolean (legacy) or PreviewMode string.
 */
export function getEffectiveRole(role: Role, previewing: boolean | PreviewMode): Role {
	if (role !== 'admin') return role;
	if (previewing === true || previewing === 'manager') return 'manager';
	if (previewing === 'viewer') return 'viewer';
	return role;
}
