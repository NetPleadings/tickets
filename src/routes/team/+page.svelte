<script lang="ts">
	import { events } from '$lib/data/schedule';
	import { allocations } from '$lib/stores/allocations';
	import { team, teamLoading, teamError, teamIsLive, loadTeam, ensureTeamLoaded } from '$lib/stores/team';
	import { isUpcoming, buildEventsById } from '$lib/utils';
	import { onMount } from 'svelte';

	onMount(() => ensureTeamLoaded());

	// All unique attendees from allocations (team + guests)
	const eventsById = $derived(buildEventsById(events));

	const attendeeStats = $derived.by(() => {
		const counts = new Map<string, { name: string; email: string; isGuest: boolean; company: string; games: number; upcoming: number }>();

		for (const a of $allocations) {
			if (a.status === 'restricted') continue;
			const key = a.assignee;
			const ev = eventsById.get(a.eventId);
			const isGuestAlloc = a.isGuest ?? false;
			const company = isGuestAlloc ? (a.guestCompany ?? '') : '';

			if (!counts.has(key)) {
				counts.set(key, { name: a.assignee, email: a.assigneeEmail ?? '', isGuest: isGuestAlloc, company, games: 0, upcoming: 0 });
			}
			const m = counts.get(key)!;
			m.games++;
			if (ev && isUpcoming(ev.date)) m.upcoming++;
		}

		return [...counts.values()].sort((a, b) => b.games - a.games);
	});

	// Stats for charts
	const restrictedAllocations = $derived($allocations.filter((a) => a.status === 'restricted').length);
	const activeAllocations = $derived($allocations.filter((a) => a.status !== 'restricted'));
	const totalAllocations = $derived(activeAllocations.length);
	const guestAllocations = $derived(activeAllocations.filter((a) => a.isGuest).length);
	const teamAllocations = $derived(totalAllocations - guestAllocations);
	const teamPct = $derived(totalAllocations > 0 ? (teamAllocations / totalAllocations) * 100 : 0);
	const maxMonthCount = $derived(Math.max(...monthlyDist.map((m) => m.count), 1));

	// Monthly distribution
	const monthlyDist = $derived.by(() => {
		const months = new Map<string, number>();
		for (const a of $allocations) {
			if (a.status === 'restricted') continue;
			const ev = eventsById.get(a.eventId);
			if (!ev) continue;
			const key = ev.date.substring(0, 7);
			months.set(key, (months.get(key) ?? 0) + 1);
		}
		// Fill in all season months
		const result: { month: string; label: string; count: number }[] = [];
		for (let m = 3; m <= 9; m++) {
			const key = `2026-${String(m).padStart(2, '0')}`;
			const label = new Date(2026, m - 1, 1).toLocaleDateString('en-CA', { month: 'short' });
			result.push({ month: key, label, count: months.get(key) ?? 0 });
		}
		return result;
	});

	function initials(name: string) {
		return name.split(' ').map((n) => n[0]).join('').toUpperCase();
	}

	const avatarColors = ['bg-jays-navy', 'bg-graphite-deep', 'bg-gold', 'bg-jays-blue', 'bg-confirmed', 'bg-pending'];
</script>

