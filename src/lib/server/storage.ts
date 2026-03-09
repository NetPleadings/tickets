import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Allocation, Guest } from '$lib/types';

const DATA_DIR = join(process.cwd(), 'data');

function ensureDataDir() {
	if (!existsSync(DATA_DIR)) {
		mkdirSync(DATA_DIR, { recursive: true });
	}
}

function loadJson<T>(filename: string): T[] {
	ensureDataDir();
	const file = join(DATA_DIR, filename);
	if (!existsSync(file)) return [];
	try {
		return JSON.parse(readFileSync(file, 'utf-8'));
	} catch {
		return [];
	}
}

function saveJson<T>(filename: string, data: T[]) {
	ensureDataDir();
	writeFileSync(join(DATA_DIR, filename), JSON.stringify(data, null, 2));
}

export const loadAllocations = () => loadJson<Allocation>('allocations.json');
export const saveAllocations = (data: Allocation[]) => saveJson('allocations.json', data);
export const loadGuests = () => loadJson<Guest>('guests.json');
export const saveGuests = (data: Guest[]) => saveJson('guests.json', data);
