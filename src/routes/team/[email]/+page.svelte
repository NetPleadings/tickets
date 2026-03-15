<script lang="ts">
	import { page } from '$app/state';
	import { events } from '$lib/data/schedule';
	import { allocations, allocationsLoaded } from '$lib/stores/allocations';
	import { team, ensureTeamLoaded } from '$lib/stores/team';
	import { isUpcoming } from '$lib/utils';
	import { teamAbbrevs } from '$lib/data/schedule';
	import { onMount } from 'svelte';

	onMount(() => ensureTeamLoaded());

	const email = $derived(decodeURIComponent(page.params.email));

	// Find the person's allocations
	const personAllocs = $derived(
		$allocations.filter((a) =>
			(a.assigneeEmail?.toLowerCase() === email.toLowerCase() ||
			 a.assignee.toLowerCase() === email.toLowerCase()) &&
			a.status !== 'restricted'
		)
	);

	// Derive name from allocations or team roster
	const personName = $derived.by(() => {
		const fromAlloc = personAllocs.find((a) => a.assignee);
		if (fromAlloc) return fromAlloc.assignee;
		const fromTeam = $team.find((t) => t.email.toLowerCase() === email.toLowerCase());
		if (fromTeam) return fromTeam.name;
		return email;
	});

	const isGuest = $derived(personAllocs.some((a) => a.isGuest));
	const guestCompany = $derived(personAllocs.find((a) => a.guestCompany)?.guestCompany ?? '');

	const teamMember = $derived($team.find((t) => t.email.toLowerCase() === email.toLowerCase()));

	// Map allocations to games
	const games = $derived.by(() => {
		const result: {
			event: typeof events[0];
			alloc: typeof personAllocs[0];
			companions: { name: string; status: string; isGuest: boolean }[];
			upcoming: boolean;
		}[] = [];

		for (const alloc of personAllocs) {
			const event = events.find((e) => e.id === alloc.eventId);
			if (!event) continue;

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

			result.push({
				event,
				alloc,
				companions,
				upcoming: isUpcoming(event.date),
			});
		}

		result.sort((a, b) => a.event.date.localeCompare(b.event.date));
		return result;
	});

	const upcomingGames = $derived(games.filter((g) => g.upcoming));
	const pastGames = $derived(games.filter((g) => !g.upcoming));

	const confirmedCount = $derived(games.filter((g) => g.alloc.status === 'confirmed').length);
	const pendingCount = $derived(games.filter((g) => g.alloc.status === 'pending').length);

	const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	let showPast = $state(false);

	function initials(name: string) {
		return name.split(' ').map((n) => n[0]).join('').toUpperCase();
	}
</script>

{#if !$allocationsLoaded}
	<div class="flex flex-col items-center justify-center py-20 gap-4">
		<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
		<p class="text-sm text-slate font-body">Loading...</p>
	</div>
{:else}
	<div class="space-y-6 animate-in">
		<!-- Back link -->
		<a href="/team" class="inline-flex items-center gap-1 text-sm text-slate font-body hover:text-graphite transition-colors">
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
			Back to Team
		</a>

		<!-- Person header -->
		<div class="bg-graphite rounded-xl p-5 text-white">
			<div class="flex items-center gap-4">
				{#if teamMember?.photoUrl}
					<img src={teamMember.photoUrl} alt={personName} class="w-14 h-14 rounded-xl object-cover" />
				{:else}
					<div class="w-14 h-14 rounded-xl {isGuest ? 'bg-yellow/20 text-gold' : 'bg-jays-blue text-white'} flex items-center justify-center font-display font-bold text-lg">
						{initials(personName)}
					</div>
				{/if}
				<div>
					<h1 class="font-display font-bold text-xl">
						{personName}
						{#if isGuest}
							<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow/15 text-yellow ml-2">Guest</span>
						{/if}
					</h1>
					<p class="text-silver text-sm font-body mt-0.5">
						{#if guestCompany}
							{guestCompany}
						{:else if teamMember?.title}
							{teamMember.title} · {email}
						{:else}
							{email}
						{/if}
					</p>
				</div>
			</div>

			<div class="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/10">
				<div>
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Total</div>
					<div class="text-2xl font-display font-bold text-white">{games.length}</div>
				</div>
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
			</div>
		</div>

		<!-- Upcoming games -->
		{#if upcomingGames.length === 0 && pastGames.length === 0}
			<div class="text-center py-12">
				<p class="text-slate font-body">No games assigned to {personName.split(' ')[0]}.</p>
			</div>
		{:else if upcomingGames.length > 0}
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
				<div class="px-5 py-3 border-b border-crystal-pale">
					<h2 class="font-display font-semibold text-graphite">Upcoming</h2>
				</div>
				<div class="divide-y divide-crystal-pale/60">
					{#each upcomingGames as game (game.alloc.id)}
						{@const d = new Date(game.event.date + 'T12:00:00')}
						<a href="/game/{game.event.id}" class="flex items-center gap-4 px-5 py-4 hover:bg-crystal/30 transition-colors group">
							<div class="text-center w-14 shrink-0">
								<div class="text-[10px] uppercase font-bold text-silver font-body">{weekday[d.getDay()]}</div>
								<div class="text-xl font-display font-bold text-graphite">{d.getDate()}</div>
								<div class="text-[10px] uppercase text-silver font-body">{monthShort[d.getMonth()]}</div>
							</div>

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
										<span class="text-slate">With:</span>
										{#each game.companions as comp, i}
											{#if i > 0}, {/if}
											<span class="{comp.status === 'confirmed' ? 'text-graphite' : 'text-pending'}">{comp.name.split(' ')[0]}{#if comp.isGuest}<span class="text-[9px] text-pending ml-0.5">G</span>{/if}</span>
										{/each}
									</div>
								{/if}
							</div>

							<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0 {
								game.alloc.status === 'confirmed' ? 'bg-confirmed/10 text-confirmed' :
								game.alloc.status === 'pending' ? 'bg-pending/10 text-pending' :
								'bg-declined/10 text-declined'
							}">
								{game.alloc.status}
							</span>
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
						{#each pastGames as game (game.alloc.id)}
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
									{game.alloc.status}
								</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
{/if}
