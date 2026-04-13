<script lang="ts">
	import { events } from '$lib/data/schedule';
	import { allocations, allocationsLoaded } from '$lib/stores/allocations';
	import { currentUser, userLoaded } from '$lib/stores/user';
	import { isUpcoming, formatDateFull } from '$lib/utils';
	import { teamAbbrevs } from '$lib/data/schedule';
	import { terraceClub } from '$lib/data/terrace-club';

	// All allocations for the current user
	const myAllocs = $derived(
		$currentUser
			? $allocations.filter((a) =>
				a.assigneeEmail?.toLowerCase() === $currentUser!.email.toLowerCase() &&
				a.status !== 'restricted'
			)
			: []
	);

	// Map allocations to events with companion info
	const myGames = $derived.by(() => {
		const games: {
			event: typeof events[0];
			myAlloc: typeof myAllocs[0];
			companions: { name: string; status: string; isGuest: boolean }[];
			upcoming: boolean;
		}[] = [];

		for (const alloc of myAllocs) {
			const event = events.find((e) => e.id === alloc.eventId);
			if (!event) continue;

			// Find other people assigned to the same event
			const companions = $allocations
				.filter((a) =>
					a.eventId === alloc.eventId &&
					a.id !== alloc.id &&
					a.status !== 'restricted' &&
					a.assignee
				)
				.map((a) => ({
					name: a.assignee,
					status: a.status,
					isGuest: a.isGuest ?? false,
				}));

			games.push({
				event,
				myAlloc: alloc,
				companions,
				upcoming: isUpcoming(event.date),
			});
		}

		// Sort by date
		games.sort((a, b) => a.event.date.localeCompare(b.event.date));
		return games;
	});

	const upcomingGames = $derived(myGames.filter((g) => g.upcoming));
	const pastGames = $derived(myGames.filter((g) => !g.upcoming));

	const nextGame = $derived(upcomingGames[0]);
	const confirmedCount = $derived(upcomingGames.filter((g) => g.myAlloc.status === 'confirmed').length);
	const pendingCount = $derived(upcomingGames.filter((g) => g.myAlloc.status === 'pending').length);

	const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	let showPast = $state(false);

	// Text message generator
	let shareGameId = $state<string | null>(null);
	let copiedIndex = $state<number | null>(null);

	const shareGame = $derived(myGames.find((g) => g.event.id === shareGameId));

	function generateText(recipientName: string, game: typeof myGames[0]): string {
		const d = new Date(game.event.date + 'T12:00:00');
		const dateStr = d.toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
		const firstName = recipientName.split(' ')[0];

		return `Hi ${firstName}! Here are the details for the Jays game:\n\n` +
			`${game.event.name}\n` +
			`${dateStr} \u00b7 ${game.event.time}\n` +
			`${game.event.venue}\n\n` +
			`Section ${terraceClub.section}, Row ${terraceClub.row}, Seats ${terraceClub.seats.join(', ')}\n` +
			`Home Plate Terrace Club (200 level)\n\n` +
			`All-inclusive food & drinks are included. Enter through the private members entrance.\n\n` +
			`See you there!`;
	}

	async function copyText(text: string, index: number) {
		await navigator.clipboard.writeText(text);
		copiedIndex = index;
		setTimeout(() => { if (copiedIndex === index) copiedIndex = null; }, 2000);
	}
</script>

