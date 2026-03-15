import { BigQuery } from '@google-cloud/bigquery';
import type { Allocation, Guest } from '$lib/types';

const bq = new BigQuery({ projectId: 'minutebox-marketing' });
const dataset = bq.dataset('tickets');
const allocationsTable = dataset.table('allocations');
const guestsTable = dataset.table('guests');

// --- Allocations ---

export async function loadAllocations(): Promise<Allocation[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.allocations`',
	});
	return rows.map(rowToAllocation);
}

export async function insertAllocation(a: Allocation): Promise<void> {
	await allocationsTable.insert([allocationToRow(a)]);
}

export async function updateAllocationStatus(id: string, status: Allocation['status']): Promise<void> {
	await bq.query({
		query: 'UPDATE `minutebox-marketing.tickets.allocations` SET status = @status WHERE id = @id',
		params: { id, status },
	});
}

export async function deleteAllocation(id: string): Promise<void> {
	await bq.query({
		query: 'DELETE FROM `minutebox-marketing.tickets.allocations` WHERE id = @id',
		params: { id },
	});
}

// --- Guests ---

export async function loadGuests(): Promise<Guest[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.guests`',
	});
	return rows.map(rowToGuest);
}

export async function insertGuest(g: Guest): Promise<void> {
	await guestsTable.insert([guestToRow(g)]);
}

export async function updateGuest(id: string, fields: Partial<Guest>): Promise<void> {
	const sets: string[] = [];
	const params: Record<string, unknown> = { id };

	if (fields.name !== undefined) { sets.push('name = @name'); params.name = fields.name; }
	if (fields.company !== undefined) { sets.push('company = @company'); params.company = fields.company; }
	if (fields.email !== undefined) { sets.push('email = @email'); params.email = fields.email; }
	if (fields.notes !== undefined) { sets.push('notes = @notes'); params.notes = fields.notes; }

	if (sets.length === 0) return;

	await bq.query({
		query: `UPDATE \`minutebox-marketing.tickets.guests\` SET ${sets.join(', ')} WHERE id = @id`,
		params,
	});
}

// --- Row mapping ---

function rowToAllocation(row: Record<string, unknown>): Allocation {
	return {
		id: row.id as string,
		eventId: row.event_id as string,
		seatId: row.seat_id as string,
		assignee: row.assignee as string,
		assigneeEmail: (row.assignee_email as string) || undefined,
		status: row.status as Allocation['status'],
		assignedBy: row.assigned_by as string,
		assignedAt: row.assigned_at ? (row.assigned_at as { value: string }).value ?? String(row.assigned_at) : '',
		notes: (row.notes as string) || undefined,
		isGuest: row.is_guest as boolean ?? false,
		guestCompany: (row.guest_company as string) || undefined,
	};
}

function allocationToRow(a: Allocation): Record<string, unknown> {
	return {
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
	};
}

function rowToGuest(row: Record<string, unknown>): Guest {
	return {
		id: row.id as string,
		name: row.name as string,
		company: (row.company as string) || undefined,
		email: (row.email as string) || undefined,
		notes: (row.notes as string) || undefined,
		createdAt: row.created_at ? (row.created_at as { value: string }).value ?? String(row.created_at) : '',
	};
}

function guestToRow(g: Guest): Record<string, unknown> {
	return {
		id: g.id,
		name: g.name,
		company: g.company || '',
		email: g.email || '',
		notes: g.notes || '',
		created_at: g.createdAt,
	};
}
