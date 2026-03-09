import { writable, get } from 'svelte/store';

export interface TeamMember {
	name: string;
	email: string;
	title: string;
	department: string;
	photoUrl: string;
}

const CACHE_KEY = 'tickets-team-cache';
const isBrowser = typeof window !== 'undefined';

function loadFromSession(): TeamMember[] {
	if (!isBrowser) return [];
	try {
		const cached = sessionStorage.getItem(CACHE_KEY);
		if (cached) return JSON.parse(cached);
	} catch { /* ignore */ }
	return [];
}

function saveToSession(members: TeamMember[]) {
	if (!isBrowser) return;
	try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(members)); } catch { /* ignore */ }
}

export const team = writable<TeamMember[]>(loadFromSession());
export const teamLoading = writable(false);
export const teamError = writable('');
export const teamIsLive = writable(false);

let loaded = false;

export async function loadTeam(force = false) {
	if (loaded && !force) return;
	teamLoading.set(true);
	teamError.set('');

	try {
		const res = await fetch('/api/team');
		const data = await res.json();
		if (data.ok && data.users.length > 0) {
			team.set(data.users);
			saveToSession(data.users);
			teamIsLive.set(true);
		} else {
			team.set([]);
			teamIsLive.set(false);
			if (data.error) teamError.set(data.error);
		}
	} catch {
		team.set([]);
		teamIsLive.set(false);
	}

	teamLoading.set(false);
	loaded = true;
}

export function ensureTeamLoaded() {
	const current = get(team);
	if (current.length === 0 && !loaded) {
		loadTeam();
	}
}
