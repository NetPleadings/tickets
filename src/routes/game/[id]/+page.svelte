<script lang="ts">
	import { page } from '$app/state';
	import { events, seats } from '$lib/data/schedule';
	import { allocations, assignSeat, unassignSeat, confirmSeat, declineSeat, getFrequentAssignees } from '$lib/stores/allocations';
	import { team, ensureTeamLoaded } from '$lib/stores/team';
	import { guests, getOrCreateGuest } from '$lib/stores/guests';
	import { terraceClub } from '$lib/data/terrace-club';
	import { promotions, promoColor, promoIcon } from '$lib/data/promotions';
	import { formatDateFull } from '$lib/utils';
	import { teamAbbrevs } from '$lib/data/schedule';
	import { currentUser, previewAsManager, getEffectiveRole } from '$lib/stores/user';
	import { onMount } from 'svelte';

	onMount(() => ensureTeamLoaded());

	const effectiveRole = $derived(
		$currentUser ? getEffectiveRole($currentUser.role, $previewAsManager) : 'viewer'
	);
	const canManage = $derived(effectiveRole === 'admin');

	const eventId = $derived(page.params.id);
	const event = $derived(events.find((e) => e.id === eventId));
	const eventSeats = $derived(seats.filter((s) => s.eventId === eventId));
	const eventAllocs = $derived($allocations.filter((a) => a.eventId === eventId));

	function getAllocForSeat(seatId: string) {
		return eventAllocs.find((a) => a.seatId === seatId);
	}

	const confirmed = $derived(eventAllocs.filter((a) => a.status === 'confirmed').length);
	const restricted = $derived(eventAllocs.filter((a) => a.status === 'restricted').length);
	const available = $derived(event ? event.totalSeats - eventAllocs.length : 0);
	const gamePromos = $derived(event ? (promotions[event.date] ?? []) : []);

	// Assign modal state
	let assigningSeatId = $state<string | null>(null);
	let assignMode = $state<'team' | 'guest'>('team');
	let searchQuery = $state('');
	let guestName = $state('');
	let guestCompany = $state('');

	// Frequent assignees (top 6)
	const frequentAssignees = $derived(getFrequentAssignees().slice(0, 6));

	// Filtered team for search (allow same person on multiple seats)
	const filteredTeam = $derived(
		$team.filter((m) => {
			if (!searchQuery) return true;
			const q = searchQuery.toLowerCase();
			return m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.title.toLowerCase().includes(q);
		})
	);

	// Guest search
	let guestSearchQuery = $state('');
	let showNewGuestForm = $state(false);
	let newGuestEmail = $state('');

	const filteredGuests = $derived(
		$guests.filter((g) => {
			if (!guestSearchQuery) return true;
			const q = guestSearchQuery.toLowerCase();
			return g.name.toLowerCase().includes(q) || (g.company ?? '').toLowerCase().includes(q) || (g.email ?? '').toLowerCase().includes(q);
		})
	);

	function openAssign(seatId: string) {
		assigningSeatId = seatId;
		assignMode = 'team';
		searchQuery = '';
		guestName = '';
		guestCompany = '';
		guestSearchQuery = '';
		showNewGuestForm = false;
		newGuestEmail = '';
	}

	function closeAssign() {
		assigningSeatId = null;
	}

	function doAssignTeam(name: string, email: string) {
		if (!assigningSeatId || !eventId) return;
		assignSeat({ eventId, seatId: assigningSeatId, assignee: name, assigneeEmail: email });
		closeAssign();
	}

	function doAssignGuest() {
		if (!assigningSeatId || !eventId || !guestName.trim()) return;
		const guest = getOrCreateGuest({
			name: guestName.trim(),
			company: guestCompany.trim() || undefined,
			email: newGuestEmail.trim() || undefined,
		});
		assignSeat({
			eventId,
			seatId: assigningSeatId,
			assignee: guest.name,
			assigneeEmail: guest.email,
			isGuest: true,
			guestCompany: guest.company,
		});
		closeAssign();
	}

	function doAssignExistingGuest(guest: { id: string; name: string; company?: string; email?: string }) {
		if (!assigningSeatId || !eventId) return;
		assignSeat({
			eventId,
			seatId: assigningSeatId,
			assignee: guest.name,
			assigneeEmail: guest.email,
			isGuest: true,
			guestCompany: guest.company,
		});
		closeAssign();
	}

	function doUnassign(allocId: string) {
		unassignSeat(allocId);
	}
