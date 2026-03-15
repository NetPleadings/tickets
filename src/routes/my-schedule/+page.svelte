<script lang="ts">
	import { events } from '$lib/data/schedule';
	import { allocations, allocationsLoaded } from '$lib/stores/allocations';
	import { currentUser, userLoaded } from '$lib/stores/user';
	import { isUpcoming, formatDateFull } from '$lib/utils';
	import { teamAbbrevs } from '$lib/data/schedule';

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
						<span class="text-silver ml-1">· {nextGame.event.date}</span>
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
								<div class="text-[12px] text-slate font-body mt-0.5">{game.event.time} · {game.event.venue}</div>
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

							<!-- Status -->
							<div class="shrink-0">
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
{/if}
