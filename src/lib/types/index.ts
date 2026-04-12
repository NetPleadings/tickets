export interface Event {
	id: string;
	name: string;
	venue: string;
	date: string;
	time: string;
	category: 'blue-jays' | 'hockey' | 'concert' | 'theatre' | 'conference' | 'other';
	totalSeats: number;
	opponent?: string;
	isMarquee?: boolean;
	notes?: string;
}

export interface Seat {
	id: string;
	eventId: string;
	section: string;
	row: string;
	seat: string;
	label: string;
}

export interface Allocation {
	id: string;
	eventId: string;
	seatId: string;
	assignee: string;
	assigneeEmail?: string;
	status: 'confirmed' | 'pending' | 'declined' | 'available' | 'restricted';
	assignedBy: string;
	assignedAt: string;
	notes?: string; // "Guest — Company Name" for customer guests
	isGuest?: boolean;
	guestCompany?: string;
}

export interface Guest {
	id: string;
	name: string;
	company?: string;
	email?: string;
	notes?: string;
	createdAt: string;
}

export interface TicketBlock {
	id: string;
	name: string;
	category: Event['category'];
	venue: string;
	section: string;
	row: string;
	seats: string[];
	seasonYear?: number;
	notes?: string;
}

export type EventWithAllocations = Event & {
	seats: Seat[];
	allocations: Allocation[];
};

// --- Ticket Banking & Exchange ---

export interface BankInventoryItem {
	id: string;
	sourceEventId: string;
	sourceGameDate: string;
	ticketClass: string; // e.g. "Home Plate Terrace Club", "Lower Bowl", "Upper Deck"
	section: string;
	row: string;
	seat: string;
	quantity: number;
	status: 'available' | 'partially_used' | 'used' | 'cancelled';
	bankedBy: string;
	bankedAt: string;
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

export interface ExchangeRule {
	id: string;
	name: string;
	fromTicketClass: string;
	fromQuantity: number;
	toTicketClass: string;
	toQuantity: number;
	active: boolean;
	notes?: string;
	createdBy: string;
	createdAt: string;
	updatedAt: string;
}

export type ExchangeStatus = 'completed' | 'cancelled';

export interface ExchangeTransaction {
	id: string;
	ruleId: string;
	ruleName: string;
	targetEventId: string;
	targetGameDate: string;
	fromTicketClass: string;
	fromQuantity: number;
	toTicketClass: string;
	toQuantity: number;
	status: ExchangeStatus;
	performedBy: string;
	notes?: string;
	createdAt: string;
}

export interface ExchangeTransactionItem {
	id: string;
	transactionId: string;
	bankInventoryId: string;
	quantityConsumed: number;
	createdAt: string;
}
