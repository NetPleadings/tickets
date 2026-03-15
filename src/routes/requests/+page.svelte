<script lang="ts">
	import { events } from '$lib/data/schedule';
	import { allocations } from '$lib/stores/allocations';
	import { currentUser, previewAsManager, getEffectiveRole, bookingWindowDays } from '$lib/stores/user';
	import { requests, requestsLoaded, loadRequests, approveRequest, rejectRequest } from '$lib/stores/requests';
	import { buildAllocsByEvent, countStatuses, isUpcoming } from '$lib/utils';
	import { onMount } from 'svelte';

	onMount(() => loadRequests());

	const effectiveRole = $derived(
		$currentUser ? getEffectiveRole($currentUser.role, $previewAsManager) : 'viewer'
	);
	const isAdminView = $derived(effectiveRole === 'admin');

	const allocsByEvent = $derived(buildAllocsByEvent($allocations));

	// Filter tabs
	let statusFilter = $state<'pending' | 'approved' | 'rejected' | 'all'>('pending');

	const filteredRequests = $derived(
		$requests.filter((r) => statusFilter === 'all' || r.status === statusFilter)
	);

	const pendingCount = $derived($requests.filter((r) => r.status === 'pending').length);

	function getEventInfo(eventId: string) {
		return events.find((e) => e.id === eventId);
	}

	function getAvailableSeats(eventId: string): number {
		const event = events.find((e) => e.id === eventId);
		if (!event) return 0;
		const allocs = allocsByEvent.get(eventId) ?? [];
		const counts = countStatuses(allocs);
		return event.totalSeats - counts.confirmed - counts.pending - counts.restricted;
	}

	// Check for conflicting requests on same event
	function getConflictingRequests(eventId: string, currentId: string) {
		return $requests.filter((r) => r.eventId === eventId && r.status === 'pending' && r.id !== currentId);
	}

	const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
</script>

{#if !$requestsLoaded}
	<div class="flex flex-col items-center justify-center py-20 gap-4">
		<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
		<p class="text-sm text-slate font-body">Loading requests...</p>
	</div>
{:else}
	<div class="space-y-6 animate-in">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="font-display font-bold text-2xl text-graphite">
					{isAdminView ? 'All Requests' : 'My Requests'}
				</h1>
				<p class="text-sm text-slate font-body mt-1">
					{isAdminView ? 'Review and approve ticket requests.' : 'Your ticket request history.'}
				</p>
			</div>
			{#if pendingCount > 0}
				<span class="text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-pending/15 text-pending">
					{pendingCount} pending
				</span>
			{/if}
		</div>

		<!-- Filter tabs -->
		<div class="flex items-center gap-1 text-[12px] font-body font-semibold">
			{#each [
				{ key: 'pending', label: 'Pending', color: 'bg-pending/15 text-pending' },
				{ key: 'approved', label: 'Approved', color: 'bg-confirmed/15 text-confirmed' },
				{ key: 'rejected', label: 'Rejected', color: 'bg-declined/15 text-declined' },
				{ key: 'all', label: 'All', color: 'bg-graphite/10 text-graphite' },
			] as tab}
				<button
					onclick={() => (statusFilter = tab.key as typeof statusFilter)}
					class="px-3 py-1.5 rounded-lg transition-all {
						statusFilter === tab.key ? tab.color + ' shadow-sm' : 'text-slate hover:bg-crystal'
					}"
				>
					{tab.label}
					{#if tab.key !== 'all'}
						<span class="ml-1 text-[10px] opacity-70">
							({$requests.filter((r) => r.status === tab.key).length})
						</span>
					{/if}
				</button>
			{/each}
		</div>

		<!-- Requests list -->
		{#if filteredRequests.length === 0}
			<div class="text-center py-12">
				<p class="text-slate font-body">No {statusFilter === 'all' ? '' : statusFilter} requests.</p>
			</div>
		{:else}
			<div class="space-y-3">
				{#each filteredRequests as req (req.id)}
					{@const event = getEventInfo(req.eventId)}
					{@const available = getAvailableSeats(req.eventId)}
					{@const conflicts = getConflictingRequests(req.eventId, req.id)}
					{@const d = event ? new Date(event.date + 'T12:00:00') : null}
					<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5">
						<div class="flex items-start gap-4">
							<!-- Date -->
							{#if d}
								<div class="text-center w-14 shrink-0">
									<div class="text-[10px] uppercase font-bold text-silver font-body">{weekday[d.getDay()]}</div>
									<div class="text-xl font-display font-bold text-graphite">{d.getDate()}</div>
									<div class="text-[10px] uppercase text-silver font-body">{monthShort[d.getMonth()]}</div>
								</div>
							{/if}

							<!-- Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 flex-wrap">
									<a href="/game/{req.eventId}" class="font-body font-semibold text-graphite hover:text-jays-blue transition-colors">
										{event ? `vs ${event.opponent}` : req.eventId}
									</a>
									<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full {
										req.status === 'pending' ? 'bg-pending/10 text-pending' :
										req.status === 'approved' ? 'bg-confirmed/10 text-confirmed' :
										'bg-declined/10 text-declined'
									}">
										{req.status}
									</span>
									{#if req.seatCount > 1}
										<span class="text-[10px] font-body text-slate">{req.seatCount} seats</span>
									{/if}
								</div>

								<div class="text-[12px] text-slate font-body mt-1">
									{#if isAdminView}
										<span class="font-semibold text-graphite">{req.requesterName}</span>
										<span class="text-silver">({req.requesterEmail})</span>
										<span class="text-silver mx-1">·</span>
									{/if}
									{#if event}
										{event.date} · {event.time}
									{/if}
								</div>

								{#if req.notes}
									<p class="text-[12px] text-slate font-body mt-1 italic">"{req.notes}"</p>
								{/if}

								<!-- Conflict warning -->
								{#if req.status === 'pending' && conflicts.length > 0}
									<div class="mt-2 px-3 py-1.5 rounded-md bg-pending/10 text-[11px] font-body text-pending">
										{conflicts.length} other pending request{conflicts.length > 1 ? 's' : ''} for this game:
										{conflicts.map((c) => c.requesterName).join(', ')}
									</div>
								{/if}

								<!-- Availability info -->
								{#if req.status === 'pending' && isAdminView}
									<div class="mt-2 text-[11px] font-body {available > 0 ? 'text-confirmed' : 'text-declined'}">
										{available} seat{available !== 1 ? 's' : ''} available for this game
									</div>
								{/if}

								{#if req.reviewedBy}
									<div class="mt-2 text-[11px] text-silver font-body">
										{req.status === 'approved' ? 'Approved' : 'Rejected'} by {req.reviewedBy}
									</div>
								{/if}
							</div>

							<!-- Actions (admin only) -->
							{#if req.status === 'pending' && isAdminView}
								<div class="flex items-center gap-2 shrink-0">
									<button
										onclick={async () => { await approveRequest(req.id, req.eventId, req.requesterEmail, req.requesterName, req.seatCount); }}
										class="px-3 py-1.5 rounded-lg text-[12px] font-semibold font-body bg-confirmed/10 text-confirmed hover:bg-confirmed/20 transition-colors"
									>
										Approve
									</button>
									<button
										onclick={async () => { await rejectRequest(req.id); }}
										class="px-3 py-1.5 rounded-lg text-[12px] font-semibold font-body bg-declined/10 text-declined hover:bg-declined/20 transition-colors"
									>
										Reject
									</button>
								</div>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/if}
