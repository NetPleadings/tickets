/**
 * One-time migration: reads data/allocations.json and writes NDJSON for bq load.
 * Run with: bun scripts/migrate.ts
 * Then: bq load --source_format=NEWLINE_DELIMITED_JSON --project_id=minutebox-marketing tickets.allocations /tmp/allocations.ndjson
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface Allocation {
	id: string;
	eventId: string;
	seatId: string;
	assignee: string;
	assigneeEmail?: string;
	status: string;
	assignedBy: string;
	assignedAt: string;
	notes?: string;
	isGuest?: boolean;
	guestCompany?: string;
}

const raw = readFileSync(join(import.meta.dir, '..', 'data', 'allocations.json'), 'utf-8');
const allocations: Allocation[] = JSON.parse(raw);

console.log(`Read ${allocations.length} allocations from JSON`);

const lines = allocations.map((a) =>
	JSON.stringify({
		id: a.id,
		event_id: a.eventId,
		seat_id: a.seatId,
		assignee: a.assignee || '',
		assignee_email: a.assigneeEmail || '',
		status: a.status,
		assigned_by: a.assignedBy,
		assigned_at: a.assignedAt,
		notes: a.notes || '',
		is_guest: a.isGuest ?? false,
		guest_company: a.guestCompany || '',
	})
);

const outPath = '/tmp/allocations.ndjson';
writeFileSync(outPath, lines.join('\n') + '\n');
console.log(`Wrote ${lines.length} rows to ${outPath}`);
console.log('Now run: bq load --source_format=NEWLINE_DELIMITED_JSON --project_id=minutebox-marketing tickets.allocations /tmp/allocations.ndjson');
