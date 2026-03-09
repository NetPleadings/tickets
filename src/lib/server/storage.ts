import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Allocation, Guest } from '$lib/types';

const DATA_DIR = join(process.cwd(), 'data');
const ALLOCATIONS_FILE = join(DATA_DIR, 'allocations.json');
const GUESTS_FILE = join(DATA_DIR, 'guests.json');

function ensureDataDir() {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}
}

export function loadAllocations(): Allocation[] {
	ensureDataDir();
	if (!existsSync(ALLOCATIONS_FILE)) return [];
	try {
		return JSON.parse(readFileSync(ALLOCATIONS_FILE, 'utf-8'));
	} catch {
		return [];
	}
}

export function saveAllocations(allocations: Allocation[]) {
	ensureDataDir();
	writeFileSync(ALLOCATIONS_FILE, JSON.stringify(allocations, null, 2));
}

export function loadGuests(): Guest[] {
	ensureDataDir();
	if (!existsSync(GUESTS_FILE)) return [];
	try {
		return JSON.parse(readFileSync(GUESTS_FILE, 'utf-8'));
	} catch {
		return [];
	}
}

export function saveGuests(guests: Guest[]) {
	ensureDataDir();
	writeFileSync(GUESTS_FILE, JSON.stringify(guests, null, 2));
}
