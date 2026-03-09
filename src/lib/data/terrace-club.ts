// Home Plate Terrace Club — sourced from Blue Jays fan portal
// https://bluejays.fanportal-mlb.com/2026tickets/

const IMG_BASE = 'https://bluejays.fanportal-mlb.com/2026tickets/images';

export const terraceClub = {
	name: 'Home Plate Terrace Club',
	tagline: 'Beyond Premium. Beyond The Game.',
	heroImage: `${IMG_BASE}/home-plate-terrace-club.png`,
	logo: `${IMG_BASE}/logo-beyond.svg`,
	starPattern: `${IMG_BASE}/star-pattern-brown.svg`,
	luxuryBg: `${IMG_BASE}/luxury-star-bg-2.jpg`,
	logeMap: `${IMG_BASE}/loge-map-2.svg`,

	section: '226',
	row: '8',
	seats: ['1', '2', '3', '4'],

	description: 'Welcome to Home Plate Terrace Club, where the energy inside the ballpark flows with the natural elements surrounding it. Prime baseball views from the 200 level directly behind home plate, with an elegant outdoor terrace and an immersive elevated culinary experience.',

	pillars: [
		{
			name: 'Sky',
			icon: `${IMG_BASE}/sky-icon.svg`,
			description: 'Flow seamlessly between the buzz of the ballpark and a vibrant outdoor patio',
		},
		{
			name: 'Warmth',
			icon: `${IMG_BASE}/fire-icon-2.svg`,
			description: 'Welcoming gathering spaces bathed in warm summer sun',
		},
		{
			name: 'Field',
			icon: `${IMG_BASE}/field-icon.svg`,
			description: 'The crack of the bat and pop of the glove from the most sought-after seats in the house',
		},
		{
			name: 'Lake',
			icon: `${IMG_BASE}/lake-icon.svg`,
			description: 'Open-concept bar connecting outdoors and indoors with views toward the lake',
		},
	],

	culinary: [
		{
			name: 'The Dive Sushi Bar',
			description: 'Hand-rolled sushi prepared fresh before your eyes',
			icon: `${IMG_BASE}/icons/food.svg`,
		},
		{
			name: 'The Union',
			description: 'Live-fire pizza oven and carving station with premium cuts',
			icon: `${IMG_BASE}/icons/pizza.svg`,
		},
		{
			name: 'The Parlour',
			description: 'Craft ice cream, milkshakes, and artisan desserts',
			icon: `${IMG_BASE}/icons/cocktail.svg`,
		},
		{
			name: 'The Park',
			description: 'Classic ballpark favorites elevated with premium ingredients',
			icon: `${IMG_BASE}/icons/baseball-bat.svg`,
		},
	],

	amenities: {
		seating: [
			{ label: '200-level views behind home plate', icon: `${IMG_BASE}/icons/homeplate.svg` },
			{ label: 'Extended legroom', icon: `${IMG_BASE}/icons/chair.svg` },
			{ label: 'Luxurious loge and bar rail options', icon: `${IMG_BASE}/icons/loge.svg` },
		],
		culinary: [
			{ label: 'All-inclusive food', icon: `${IMG_BASE}/icons/fine-dinning.svg` },
			{ label: 'Immersive live-action culinary stations', icon: `${IMG_BASE}/icons/food.svg` },
			{ label: 'Premium in-seat service', icon: `${IMG_BASE}/icons/staff.svg` },
		],
		atmosphere: [
			{ label: 'Elegant outdoor patio', icon: `${IMG_BASE}/icons/patio-doors.svg` },
			{ label: 'Open-concept design', icon: `${IMG_BASE}/icons/baseball-field.svg` },
			{ label: 'Extended postgame hours', icon: `${IMG_BASE}/icons/clock.svg` },
		],
	},

	memberBenefits: [
		{ label: 'Postseason priority access', icon: `${IMG_BASE}/icons/tickets.svg` },
		{ label: 'Unlimited ticket exchanges', icon: `${IMG_BASE}/icons/exchange.svg` },
		{ label: '20% Jays Shop discount', icon: `${IMG_BASE}/icons/discount.svg` },
		{ label: 'Free MLB.TV subscription', icon: `${IMG_BASE}/icons/remote.svg` },
		{ label: 'Exclusive parking access', icon: `${IMG_BASE}/icons/parking.svg` },
		{ label: 'Early presale to concerts & events', icon: `${IMG_BASE}/icons/select-benefit.svg` },
		{ label: 'Private members-only entrance', icon: `${IMG_BASE}/icons/entrance.svg` },
		{ label: 'Guaranteed promotional giveaways', icon: `${IMG_BASE}/icons/promotional.svg` },
	],

	links: {
		clubPage: 'https://bluejays.fanportal-mlb.com/beyond/home-plate-terrace-club',
		beyondHub: 'https://www.mlb.com/bluejays/tickets/premium/beyond',
		seatingMap: 'https://www.mlb.com/bluejays/ballpark/seating-map',
		seatView: 'https://www.rateyourseats.com/rogers-centre/seating/sections/226',
		fanPortal: 'https://bluejays.fanportal-mlb.com/2026tickets/jon.corrigan.1553',
	},
};

export const accountManager = {
	name: 'Thomas Dunne',
	pronouns: 'He/Him',
	title: 'Account Manager, Premium Club Service',
	organization: 'Toronto Blue Jays Baseball Club',
	address: 'One Blue Jays Way, Suite 3200, Toronto, ON M5V 1J1',
	phone: '416-341-3974',
	ticketManagerUrl: 'https://am.ticketmaster.com/tbjrc/',
};
