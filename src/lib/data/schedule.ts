import type { Event, Seat, Allocation, TicketBlock } from '$lib/types';

export const ticketBlocks: TicketBlock[] = [
	{
		id: 'block-jays-2026',
		name: '2026 Blue Jays Season Tickets',
		category: 'blue-jays',
		venue: 'Rogers Centre',
		section: '226',
		row: '8',
		seats: ['1', '2', '3', '4'],
		seasonYear: 2026,
		notes: 'Home Plate Terrace Club — 4 seats, full season package'
	}
];

// Full 2026 Blue Jays home schedule (81 games)
const jaysHomeGames: Array<{ date: string; opponent: string; time: string }> = [
	{ date: '2026-03-27', opponent: 'Athletics', time: '7:07 PM' },
	{ date: '2026-03-28', opponent: 'Athletics', time: '3:07 PM' },
	{ date: '2026-03-29', opponent: 'Athletics', time: '1:37 PM' },
	{ date: '2026-03-30', opponent: 'Rockies', time: '7:07 PM' },
	{ date: '2026-03-31', opponent: 'Rockies', time: '7:07 PM' },
	{ date: '2026-04-01', opponent: 'Rockies', time: '1:07 PM' },
	{ date: '2026-04-06', opponent: 'Dodgers', time: '7:07 PM' },
	{ date: '2026-04-07', opponent: 'Dodgers', time: '7:07 PM' },
	{ date: '2026-04-08', opponent: 'Dodgers', time: '3:07 PM' },
	{ date: '2026-04-10', opponent: 'Twins', time: '7:07 PM' },
	{ date: '2026-04-11', opponent: 'Twins', time: '3:07 PM' },
	{ date: '2026-04-12', opponent: 'Twins', time: '1:37 PM' },
	{ date: '2026-04-24', opponent: 'Guardians', time: '7:07 PM' },
	{ date: '2026-04-25', opponent: 'Guardians', time: '3:07 PM' },
	{ date: '2026-04-26', opponent: 'Guardians', time: '1:37 PM' },
	{ date: '2026-04-27', opponent: 'Red Sox', time: '7:07 PM' },
	{ date: '2026-04-28', opponent: 'Red Sox', time: '7:07 PM' },
	{ date: '2026-04-29', opponent: 'Red Sox', time: '3:07 PM' },
	{ date: '2026-05-08', opponent: 'Angels', time: '7:07 PM' },
	{ date: '2026-05-09', opponent: 'Angels', time: '3:07 PM' },
	{ date: '2026-05-10', opponent: 'Angels', time: '1:37 PM' },
	{ date: '2026-05-11', opponent: 'Rays', time: '7:07 PM' },
	{ date: '2026-05-12', opponent: 'Rays', time: '7:07 PM' },
	{ date: '2026-05-13', opponent: 'Rays', time: '7:07 PM' },
	{ date: '2026-05-22', opponent: 'Pirates', time: '7:07 PM' },
	{ date: '2026-05-23', opponent: 'Pirates', time: '3:07 PM' },
	{ date: '2026-05-24', opponent: 'Pirates', time: '12:15 PM' },
	{ date: '2026-05-25', opponent: 'Marlins', time: '7:07 PM' },
	{ date: '2026-05-26', opponent: 'Marlins', time: '7:07 PM' },
	{ date: '2026-05-27', opponent: 'Marlins', time: '1:07 PM' },
	{ date: '2026-06-05', opponent: 'Orioles', time: '7:07 PM' },
	{ date: '2026-06-06', opponent: 'Orioles', time: '3:07 PM' },
	{ date: '2026-06-07', opponent: 'Orioles', time: '1:37 PM' },
	{ date: '2026-06-08', opponent: 'Phillies', time: '7:07 PM' },
	{ date: '2026-06-09', opponent: 'Phillies', time: '7:07 PM' },
	{ date: '2026-06-10', opponent: 'Phillies', time: '7:07 PM' },
	{ date: '2026-06-12', opponent: 'Yankees', time: '7:37 PM' },
	{ date: '2026-06-13', opponent: 'Yankees', time: '3:07 PM' },
	{ date: '2026-06-14', opponent: 'Yankees', time: '1:37 PM' },
	{ date: '2026-06-22', opponent: 'Astros', time: '7:07 PM' },
	{ date: '2026-06-23', opponent: 'Astros', time: '7:07 PM' },
	{ date: '2026-06-24', opponent: 'Astros', time: '7:07 PM' },
	{ date: '2026-06-25', opponent: 'Rangers', time: '7:07 PM' },
	{ date: '2026-06-26', opponent: 'Rangers', time: '7:07 PM' },
	{ date: '2026-06-27', opponent: 'Rangers', time: '3:07 PM' },
	{ date: '2026-06-28', opponent: 'Rangers', time: '1:37 PM' },
	{ date: '2026-06-29', opponent: 'Mets', time: '7:07 PM' },
	{ date: '2026-06-30', opponent: 'Mets', time: '7:07 PM' },
	{ date: '2026-07-01', opponent: 'Mets', time: '3:07 PM' },
	{ date: '2026-07-17', opponent: 'White Sox', time: '7:07 PM' },
	{ date: '2026-07-18', opponent: 'White Sox', time: '3:07 PM' },
	{ date: '2026-07-19', opponent: 'White Sox', time: '12:15 PM' },
	{ date: '2026-07-20', opponent: 'Rays', time: '7:07 PM' },
	{ date: '2026-07-21', opponent: 'Rays', time: '7:07 PM' },
	{ date: '2026-07-22', opponent: 'Rays', time: '7:07 PM' },
	{ date: '2026-07-23', opponent: 'Rays', time: '3:07 PM' },
	{ date: '2026-07-31', opponent: 'Cardinals', time: '7:07 PM' },
	{ date: '2026-08-01', opponent: 'Cardinals', time: '3:07 PM' },
	{ date: '2026-08-02', opponent: 'Cardinals', time: '1:37 PM' },
	{ date: '2026-08-10', opponent: 'Red Sox', time: '7:07 PM' },
	{ date: '2026-08-11', opponent: 'Red Sox', time: '7:07 PM' },
	{ date: '2026-08-12', opponent: 'Red Sox', time: '7:07 PM' },
	{ date: '2026-08-13', opponent: 'Red Sox', time: '3:07 PM' },
	{ date: '2026-08-14', opponent: 'Yankees', time: '7:07 PM' },
	{ date: '2026-08-15', opponent: 'Yankees', time: '3:07 PM' },
	{ date: '2026-08-16', opponent: 'Yankees', time: '1:37 PM' },
	{ date: '2026-08-25', opponent: 'Royals', time: '7:07 PM' },
	{ date: '2026-08-26', opponent: 'Royals', time: '7:07 PM' },
	{ date: '2026-08-27', opponent: 'Royals', time: '7:07 PM' },
	{ date: '2026-08-28', opponent: 'Mariners', time: '7:07 PM' },
	{ date: '2026-08-29', opponent: 'Mariners', time: '3:07 PM' },
	{ date: '2026-08-30', opponent: 'Mariners', time: '1:37 PM' },
	{ date: '2026-09-11', opponent: 'Orioles', time: '7:07 PM' },
	{ date: '2026-09-12', opponent: 'Orioles', time: '3:07 PM' },
	{ date: '2026-09-13', opponent: 'Orioles', time: '1:37 PM' },
	{ date: '2026-09-14', opponent: 'Tigers', time: '7:07 PM' },
	{ date: '2026-09-15', opponent: 'Tigers', time: '7:07 PM' },
	{ date: '2026-09-16', opponent: 'Tigers', time: '3:07 PM' },
	{ date: '2026-09-25', opponent: 'Reds', time: '7:07 PM' },
	{ date: '2026-09-26', opponent: 'Reds', time: '3:07 PM' },
	{ date: '2026-09-27', opponent: 'Reds', time: '3:07 PM' },
];

