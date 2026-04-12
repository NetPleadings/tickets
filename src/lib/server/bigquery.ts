import { BigQuery } from '@google-cloud/bigquery';
import type { Allocation, Guest, BankInventoryItem, ExchangeRule, ExchangeTransaction, ExchangeTransactionItem } from '$lib/types';

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
	await bq.query({
		query: `INSERT INTO \`minutebox-marketing.tickets.allocations\`
			(id, event_id, seat_id, assignee, assignee_email, status, assigned_by, assigned_at, notes, is_guest, guest_company)
			VALUES (@id, @eventId, @seatId, @assignee, @assigneeEmail, @status, @assignedBy, @assignedAt, @notes, @isGuest, @guestCompany)`,
		params: {
			id: a.id, eventId: a.eventId, seatId: a.seatId,
			assignee: a.assignee || '', assigneeEmail: a.assigneeEmail || '',
			status: a.status, assignedBy: a.assignedBy || '',
			assignedAt: a.assignedAt ? bq.timestamp(a.assignedAt) : null,
			notes: a.notes || '', isGuest: a.isGuest ?? false,
			guestCompany: a.guestCompany || '',
		},
	});
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
	await bq.query({
		query: `INSERT INTO \`minutebox-marketing.tickets.guests\`
			(id, name, company, email, notes, created_at)
			VALUES (@id, @name, @company, @email, @notes, @createdAt)`,
		params: {
			id: g.id, name: g.name,
			company: g.company || '', email: g.email || '',
			notes: g.notes || '',
			createdAt: g.createdAt ? bq.timestamp(g.createdAt) : null,
		},
	});
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

// --- Requests ---

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
	status: 'pending' | 'approved' | 'rejected';
	reviewedBy?: string;
	reviewedAt?: string;
	notes?: string;
	createdAt: string;
}

export async function loadRequests(): Promise<TicketRequest[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.requests` ORDER BY created_at DESC',
	});
	return rows.map(rowToRequest);
}

export async function loadRequestsByEmail(email: string): Promise<TicketRequest[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.requests` WHERE requester_email = @email ORDER BY created_at DESC',
		params: { email },
	});
	return rows.map(rowToRequest);
}

export async function insertRequest(r: TicketRequest): Promise<void> {
	await bq.query({
		query: `INSERT INTO \`minutebox-marketing.tickets.requests\`
			(id, event_id, requester_email, requester_name, seat_count, companions, status, reviewed_by, reviewed_at, notes, created_at)
			VALUES (@id, @eventId, @requesterEmail, @requesterName, @seatCount, @companions, @status, @reviewedBy, NULL, @notes, @createdAt)`,
		params: {
			id: r.id, eventId: r.eventId,
			requesterEmail: r.requesterEmail, requesterName: r.requesterName,
			seatCount: r.seatCount,
			companions: r.companions ? JSON.stringify(r.companions) : null,
			status: r.status, reviewedBy: r.reviewedBy || '',
			notes: r.notes || '',
			createdAt: bq.timestamp(r.createdAt),
		},
	});
}

export async function updateRequestStatus(id: string, status: string, reviewedBy: string): Promise<void> {
	await bq.query({
		query: 'UPDATE `minutebox-marketing.tickets.requests` SET status = @status, reviewed_by = @reviewedBy, reviewed_at = CURRENT_TIMESTAMP() WHERE id = @id',
		params: { id, status, reviewedBy },
	});
}

function rowToRequest(row: Record<string, unknown>): TicketRequest {
	let companions: RequestCompanion[] | undefined;
	if (row.companions) {
		try {
			companions = typeof row.companions === 'string' ? JSON.parse(row.companions) : row.companions as RequestCompanion[];
		} catch { /* ignore parse errors */ }
	}
	return {
		id: row.id as string,
		eventId: row.event_id as string,
		requesterEmail: row.requester_email as string,
		requesterName: row.requester_name as string,
		seatCount: Number(row.seat_count) || 1,
		companions,
		status: row.status as TicketRequest['status'],
		reviewedBy: (row.reviewed_by as string) || undefined,
		reviewedAt: row.reviewed_at ? (row.reviewed_at as { value: string }).value ?? String(row.reviewed_at) : undefined,
		notes: (row.notes as string) || undefined,
		createdAt: row.created_at ? (row.created_at as { value: string }).value ?? String(row.created_at) : '',
	};
}