<div class="space-y-5 animate-in">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="font-display font-bold text-xl text-graphite">Team</h1>
			<p class="text-sm text-slate font-body mt-0.5">
				{#if $teamIsLive}
					Google Workspace · {$team.length} members
				{:else if $teamLoading}
					Loading...
				{:else}
					<span class="text-pending">Google Workspace not connected</span>
				{/if}
			</p>
		</div>
		<div class="flex items-center gap-2">
			{#if $teamIsLive}
				<span class="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-confirmed/10 text-confirmed">Live</span>
			{/if}
			<button
				onclick={() => loadTeam(true)}
				disabled={$teamLoading}
				class="text-[11px] font-semibold font-body px-3 py-1.5 rounded-lg border border-crystal-pale text-slate hover:text-graphite hover:bg-crystal transition-colors disabled:opacity-50 flex items-center gap-1.5"
			>
				<svg class="w-3.5 h-3.5 {$teamLoading ? 'animate-spin' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
				</svg>
				Refresh
			</button>
		</div>
	</div>

	{#if $teamError && !$teamIsLive}
		<div class="bg-pending/5 border border-pending/20 rounded-lg px-4 py-3 text-sm font-body text-pending">
			{$teamError}
		</div>
	{/if}

	<!-- Charts -->
	{#if totalAllocations > 0}
		<div class="grid gap-4 lg:grid-cols-2">
			<!-- Team vs Guest pie -->
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5">
				<h3 class="font-display font-semibold text-graphite text-sm mb-3">Allocation Breakdown</h3>
				<div class="flex items-center gap-6">
					<div class="relative w-24 h-24">
						<svg viewBox="0 0 36 36" class="w-24 h-24 -rotate-90">
							<circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3" class="stroke-crystal-pale" />
							<circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3" class="stroke-jays-blue"
								stroke-dasharray="{teamPct} {100 - teamPct}" />
							{#if guestAllocations > 0}
								<circle cx="18" cy="18" r="15.9" fill="none" stroke-width="3" class="stroke-yellow"
									stroke-dasharray="{100 - teamPct} {teamPct}" stroke-dashoffset="-{teamPct}" />
							{/if}
						</svg>
						<div class="absolute inset-0 flex items-center justify-center">
							<span class="font-display font-bold text-lg text-graphite">{totalAllocations}</span>
						</div>
					</div>
					<div class="space-y-2 text-[12px] font-body">
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-sm bg-jays-blue"></span>
							<span class="text-graphite font-medium">Team: {teamAllocations}</span>
						</div>
						<div class="flex items-center gap-2">
							<span class="w-3 h-3 rounded-sm bg-yellow"></span>
							<span class="text-graphite font-medium">Guests: {guestAllocations}</span>
						</div>
					</div>
				</div>
			</div>

			<!-- Monthly bar chart -->
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5">
				<h3 class="font-display font-semibold text-graphite text-sm mb-3">Monthly Distribution</h3>
				<div class="flex items-end gap-2 h-24">
					{#each monthlyDist as month}
						<div class="flex-1 flex flex-col items-center gap-1">
							<span class="text-[10px] font-body font-semibold text-graphite">{month.count || ''}</span>
							<div
								class="w-full rounded-t-sm transition-all {month.count > 0 ? 'bg-jays-blue/70' : 'bg-crystal-pale'}"
								style="height: {month.count > 0 ? Math.max((month.count / maxMonthCount) * 80, 4) : 4}px"
							></div>
							<span class="text-[9px] font-body text-slate">{month.label}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{:else}
		<div class="bg-crystal/50 rounded-xl border border-crystal-pale p-6 text-center">
			<p class="text-slate font-body text-sm">No seat assignments yet. Assign seats from game pages to see stats here.</p>
		</div>
	{/if}

	<!-- Attendee table -->
	{#if attendeeStats.length > 0}
		<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
			<div class="px-5 py-2.5 border-b border-crystal-pale bg-crystal/30 flex items-center justify-between">
				<span class="text-[10px] uppercase tracking-wider font-semibold text-slate font-body">Attendees</span>
				<span class="text-[10px] text-slate font-body">{attendeeStats.length} people</span>
			</div>
			<div class="divide-y divide-crystal-pale/60">
				{#each attendeeStats as person, i (person.name)}
					<a href="/team/{encodeURIComponent(person.email || person.name)}" class="grid grid-cols-[1fr_80px_80px] gap-4 px-5 py-3.5 items-center hover:bg-crystal/30 transition-colors group">
						<div class="flex items-center gap-3">
							<div class="w-9 h-9 rounded-lg {person.isGuest ? 'bg-yellow/20 text-gold' : avatarColors[i % avatarColors.length] + ' text-white'} flex items-center justify-center font-display font-semibold text-sm">
								{initials(person.name)}
							</div>
							<div>
								<p class="font-body font-semibold text-sm text-graphite group-hover:text-jays-blue transition-colors">
									{person.name}
									{#if person.isGuest}
										<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-yellow/15 text-gold ml-1">Guest</span>
									{/if}
								</p>
								<p class="text-[11px] text-slate font-body">
									{#if person.company}
										{person.company}
									{:else if person.email}
										{person.email}
									{/if}
								</p>
							</div>
						</div>
						<div class="text-center">
							<span class="font-display font-bold text-graphite">{person.games}</span>
							<p class="text-[9px] text-slate font-body">total</p>
						</div>
						<div class="text-center">
							<span class="font-display font-bold text-confirmed">{person.upcoming}</span>
							<p class="text-[9px] text-slate font-body">upcoming</p>
						</div>
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Full team roster -->
	{#if $team.length > 0}
		<div>
			<h2 class="font-display font-semibold text-graphite text-sm mb-2">Full Team Roster</h2>
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
				<div class="divide-y divide-crystal-pale/60">
					{#each $team as member, i (member.email)}
						<a href="/team/{encodeURIComponent(member.email)}" class="px-5 py-2.5 flex items-center gap-3 hover:bg-crystal/30 transition-colors group">
							{#if member.photoUrl}
								<img src={member.photoUrl} alt={member.name} class="w-7 h-7 rounded-md object-cover" />
							{:else}
								<div class="w-7 h-7 rounded-md {avatarColors[i % avatarColors.length]} flex items-center justify-center text-white font-display font-semibold text-[10px]">
									{initials(member.name)}
								</div>
							{/if}
							<div class="flex-1 min-w-0">
								<span class="font-body text-sm font-medium text-graphite group-hover:text-jays-blue transition-colors">{member.name}</span>
								{#if member.title}
									<span class="text-slate text-[11px] font-body ml-1">· {member.title}</span>
								{/if}
							</div>
							<span class="text-[11px] text-silver font-body">{member.email}</span>
						</a>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