// MLB team abbreviations for logo display
export const teamAbbrevs: Record<string, string> = {
	'Athletics': 'OAK', 'Rockies': 'COL', 'Dodgers': 'LAD', 'Twins': 'MIN',
	'Guardians': 'CLE', 'Red Sox': 'BOS', 'Angels': 'LAA', 'Rays': 'TB',
	'Pirates': 'PIT', 'Marlins': 'MIA', 'Orioles': 'BAL', 'Phillies': 'PHI',
	'Yankees': 'NYY', 'Astros': 'HOU', 'Rangers': 'TEX', 'Mets': 'NYM',
	'White Sox': 'CWS', 'Cardinals': 'STL', 'Royals': 'KC', 'Mariners': 'SEA',
	'Tigers': 'DET', 'Reds': 'CIN',
};

// Rivalry / marquee game tags
const marqueeOpponents = new Set(['Yankees', 'Red Sox', 'Dodgers', 'Mets']);

function makeGameId(date: string): string {
	return `jays-${date.replace(/-/g, '')}`;
}

export const events: Event[] = jaysHomeGames.map((g) => ({
	id: makeGameId(g.date),
	name: `Blue Jays vs ${g.opponent}`,
	venue: 'Rogers Centre',
	date: g.date,
	time: g.time,
	category: 'blue-jays',
	totalSeats: 4,
	opponent: g.opponent,
	isMarquee: marqueeOpponents.has(g.opponent),
}));

// Generate seats for all games from season ticket block
const block = ticketBlocks[0];

export const seats: Seat[] = events.flatMap((event) =>
	block.seats.map((s, i) => ({
		id: `${event.id}-seat-${i}`,
		eventId: event.id,
		section: block.section,
		row: block.row,
		seat: s,
		label: `Section ${block.section}, Row ${block.row}, Seat ${s}`
	}))
);

// No dummy allocations — all allocations come from user actions (stored in localStorage)
// This is managed by the allocations store