function requestToRow(r: TicketRequest): Record<string, unknown> {
	return {
		id: r.id,
		event_id: r.eventId,
		requester_email: r.requesterEmail,
		requester_name: r.requesterName,
		seat_count: r.seatCount,
		companions: r.companions ? JSON.stringify(r.companions) : null,
		status: r.status,
		reviewed_by: r.reviewedBy || '',
		reviewed_at: r.reviewedAt || null,
		notes: r.notes || '',
		created_at: r.createdAt,
	};
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

// --- Ticket Bank Inventory ---

export async function loadBankInventory(): Promise<BankInventoryItem[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.ticket_bank_inventory` ORDER BY created_at DESC',
	});
	return rows.map(rowToBankItem);
}

export async function loadAvailableBankInventory(): Promise<BankInventoryItem[]> {
	const [rows] = await bq.query({
		query: "SELECT * FROM `minutebox-marketing.tickets.ticket_bank_inventory` WHERE status IN ('available', 'partially_used') ORDER BY created_at DESC",
	});
	return rows.map(rowToBankItem);
}

export async function insertBankItem(item: BankInventoryItem): Promise<void> {
	await bq.query({
		query: `INSERT INTO \`minutebox-marketing.tickets.ticket_bank_inventory\`
			(id, source_event_id, source_game_date, ticket_class, section, row, seat, quantity, status, banked_by, banked_at, notes, created_at, updated_at)
			VALUES (@id, @sourceEventId, @sourceGameDate, @ticketClass, @section, @row, @seat, @quantity, @status, @bankedBy, @bankedAt, @notes, @createdAt, @updatedAt)`,
		params: {
			id: item.id,
			sourceEventId: item.sourceEventId,
			sourceGameDate: item.sourceGameDate,
			ticketClass: item.ticketClass,
			section: item.section,
			row: item.row,
			seat: item.seat,
			quantity: item.quantity,
			status: item.status,
			bankedBy: item.bankedBy,
			bankedAt: bq.timestamp(item.bankedAt),
			notes: item.notes || '',
			createdAt: bq.timestamp(item.createdAt),
			updatedAt: bq.timestamp(item.updatedAt),
		},
	});
}

export async function updateBankItemStatus(id: string, status: BankInventoryItem['status']): Promise<void> {
	await bq.query({
		query: 'UPDATE `minutebox-marketing.tickets.ticket_bank_inventory` SET status = @status, updated_at = CURRENT_TIMESTAMP() WHERE id = @id',
		params: { id, status },
	});
}

export async function updateBankItemQuantity(id: string, quantity: number, status: BankInventoryItem['status']): Promise<void> {
	await bq.query({
		query: 'UPDATE `minutebox-marketing.tickets.ticket_bank_inventory` SET quantity = @quantity, status = @status, updated_at = CURRENT_TIMESTAMP() WHERE id = @id',
		params: { id, quantity, status },
	});
}

function rowToBankItem(row: Record<string, unknown>): BankInventoryItem {
	return {
		id: row.id as string,
		sourceEventId: row.source_event_id as string,
		sourceGameDate: row.source_game_date as string,
		ticketClass: row.ticket_class as string,
		section: row.section as string,
		row: row.row as string,
		seat: row.seat as string,
		quantity: Number(row.quantity) || 1,
		status: row.status as BankInventoryItem['status'],
		bankedBy: row.banked_by as string,
		bankedAt: row.banked_at ? (row.banked_at as { value: string }).value ?? String(row.banked_at) : '',
		notes: (row.notes as string) || undefined,
		createdAt: row.created_at ? (row.created_at as { value: string }).value ?? String(row.created_at) : '',
		updatedAt: row.updated_at ? (row.updated_at as { value: string }).value ?? String(row.updated_at) : '',
	};
}

// --- Exchange Rules ---

export async function loadExchangeRules(): Promise<ExchangeRule[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.ticket_exchange_rules` ORDER BY created_at DESC',
	});
	return rows.map(rowToExchangeRule);
}

export async function loadActiveExchangeRules(): Promise<ExchangeRule[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.ticket_exchange_rules` WHERE active = TRUE ORDER BY name',
	});
	return rows.map(rowToExchangeRule);
}

export async function insertExchangeRule(rule: ExchangeRule): Promise<void> {
	await bq.query({
		query: `INSERT INTO \`minutebox-marketing.tickets.ticket_exchange_rules\`
			(id, name, from_ticket_class, from_quantity, to_ticket_class, to_quantity, active, notes, created_by, created_at, updated_at)
			VALUES (@id, @name, @fromTicketClass, @fromQuantity, @toTicketClass, @toQuantity, @active, @notes, @createdBy, @createdAt, @updatedAt)`,
		params: {
			id: rule.id,
			name: rule.name,
			fromTicketClass: rule.fromTicketClass,
			fromQuantity: rule.fromQuantity,
			toTicketClass: rule.toTicketClass,
			toQuantity: rule.toQuantity,
			active: rule.active,
			notes: rule.notes || '',
			createdBy: rule.createdBy,
			createdAt: bq.timestamp(rule.createdAt),
			updatedAt: bq.timestamp(rule.updatedAt),
		},
	});
}

export async function updateExchangeRule(id: string, fields: Partial<ExchangeRule>): Promise<void> {
	const sets: string[] = [];
	const params: Record<string, unknown> = { id };

	if (fields.name !== undefined) { sets.push('name = @name'); params.name = fields.name; }
	if (fields.fromTicketClass !== undefined) { sets.push('from_ticket_class = @fromTicketClass'); params.fromTicketClass = fields.fromTicketClass; }
	if (fields.fromQuantity !== undefined) { sets.push('from_quantity = @fromQuantity'); params.fromQuantity = fields.fromQuantity; }
	if (fields.toTicketClass !== undefined) { sets.push('to_ticket_class = @toTicketClass'); params.toTicketClass = fields.toTicketClass; }
	if (fields.toQuantity !== undefined) { sets.push('to_quantity = @toQuantity'); params.toQuantity = fields.toQuantity; }
	if (fields.active !== undefined) { sets.push('active = @active'); params.active = fields.active; }
	if (fields.notes !== undefined) { sets.push('notes = @notes'); params.notes = fields.notes; }

	if (sets.length === 0) return;

	sets.push('updated_at = CURRENT_TIMESTAMP()');

	await bq.query({
		query: `UPDATE \`minutebox-marketing.tickets.ticket_exchange_rules\` SET ${sets.join(', ')} WHERE id = @id`,
		params,
	});
}

