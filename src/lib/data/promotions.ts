// 2026 Blue Jays Promotions Schedule
// Source: https://mktg.mlbstatic.com/bluejays/downloads/pdfs/y2026/Blue-Jays-2026-Promotions-Schedule-v2.pdf

export interface Promotion {
	type: 'giveaway' | 'theme' | 'food' | 'specialty' | 'event';
	name: string;
	detail?: string;
}

// Map of date -> promotions for that game
export const promotions: Record<string, Promotion[]> = {
	'2026-03-27': [
		{ type: 'event', name: 'Opening Night', detail: 'Presented by TD' },
		{ type: 'giveaway', name: 'AL Champions Pennant Giveaway', detail: 'Presented by TD — All fans on entrance' },
		{ type: 'giveaway', name: 'Magnet Schedule Giveaway', detail: 'Presented by Rogers — All fans on exit' },
	],
	'2026-03-28': [
		{ type: 'giveaway', name: 'AL Champions White Panel Hat Giveaway Night', detail: 'Presented by TD' },
	],
	'2026-03-29': [
		{ type: 'theme', name: 'Jr. Jays Opening Day', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Kids Run the Bases', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-03-30': [
		{ type: 'giveaway', name: 'AL Champions Crewneck Giveaway Night', detail: 'Presented by Enercare' },
	],
	'2026-03-31': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-04-01': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-04-06': [
		{ type: 'theme', name: 'Y2K Weekend' },
	],
	'2026-04-07': [
		{ type: 'food', name: '$1 Hot Dog Night at the Ballpark' },
	],
	'2026-04-08': [
		{ type: 'event', name: 'Work From Dome' },
	],
	'2026-04-10': [
		{ type: 'giveaway', name: "Jumpin' George Springer Bobblehead Giveaway Night" },
	],
	'2026-04-11': [
		{ type: 'giveaway', name: 'Addison Barger Couch T-Shirt Giveaway Night' },
	],
	'2026-04-12': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Kids Run the Bases', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-04-24': [
		{ type: 'theme', name: 'Y2K Weekend' },
	],
	'2026-04-25': [
		{ type: 'specialty', name: 'SpongeBob SquarePants Specialty Ticket', detail: 'Includes ticket + Blue Jays SpongeBob SquarePants jersey' },
	],
	'2026-04-26': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'giveaway', name: 'Shane Bieber Red Cut-Off Replica Jersey Giveaway' },
		{ type: 'event', name: 'Kids Run the Bases', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-04-27': [
		{ type: 'giveaway', name: 'Ernie Clement Replica Hockey Jersey Giveaway Night', detail: 'Presented by Explore New Brunswick' },
	],
	'2026-04-28': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-04-29': [
		{ type: 'event', name: 'Work From Dome' },
	],
	'2026-05-08': [
		{ type: 'giveaway', name: 'Trey Yesavage Angry Bird Replica Jersey Giveaway' },
	],
	'2026-05-09': [
		{ type: 'theme', name: 'Blue Jays Barbie Game Day' },
		{ type: 'giveaway', name: 'Blue Jays Barbie Reversible Bucket Hat Giveaway' },
	],
	'2026-05-10': [
		{ type: 'theme', name: "Jr. Jays Mother's Day", detail: 'Presented by Ontario Honda Dealers' },
	],
	'2026-05-11': [
		{ type: 'giveaway', name: 'Legendary Home Runs T-Shirt Giveaway Night', detail: 'Presented by Ryobi' },
	],
	'2026-05-12': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-05-13': [
		{ type: 'specialty', name: 'Naruto Specialty Ticket', detail: 'Includes ticket + Blue Jays Naruto jersey' },
	],
	'2026-05-22': [
		{ type: 'theme', name: 'City Connect Fridays' },
	],
	'2026-05-23': [
		{ type: 'theme', name: 'Cricket Day at the Park', detail: 'Presented by TD' },
		{ type: 'giveaway', name: 'Cricket Sweater Vest Giveaway', detail: 'Presented by TD' },
	],
	'2026-05-24': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Kids Run the Bases', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-05-25': [
		{ type: 'giveaway', name: "'Born Ready' Vladdy Bobblehead Giveaway Night" },
	],
	'2026-05-26': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-05-27': [
		{ type: 'event', name: 'School Day' },
	],
	'2026-06-05': [
		{ type: 'theme', name: 'Pride Night', detail: 'Presented by TD' },
		{ type: 'giveaway', name: 'City Connect Pride Hat Giveaway', detail: 'Presented by TD' },
	],
	'2026-06-07': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'First Outdoor Program', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-06-08': [
		{ type: 'giveaway', name: 'Roy Halladay Retro Replica Jersey Giveaway Night' },
	],
	'2026-06-09': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-06-10': [
		{ type: 'giveaway', name: 'Dylan Cease Bobblehead Giveaway Night' },
	],
	'2026-06-12': [
		{ type: 'giveaway', name: 'Andrés Giménez Replica Soccer Jersey Giveaway Night' },
	],
	'2026-06-14': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Outdoor Program', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-06-22': [
		{ type: 'specialty', name: 'Gate 14 Specialty Ticket', detail: 'Includes ticket + Blue Jays x Gate 14 co-branded t-shirt' },
	],
	'2026-06-23': [
		{ type: 'giveaway', name: 'AL Champions Pennant Giveaway', detail: 'Presented by TD — All fans on entrance' },
	],
	'2026-06-24': [
		{ type: 'giveaway', name: 'Retro Domer Hat Giveaway Night' },
	],
	'2026-06-25': [
		{ type: 'specialty', name: 'Potato Head Specialty Ticket', detail: 'Includes ticket + Blue Jays Potato Head' },
	],
	'2026-06-26': [
		{ type: 'theme', name: 'City Connect Fridays' },
		{ type: 'giveaway', name: 'Alejandro Kirk City Connect Replica Jersey Giveaway' },
	],
	'2026-06-27': [
		{ type: 'food', name: '$1 Hot Dog Night at the Ballpark' },
	],
	'2026-06-28': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Outdoor Program', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-06-29': [
		{ type: 'giveaway', name: 'Bautista & Encarnacion HR Flex Bobblehead Giveaway' },
	],
	'2026-06-30': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-07-01': [
		{ type: 'event', name: 'Canada Day' },
		{ type: 'giveaway', name: 'Blue Jays Commemorative Ticket Giveaway' },
	],
	'2026-07-17': [
		{ type: 'theme', name: 'City Connect Fridays' },
	],
	'2026-07-18': [
		{ type: 'event', name: 'Back-to-Back Statue Unveil' },
	],
	'2026-07-19': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Outdoor Program', detail: 'Kids 14 and under run the bases postgame' },
		{ type: 'food', name: '$0.77 Hot Dog Night at the Ballpark' },
	],
	'2026-07-20': [
		{ type: 'giveaway', name: 'Kazuma Okamoto T-Shirt Giveaway Night' },
	],
	'2026-07-21': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-07-22': [
		{ type: 'specialty', name: 'Stranger Things Specialty Ticket', detail: 'Includes ticket + Blue Jays Mike Wheeler Bobblehead' },
	],
	'2026-07-23': [
		{ type: 'event', name: 'Work From Dome' },
	],
	'2026-07-31': [
		{ type: 'theme', name: 'City Connect Fridays' },
		{ type: 'giveaway', name: 'Blue Jays Retro Hoodie Giveaway' },
	],
	'2026-08-01': [
		{ type: 'theme', name: 'Blue Jays Transformers Day' },
	],
	'2026-08-02': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Outdoor Program', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-08-10': [
		{ type: 'giveaway', name: 'Back-to-Back Replica Statue Giveaway Night' },
	],
	'2026-08-11': [
		{ type: 'giveaway', name: 'Blue Jays Transformers Hat Giveaway' },
		{ type: 'event', name: 'Postgame Movie Screening', detail: 'Transformers: The Movie (1986)' },
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-08-12': [
		{ type: 'specialty', name: 'Youth Baseball Specialty Ticket', detail: 'Includes ticket + Blue Jays youth elbow guard' },
	],
	'2026-08-13': [
		{ type: 'event', name: 'Work From Dome' },
	],
	'2026-08-14': [
		{ type: 'theme', name: 'City Connect Fridays' },
	],
	'2026-08-15': [
		{ type: 'specialty', name: 'Care Bears Specialty Ticket', detail: 'Includes ticket + Blue Jays plush Care Bear' },
	],
	'2026-08-16': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Outdoor Program', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-08-25': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-08-28': [
		{ type: 'theme', name: 'City Connect Fridays' },
	],
	'2026-08-29': [
		{ type: 'giveaway', name: "'92 & '93 World Series Replica Rings Giveaway" },
	],
	'2026-08-30': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Presented by Ontario Honda Dealers' },
		{ type: 'event', name: 'Final Outdoor Program', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-09-11': [
		{ type: 'giveaway', name: 'Blue Jays Classic Retro Bag Giveaway' },
	],
	'2026-09-12': [
		{ type: 'theme', name: 'Blue Jays Hello Kitty Day' },
		{ type: 'giveaway', name: 'Hello Kitty Bobblehead Giveaway' },
	],
	'2026-09-13': [
		{ type: 'theme', name: 'Jr. Jays Sundays', detail: 'Final Jr. Jays Sundays of the season' },
		{ type: 'event', name: 'Kids Run the Bases', detail: 'Kids 14 and under run the bases postgame' },
	],
	'2026-09-14': [
		{ type: 'specialty', name: 'University & College Specialty Ticket', detail: 'Includes ticket + Blue Jays co-branded hat' },
	],
	'2026-09-15': [
		{ type: 'food', name: 'Loonie Dogs Night', detail: 'Presented by Schneiders' },
	],
	'2026-09-16': [
		{ type: 'event', name: 'Work From Dome' },
	],
	'2026-09-25': [
		{ type: 'giveaway', name: 'Carlos Delgado Short-Sleeved Retro Windbreaker Giveaway Night', detail: 'Presented by TD' },
	],
	'2026-09-26': [
		{ type: 'event', name: 'Fan Appreciation Weekend', detail: 'Presented by TD — Activities throughout the ballpark' },
	],
	'2026-09-27': [
		{ type: 'event', name: 'Fan Appreciation Weekend', detail: 'Presented by TD — Activities throughout the ballpark' },
	],
};

// Color/icon mapping for promotion types
export function promoColor(type: Promotion['type']): string {
	switch (type) {
		case 'giveaway': return 'bg-purple-100 text-purple-700';
		case 'theme': return 'bg-pink-100 text-pink-700';
		case 'food': return 'bg-amber-100 text-amber-700';
		case 'specialty': return 'bg-blue-100 text-blue-700';
		case 'event': return 'bg-green-100 text-green-700';
	}
}

export function promoIcon(type: Promotion['type']): string {
	switch (type) {
		case 'giveaway': return '🎁';
		case 'theme': return '🎭';
		case 'food': return '🌭';
		case 'specialty': return '🎟';
		case 'event': return '⭐';
	}
}