</script>

{#if event}
	<div class="space-y-6 animate-in">
		<button
			onclick={() => { if (history.length > 1) history.back(); else location.href = '/'; }}
			class="inline-flex items-center gap-1 text-sm text-slate hover:text-graphite font-body transition-colors cursor-pointer"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
			Back to schedule
		</button>

		<!-- Game header -->
		<div class="bg-graphite rounded-xl p-6 text-white relative overflow-hidden">
			<div class="absolute inset-0 opacity-[0.03] text-yellow font-display text-[200px] leading-none font-bold select-none pointer-events-none">
				<div class="absolute -top-10 -right-10">{teamAbbrevs[event.opponent ?? ''] ?? ''}</div>
			</div>
			<div class="relative z-10">
				<div class="flex items-center gap-2 mb-2">
					{#if event.isMarquee}
						<span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-jays-red text-white">Marquee Game</span>
					{/if}
					<span class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-silver">Home Plate Terrace Club</span>
				</div>
				<h1 class="font-display font-bold text-2xl">{event.name}</h1>
				<p class="text-silver font-body mt-1">{formatDateFull(event.date)} · {event.time}</p>
				<p class="text-silver font-body text-sm">{event.venue} · Section {terraceClub.section}, Row {terraceClub.row}</p>
			</div>
		</div>

		<div class="grid gap-6 lg:grid-cols-3">
			<!-- Seats -->
			<div class="lg:col-span-2">
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
					<div class="px-5 py-3 border-b border-crystal-pale flex items-center justify-between">
						<h2 class="font-display font-semibold text-graphite">Seats</h2>
						<div class="text-[11px] font-body flex items-center gap-2">
							{#if restricted > 0}
								<span class="text-graphite/50 font-semibold">{restricted} restricted</span>
							{/if}
							{#if available > 0}
								<span class="text-confirmed font-semibold">{available} available</span>
							{:else if restricted < event.totalSeats}
								<span class="text-slate">All assigned</span>
							{/if}
						</div>
					</div>

					<div class="divide-y divide-crystal-pale/60">
						{#each eventSeats as seat (seat.id)}
							{@const alloc = getAllocForSeat(seat.id)}
							<div class="px-5 py-3.5 flex items-center justify-between">
								<div class="flex items-center gap-3">
									<div class="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-display font-bold
										{alloc?.status === 'confirmed' ? 'bg-confirmed/10 text-confirmed' :
										 alloc?.status === 'pending' ? 'bg-pending/10 text-pending' :
										 alloc?.status === 'declined' ? 'bg-declined/10 text-declined' :
										 alloc?.status === 'restricted' ? 'bg-graphite/10 text-graphite' :
										 'bg-crystal text-silver'}">
										{seat.seat}
									</div>
									<div>
										{#if alloc?.status === 'restricted'}
											<p class="text-sm font-semibold text-graphite/50 font-body flex items-center gap-1.5">
												Restricted
												<svg class="w-3.5 h-3.5 text-graphite/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
												</svg>
											</p>
											{#if alloc.notes}
												<p class="text-[11px] text-slate font-body">{alloc.notes}</p>
											{/if}
										{:else if alloc}
											<p class="text-sm font-semibold text-graphite font-body flex items-center gap-1.5">
												{alloc.assignee}
												{#if alloc.isGuest}
													<span class="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full bg-pending/10 text-pending">Guest</span>
												{/if}
											</p>
											<p class="text-[11px] text-slate font-body">
												{#if alloc.isGuest && alloc.guestCompany}
													{alloc.guestCompany}
												{:else if alloc.assigneeEmail}
													{alloc.assigneeEmail}
												{/if}
											</p>
										{:else}
											<p class="text-sm text-silver font-body italic">Unassigned</p>
											<p class="text-[11px] text-silver font-body">{seat.label}</p>
										{/if}
									</div>
								</div>

								<div class="flex items-center gap-2">
									{#if alloc?.status === 'restricted'}
										<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-graphite/10 text-graphite/50">
											restricted
										</span>
										{#if canManage}
											<button
												onclick={() => doUnassign(alloc.id)}
												class="text-[11px] font-body text-silver hover:text-declined transition-colors"
												title="Remove restriction"
											>
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										{/if}
									{:else if alloc}
										<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full
											{alloc.status === 'confirmed' ? 'bg-confirmed/10 text-confirmed' :
											 alloc.status === 'pending' ? 'bg-pending/10 text-pending' :
											 'bg-declined/10 text-declined'}">
											{alloc.status === 'pending' ? 'invited' : alloc.status}
										</span>

										{#if canManage}
											{#if alloc.status === 'pending'}
												<button
													onclick={() => confirmSeat(alloc.id)}
													class="text-[11px] font-semibold font-body px-2.5 py-1 rounded-md bg-confirmed/10 text-confirmed hover:bg-confirmed/20 transition-colors"
													title="Mark as confirmed"
												>
													Confirm
												</button>
												<button
													onclick={() => declineSeat(alloc.id)}
													class="text-[11px] font-semibold font-body px-2.5 py-1 rounded-md bg-declined/10 text-declined hover:bg-declined/20 transition-colors"
													title="Mark as declined"
												>
													Decline
												</button>
											{/if}

											{#if alloc.status === 'declined'}
												<button
													onclick={() => confirmSeat(alloc.id)}
													class="text-[11px] font-semibold font-body px-2.5 py-1 rounded-md bg-confirmed/10 text-confirmed hover:bg-confirmed/20 transition-colors"
													title="Re-confirm"
												>
													Confirm
												</button>
											{/if}

											<button
												onclick={() => doUnassign(alloc.id)}
												class="text-[11px] font-body text-silver hover:text-declined transition-colors"
												title="Remove"
											>
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										{/if}
									{:else}
										{#if canManage}
											<button
												onclick={() => openAssign(seat.id)}
												class="text-[11px] font-semibold font-body px-3 py-1.5 rounded-lg bg-graphite text-white hover:bg-graphite-deep transition-colors"
											>
												Assign
											</button>
										{:else}
											<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-crystal text-silver">
												available
											</span>
										{/if}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>

			<!-- Sidebar -->
			<div class="space-y-4">
				<!-- Promotions -->
				{#if gamePromos.length > 0}
					<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4">
						<h3 class="font-display font-semibold text-graphite text-sm mb-3">Promotions & Events</h3>
						<div class="space-y-2">
							{#each gamePromos as promo}
								<div class="flex items-start gap-2.5">
									<span class="text-sm mt-0.5">{promoIcon(promo.type)}</span>
									<div>
										<span class="text-[12px] font-semibold font-body text-graphite">{promo.name}</span>
										{#if promo.detail}
											<p class="text-[11px] text-slate font-body">{promo.detail}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Venue details -->
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4">
					<h3 class="font-display font-semibold text-graphite text-sm mb-3">Venue Details</h3>
					<div class="space-y-2 text-[12px] font-body text-slate">
						<div class="flex justify-between"><span>Section</span><span class="font-semibold text-graphite">{terraceClub.section}</span></div>
						<div class="flex justify-between"><span>Row</span><span class="font-semibold text-graphite">{terraceClub.row}</span></div>
						<div class="flex justify-between"><span>Seats</span><span class="font-semibold text-graphite">{terraceClub.seats.join(', ')}</span></div>
						<div class="flex justify-between"><span>Level</span><span class="font-semibold text-graphite">200 (Terrace)</span></div>
					</div>
					<a href="/seats" class="block mt-3 text-center text-[11px] font-semibold text-jays-blue hover:text-jays-navy transition-colors">
						View Terrace Club details &rarr;
					</a>
				</div>
			</div>
		</div>
	</div>

	<!-- Assign Modal -->
	{#if assigningSeatId}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onclick={closeAssign} onkeydown={(e) => e.key === 'Escape' && closeAssign()}>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="bg-white rounded-xl shadow-2xl border border-crystal-pale w-full max-w-md max-h-[80vh] overflow-hidden" onclick={(e) => e.stopPropagation()}>
				<div class="px-5 py-3 border-b border-crystal-pale flex items-center justify-between">
					<h3 class="font-display font-semibold text-graphite">Assign Seat</h3>
					<button onclick={closeAssign} class="text-silver hover:text-graphite transition-colors">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				</div>

				<!-- Tab toggle -->
				<div class="flex border-b border-crystal-pale">
					<button
						class="flex-1 px-4 py-2 text-[12px] font-semibold font-body transition-colors
							{assignMode === 'team' ? 'text-graphite border-b-2 border-graphite' : 'text-slate hover:text-graphite'}"
						onclick={() => (assignMode = 'team')}
					>
						Team Member
					</button>
					<button
						class="flex-1 px-4 py-2 text-[12px] font-semibold font-body transition-colors
							{assignMode === 'guest' ? 'text-graphite border-b-2 border-graphite' : 'text-slate hover:text-graphite'}"
						onclick={() => (assignMode = 'guest')}
					>
						Customer / Guest
					</button>
				</div>

				<div class="p-4 overflow-y-auto" style="max-height: 60vh;">
					{#if assignMode === 'team'}
						<!-- Frequent assignees -->
						{#if frequentAssignees.length > 0 && !searchQuery}
							<div class="mb-3">
								<p class="text-[10px] uppercase tracking-wider font-semibold text-slate font-body mb-1.5">Frequent</p>
								<div class="space-y-1">
									{#each frequentAssignees as person}
										<button
											class="w-full text-left px-3 py-2 rounded-lg text-[12px] font-body transition-colors flex items-center justify-between hover:bg-crystal text-graphite"
											onclick={() => person.isGuest ? doAssignExistingGuest({ id: '', name: person.name, company: person.guestCompany, email: person.email || undefined }) : doAssignTeam(person.name, person.email)}
										>
											<span class="flex items-center gap-1.5">
												{person.name}
												{#if person.isGuest}
													<span class="text-[9px] font-bold uppercase tracking-wider px-1 py-0.5 rounded-full bg-pending/10 text-pending">Guest</span>
												{/if}
											</span>
											<span class="text-[10px] text-silver">{person.count} games</span>
										</button>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Search -->
						<input
							type="text"
							placeholder="Search team..."
							bind:value={searchQuery}
							class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-sm font-body focus:outline-none focus:ring-1 focus:ring-graphite mb-2"
						/>

						<div class="space-y-0.5 max-h-48 overflow-y-auto">
							{#each filteredTeam as member (member.email)}
								<button
									class="w-full text-left px-3 py-2 rounded-lg text-[12px] font-body hover:bg-crystal text-graphite transition-colors flex items-center justify-between"
									onclick={() => doAssignTeam(member.name, member.email)}
								>
									<div>
										<span class="font-medium">{member.name}</span>
										{#if member.title}
											<span class="text-slate ml-1">· {member.title}</span>
										{/if}
									</div>
								</button>
							{:else}
								<p class="text-[12px] text-silver font-body py-2 text-center">
									{$team.length === 0 ? 'Team not loaded — check Google Workspace connection' : 'No matches'}
								</p>
							{/each}
						</div>
					{:else}
						<!-- Guest / Customer -->
						{#if !showNewGuestForm}
							<!-- Search existing guests -->
							<input
								type="text"
								placeholder="Search guests..."
								bind:value={guestSearchQuery}
								class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-sm font-body focus:outline-none focus:ring-1 focus:ring-graphite mb-2"
							/>

							{#if $guests.length > 0}
								<div class="space-y-0.5 max-h-48 overflow-y-auto mb-3">
									{#each filteredGuests as guest (guest.id)}
										<button
											class="w-full text-left px-3 py-2 rounded-lg text-[12px] font-body hover:bg-crystal text-graphite transition-colors flex items-center justify-between"
											onclick={() => doAssignExistingGuest(guest)}
										>
											<div>
												<span class="font-medium">{guest.name}</span>
												{#if guest.company}
													<span class="text-slate ml-1">· {guest.company}</span>
												{/if}
											</div>
										</button>
									{:else}
										<p class="text-[12px] text-silver font-body py-2 text-center">No matching guests</p>
									{/each}
								</div>
							{:else}
								<p class="text-[12px] text-silver font-body py-2 text-center mb-3">No guests yet</p>
							{/if}

							<button
								onclick={() => { showNewGuestForm = true; guestName = guestSearchQuery; }}
								class="w-full py-2 rounded-lg border-2 border-dashed border-crystal-pale text-slate font-body font-semibold text-[12px] hover:border-graphite hover:text-graphite transition-colors"
							>
								+ Add New Guest
							</button>
						{:else}
							<!-- New guest form -->
							<button
								onclick={() => (showNewGuestForm = false)}
								class="text-[11px] text-slate hover:text-graphite font-body mb-2 flex items-center gap-1"
							>
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
								</svg>
								Back to guest list
							</button>
							<div class="space-y-3">
								<div>
									<label class="text-[11px] font-semibold text-slate font-body uppercase tracking-wider" for="guest-name">Name *</label>
									<input
										id="guest-name"
										type="text"
										placeholder="Customer name"
										bind:value={guestName}
										class="w-full mt-1 px-3 py-2 rounded-lg border border-crystal-pale text-sm font-body focus:outline-none focus:ring-1 focus:ring-graphite"
									/>
								</div>
								<div>
									<label class="text-[11px] font-semibold text-slate font-body uppercase tracking-wider" for="guest-company">Company</label>
									<input
										id="guest-company"
										type="text"
										placeholder="Company name (optional)"
										bind:value={guestCompany}
										class="w-full mt-1 px-3 py-2 rounded-lg border border-crystal-pale text-sm font-body focus:outline-none focus:ring-1 focus:ring-graphite"
									/>
								</div>
								<div>
									<label class="text-[11px] font-semibold text-slate font-body uppercase tracking-wider" for="guest-email">Email</label>
									<input
										id="guest-email"
										type="email"
										placeholder="Email (optional)"
										bind:value={newGuestEmail}
										class="w-full mt-1 px-3 py-2 rounded-lg border border-crystal-pale text-sm font-body focus:outline-none focus:ring-1 focus:ring-graphite"
									/>
								</div>
								<button
									onclick={doAssignGuest}
									disabled={!guestName.trim()}
									class="w-full py-2 rounded-lg bg-graphite text-white font-body font-semibold text-sm hover:bg-graphite-deep transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
								>
									Add & Assign Guest
								</button>
							</div>
						{/if}
					{/if}
				</div>
			</div>
		</div>
	{/if}
{:else}
	<div class="text-center py-16">
		<p class="text-slate font-body">Game not found.</p>
		<a href="/" class="text-sm text-jays-blue hover:underline font-body mt-2 inline-block">Back to schedule</a>
	</div>
{/if}