{#if !$allocationsLoaded || !$userLoaded}
	<div class="flex flex-col items-center justify-center py-20 gap-4">
		<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
		<p class="text-sm text-slate font-body">Loading your schedule...</p>
	</div>
{:else}
	<div class="space-y-6 animate-in">
		<!-- Header -->
		<div>
			<h1 class="font-display font-bold text-2xl text-graphite">My Games</h1>
			<p class="text-sm text-slate font-body mt-1">Your upcoming Blue Jays schedule.</p>
		</div>

		<!-- Schedule disclaimer -->
		<div class="bg-yellow-pale border border-yellow/40 rounded-lg px-4 py-2.5 flex items-start gap-2.5 text-[11px] font-body text-graphite">
			<svg class="w-4 h-4 text-pending shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
			<span>Game dates and times may contain errors or omissions. Please always double-check with the <a href="https://www.mlb.com/bluejays/schedule" target="_blank" class="underline font-semibold hover:text-jays-blue">official Blue Jays schedule</a> before making plans.</span>
		</div>

		<!-- Quick stats -->
		<div class="bg-graphite rounded-xl p-5 text-white">
			<div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
				<div>
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Upcoming</div>
					<div class="text-2xl font-display font-bold text-white">{upcomingGames.length}</div>
				</div>
				<div>
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Confirmed</div>
					<div class="text-2xl font-display font-bold text-confirmed">{confirmedCount}</div>
				</div>
				<div>
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Pending</div>
					<div class="text-2xl font-display font-bold text-pending">{pendingCount}</div>
				</div>
				<div>
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Past</div>
					<div class="text-2xl font-display font-bold text-white/40">{pastGames.length}</div>
				</div>
			</div>

			{#if nextGame}
				<div class="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
					<div class="font-body text-sm">
						<span class="text-silver">Next game:</span>
						<a href="/game/{nextGame.event.id}" class="text-white font-semibold hover:text-yellow transition-colors ml-1">
							vs {nextGame.event.opponent}
						</a>
						<span class="text-silver ml-1">&middot; {nextGame.event.date}</span>
					</div>
					<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full {
						nextGame.myAlloc.status === 'confirmed' ? 'bg-confirmed/20 text-confirmed' : 'bg-pending/20 text-pending'
					}">
						{nextGame.myAlloc.status}
					</span>
				</div>
			{/if}
		</div>

		<!-- Upcoming games -->
		{#if upcomingGames.length === 0}
			<div class="text-center py-12">
				<p class="text-slate font-body">No upcoming games assigned to you.</p>
			</div>
		{:else}
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
				<div class="px-5 py-3 border-b border-crystal-pale">
					<h2 class="font-display font-semibold text-graphite">Upcoming</h2>
				</div>
				<div class="divide-y divide-crystal-pale/60">
					{#each upcomingGames as game (game.myAlloc.id)}
						{@const d = new Date(game.event.date + 'T12:00:00')}
						<a href="/game/{game.event.id}" class="flex items-center gap-4 px-5 py-4 hover:bg-crystal/30 transition-colors group">
							<!-- Date -->
							<div class="text-center w-14 shrink-0">
								<div class="text-[10px] uppercase font-bold text-silver font-body">{weekday[d.getDay()]}</div>
								<div class="text-xl font-display font-bold text-graphite">{d.getDate()}</div>
								<div class="text-[10px] uppercase text-silver font-body">{monthShort[d.getMonth()]}</div>
							</div>

							<!-- Game info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2">
									<span class="font-body font-semibold text-graphite group-hover:text-jays-blue transition-colors">
										vs {game.event.opponent}
									</span>
									{#if game.event.isMarquee}
										<span class="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-jays-navy text-white">M</span>
									{/if}
								</div>
								<div class="text-[12px] text-slate font-body mt-0.5">{game.event.time} &middot; {game.event.venue}</div>
								{#if game.companions.length > 0}
									<div class="text-[11px] text-silver font-body mt-1">
										<span class="text-slate">Going with:</span>
										{#each game.companions as comp, i}
											{#if i > 0}, {/if}
											<span class="{comp.status === 'confirmed' ? 'text-graphite' : 'text-pending'}">{comp.name.split(' ')[0]}{#if comp.isGuest}<span class="text-[9px] text-pending ml-0.5">G</span>{/if}</span>
										{/each}
									</div>
								{/if}
							</div>

							<!-- Status + Share -->
							<div class="shrink-0 flex items-center gap-2">
								{#if game.myAlloc.status === 'confirmed' && game.companions.length > 0}
									<button
										onclick={(e) => { e.preventDefault(); e.stopPropagation(); shareGameId = game.event.id; }}
										class="text-[10px] font-semibold font-body px-2.5 py-1 rounded-md bg-crystal text-slate hover:bg-crystal-pale hover:text-graphite transition-colors flex items-center gap-1"
										title="Generate text messages for attendees"
									>
										<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
											<path stroke-linecap="round" stroke-linejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
										</svg>
										Share
									</button>
								{/if}
								<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full {
									game.myAlloc.status === 'confirmed' ? 'bg-confirmed/10 text-confirmed' :
									game.myAlloc.status === 'pending' ? 'bg-pending/10 text-pending' :
									'bg-declined/10 text-declined'
								}">
									{game.myAlloc.status === 'pending' ? 'invited' : game.myAlloc.status}
								</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Past games toggle -->
		{#if pastGames.length > 0}
			<button
				onclick={() => (showPast = !showPast)}
				class="text-sm text-slate font-body hover:text-graphite transition-colors flex items-center gap-1"
			>
				<svg class="w-4 h-4 transition-transform {showPast ? 'rotate-90' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
				{showPast ? 'Hide' : 'Show'} {pastGames.length} past game{pastGames.length > 1 ? 's' : ''}
			</button>

			{#if showPast}
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden opacity-60">
					<div class="divide-y divide-crystal-pale/60">
						{#each pastGames as game (game.myAlloc.id)}
							{@const d = new Date(game.event.date + 'T12:00:00')}
							<a href="/game/{game.event.id}" class="flex items-center gap-4 px-5 py-3 hover:bg-crystal/30 transition-colors">
								<div class="text-center w-14 shrink-0">
									<div class="text-[10px] uppercase font-bold text-silver font-body">{weekday[d.getDay()]}</div>
									<div class="text-lg font-display font-bold text-graphite">{d.getDate()}</div>
									<div class="text-[10px] uppercase text-silver font-body">{monthShort[d.getMonth()]}</div>
								</div>
								<div class="flex-1 min-w-0">
									<span class="font-body font-semibold text-graphite text-sm">vs {game.event.opponent}</span>
									{#if game.companions.length > 0}
										<div class="text-[11px] text-silver font-body">
											with {game.companions.map((c) => c.name.split(' ')[0]).join(', ')}
										</div>
									{/if}
								</div>
								<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-confirmed/10 text-confirmed">
									{game.myAlloc.status}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Share Modal -->
	{#if shareGameId && shareGame}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
			onclick={() => { shareGameId = null; copiedIndex = null; }}
			onkeydown={(e) => e.key === 'Escape' && (shareGameId = null)}
		>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="bg-white rounded-xl shadow-2xl border border-crystal-pale w-full max-w-lg max-h-[85vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
				<div class="px-5 py-3 border-b border-crystal-pale flex items-center justify-between">
					<div>
						<h3 class="font-display font-semibold text-graphite">Share Game Details</h3>
						<p class="text-[11px] text-slate font-body mt-0.5">vs {shareGame.event.opponent} &middot; {shareGame.event.date}</p>
					</div>
					<button onclick={() => { shareGameId = null; copiedIndex = null; }} class="text-silver hover:text-graphite transition-colors">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<div class="p-4 space-y-4 overflow-y-auto" style="max-height: 70vh;">
					{#each shareGame.companions as comp, i}
						{@const text = generateText(comp.name, shareGame)}
						<div class="rounded-lg border border-crystal-pale">
							<div class="px-4 py-2.5 border-b border-crystal-pale/60 flex items-center justify-between bg-crystal/30">
								<div class="flex items-center gap-2">
									<span class="text-[13px] font-semibold text-graphite font-body">{comp.name}</span>
									{#if comp.isGuest}
										<span class="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-pending/10 text-pending">Guest</span>
									{/if}
								</div>
								<button
									onclick={() => copyText(text, i)}
									class="text-[11px] font-semibold font-body px-3 py-1 rounded-md transition-colors {
										copiedIndex === i
											? 'bg-confirmed/10 text-confirmed'
											: 'bg-graphite text-white hover:bg-graphite-deep'
									}"
								>
									{copiedIndex === i ? 'Copied!' : 'Copy'}
								</button>
							</div>
							<pre class="px-4 py-3 text-[12px] text-graphite font-body whitespace-pre-wrap leading-relaxed">{text}</pre>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
{/if}