function rowToExchangeRule(row: Record<string, unknown>): ExchangeRule {
	return {
		id: row.id as string,
		name: row.name as string,
		fromTicketClass: row.from_ticket_class as string,
		fromQuantity: Number(row.from_quantity) || 1,
		toTicketClass: row.to_ticket_class as string,
		toQuantity: Number(row.to_quantity) || 1,
		active: row.active as boolean ?? true,
		notes: (row.notes as string) || undefined,
		createdBy: (row.created_by as string) || '',
		createdAt: row.created_at ? (row.created_at as { value: string }).value ?? String(row.created_at) : '',
		updatedAt: row.updated_at ? (row.updated_at as { value: string }).value ?? String(row.updated_at) : '',
	};
}

// --- Exchange Transactions ---

export async function loadExchangeTransactions(): Promise<ExchangeTransaction[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.ticket_exchange_transactions` ORDER BY created_at DESC',
	});
	return rows.map(rowToExchangeTransaction);
}

export async function insertExchangeTransaction(tx: ExchangeTransaction): Promise<void> {
	await bq.query({
		query: `INSERT INTO \`minutebox-marketing.tickets.ticket_exchange_transactions\`
			(id, rule_id, rule_name, target_event_id, target_game_date, from_ticket_class, from_quantity, to_ticket_class, to_quantity, status, performed_by, notes, created_at)
			VALUES (@id, @ruleId, @ruleName, @targetEventId, @targetGameDate, @fromTicketClass, @fromQuantity, @toTicketClass, @toQuantity, @status, @performedBy, @notes, @createdAt)`,
		params: {
			id: tx.id,
			ruleId: tx.ruleId,
			ruleName: tx.ruleName,
			targetEventId: tx.targetEventId,
			targetGameDate: tx.targetGameDate,
			fromTicketClass: tx.fromTicketClass,
			fromQuantity: tx.fromQuantity,
			toTicketClass: tx.toTicketClass,
			toQuantity: tx.toQuantity,
			status: tx.status,
			performedBy: tx.performedBy,
			notes: tx.notes || '',
			createdAt: bq.timestamp(tx.createdAt),
		},
	});
}

// --- Exchange Transaction Items ---

export async function loadExchangeTransactionItems(transactionId: string): Promise<ExchangeTransactionItem[]> {
	const [rows] = await bq.query({
		query: 'SELECT * FROM `minutebox-marketing.tickets.ticket_exchange_transaction_items` WHERE transaction_id = @transactionId ORDER BY created_at',
		params: { transactionId },
	});
	return rows.map(rowToExchangeTransactionItem);
}

export async function insertExchangeTransactionItem(item: ExchangeTransactionItem): Promise<void> {
	await bq.query({
		query: `INSERT INTO \`minutebox-marketing.tickets.ticket_exchange_transaction_items\`
			(id, transaction_id, bank_inventory_id, quantity_consumed, created_at)
			VALUES (@id, @transactionId, @bankInventoryId, @quantityConsumed, @createdAt)`,
		params: {
			id: item.id,
			transactionId: item.transactionId,
			bankInventoryId: item.bankInventoryId,
			quantityConsumed: item.quantityConsumed,
			createdAt: bq.timestamp(item.createdAt),
		},
	});
}

function rowToExchangeTransaction(row: Record<string, unknown>): ExchangeTransaction {
	return {
		id: row.id as string,
		ruleId: row.rule_id as string,
		ruleName: row.rule_name as string,
		targetEventId: row.target_event_id as string,
		targetGameDate: row.target_game_date as string,
		fromTicketClass: row.from_ticket_class as string,
		fromQuantity: Number(row.from_quantity) || 1,
		toTicketClass: row.to_ticket_class as string,
		toQuantity: Number(row.to_quantity) || 1,
		status: row.status as ExchangeTransaction['status'],
		performedBy: row.performed_by as string,
		notes: (row.notes as string) || undefined,
		createdAt: row.created_at ? (row.created_at as { value: string }).value ?? String(row.created_at) : '',
	};
}

function rowToExchangeTransactionItem(row: Record<string, unknown>): ExchangeTransactionItem {
	return {
		id: row.id as string,
		transactionId: row.transaction_id as string,
		bankInventoryId: row.bank_inventory_id as string,
		quantityConsumed: Number(row.quantity_consumed) || 1,
		createdAt: row.created_at ? (row.created_at as { value: string }).value ?? String(row.created_at) : '',
	};
}
