<script lang="ts">
	import { currentUser } from '$lib/stores/user';
	import { events } from '$lib/data/schedule';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { loadAllocations } from '$lib/stores/allocations';

	$effect(() => {
		if ($currentUser && $currentUser.role !== 'admin') {
			goto('/');
		}
	});

	interface AllocRow {
		id: string;
		eventId: string;
		seatId: string;
		assignee: string;
		assigneeEmail: string;
		status: string;
		assignedBy: string;
		assignedAt: string;
		isGuest: boolean;
	}

	interface RequestRow {
		id: string;
		eventId: string;
		requesterEmail: string;
		requesterName: string;
		seatCount: number;
		status: string;
		createdAt: string;
	}

	interface DuplicateGroup {
		key: string;
		allocations: AllocRow[];
	}

	let allocations = $state<AllocRow[]>([]);
	let requests = $state<RequestRow[]>([]);
	let duplicates = $state<DuplicateGroup[]>([]);
	let orphaned = $state<AllocRow[]>([]);
	let loading = $state(true);
	let deleting = $state<string | null>(null);
	let tab = $state<'issues' | 'allocations' | 'requests'>('issues');
	let allocSearch = $state('');
	let requestSearch = $state('');

	onMount(() => loadData());

	async function loadData() {
		loading = true;
		try {
			const res = await fetch('/api/admin/data');
			const data = await res.json();
			if (data.ok) {
				allocations = data.allocations;
				requests = data.requests;
				duplicates = data.issues.duplicates;
				orphaned = data.issues.orphaned;
			}
		} catch { /* ignore */ }
		loading = false;
	}

	async function deleteRow(id: string) {
		deleting = id;
		try {
			const res = await fetch('/api/admin/data', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'deleteAllocation', id }),
			});
			const data = await res.json();
			if (data.ok) {
				allocations = allocations.filter((a) => a.id !== id);
				duplicates = duplicates.map((d) => ({
					...d,
					allocations: d.allocations.filter((a) => a.id !== id),
				})).filter((d) => d.allocations.length > 1);
				orphaned = orphaned.filter((a) => a.id !== id);
				// Refresh the global allocations store
				await loadAllocations();
			}
		} catch { /* ignore */ }
		deleting = null;
	}

	function eventLabel(eventId: string) {
		const e = events.find((ev) => ev.id === eventId);
		return e ? `${e.date} vs ${e.opponent}` : eventId;
	}

	const issueCount = $derived(duplicates.length + orphaned.length);

	const filteredAllocs = $derived(
		allocSearch
			? allocations.filter((a) =>
				a.assignee.toLowerCase().includes(allocSearch.toLowerCase()) ||
				a.assigneeEmail.toLowerCase().includes(allocSearch.toLowerCase()) ||
				a.eventId.toLowerCase().includes(allocSearch.toLowerCase()) ||
				a.id.toLowerCase().includes(allocSearch.toLowerCase())
			)
			: allocations
	);

	const filteredRequests = $derived(
		requestSearch
			? requests.filter((r) =>
				r.requesterName.toLowerCase().includes(requestSearch.toLowerCase()) ||
				r.requesterEmail.toLowerCase().includes(requestSearch.toLowerCase()) ||
				r.eventId.toLowerCase().includes(requestSearch.toLowerCase())
			)
			: requests
	);
</script>

{#if !$currentUser || $currentUser.role !== 'admin'}
	<div class="flex items-center justify-center py-20">
		<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else}
	<div class="space-y-6 animate-in">
		<div class="flex items-center justify-between">
			<div>
				<a href="/admin" class="inline-flex items-center gap-1 text-sm text-slate font-body hover:text-graphite transition-colors mb-2">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
					</svg>
					Admin
				</a>
				<h1 class="font-display font-bold text-2xl text-graphite">Data Browser</h1>
				<p class="text-sm text-slate font-body mt-1">View raw BigQuery rows. Spot and fix data issues.</p>
			</div>
			<button
				onclick={loadData}
				disabled={loading}
				class="px-3 py-1.5 rounded-lg text-[13px] font-semibold font-body bg-crystal text-slate hover:bg-crystal-pale transition-colors disabled:opacity-50"
			>
				{loading ? 'Loading...' : 'Refresh'}
			</button>
		</div>

		<!-- Tabs -->
		<div class="flex gap-1 border-b border-crystal-pale">
			<button
				onclick={() => (tab = 'issues')}
				class="px-4 py-2.5 text-[13px] font-semibold font-body transition-colors relative {
					tab === 'issues' ? 'text-graphite' : 'text-slate hover:text-graphite'
				}"
			>
				Issues
				{#if issueCount > 0}
					<span class="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-declined/15 text-declined">{issueCount}</span>
				{/if}
				{#if tab === 'issues'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow rounded-full"></div>
				{/if}
			</button>
			<button
				onclick={() => (tab = 'allocations')}
				class="px-4 py-2.5 text-[13px] font-semibold font-body transition-colors relative {
					tab === 'allocations' ? 'text-graphite' : 'text-slate hover:text-graphite'
				}"
			>
				Allocations
				<span class="ml-1.5 text-[10px] text-silver">{allocations.length}</span>
				{#if tab === 'allocations'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow rounded-full"></div>
				{/if}
			</button>
			<button
				onclick={() => (tab = 'requests')}
				class="px-4 py-2.5 text-[13px] font-semibold font-body transition-colors relative {
					tab === 'requests' ? 'text-graphite' : 'text-slate hover:text-graphite'
				}"
			>
				Requests
				<span class="ml-1.5 text-[10px] text-silver">{requests.length}</span>
				{#if tab === 'requests'}
					<div class="absolute bottom-0 left-0 right-0 h-0.5 bg-yellow rounded-full"></div>
				{/if}
			</button>
		</div>

		{#if loading}
			<div class="flex flex-col items-center justify-center py-20 gap-4">
				<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
				<p class="text-sm text-slate font-body">Loading data...</p>
			</div>

		{:else if tab === 'issues'}
			<div class="space-y-6">
				{#if issueCount === 0}
					<div class="bg-confirmed/5 border border-confirmed/20 rounded-xl p-6 text-center">
						<p class="text-confirmed font-body font-semibold">No data issues found</p>
						<p class="text-sm text-slate font-body mt-1">All allocations look clean.</p>
					</div>
				{/if}

				{#if duplicates.length > 0}
					<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
						<div class="px-5 py-3 border-b border-crystal-pale bg-declined/5">
							<h2 class="font-display font-semibold text-graphite">Duplicate Seat Allocations</h2>
							<p class="text-[12px] text-slate font-body mt-0.5">Multiple rows for the same seat. Delete the stale one.</p>
						</div>
						<div class="divide-y divide-crystal-pale/60">
							{#each duplicates as dup}
								<div class="px-5 py-4">
								<div class="text-[12px] font-body text-slate mb-2">
										<span class="font-semibold text-graphite">{eventLabel(dup.allocations[0]?.eventId ?? '')}</span>
										&middot; {dup.allocations[0]?.seatId ?? ''}
									</div>
									<div class="space-y-1.5">
										{#each dup.allocations as alloc}
											<div class="flex items-center justify-between py-1.5 px-3 rounded-lg bg-crystal/30">
												<div class="flex items-center gap-3 text-[13px] font-body">
													<span class="font-semibold text-graphite">{alloc.assignee}</span>
													<span class="text-silver">{alloc.assigneeEmail}</span>
													<span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full {
														alloc.status === 'confirmed' ? 'bg-confirmed/10 text-confirmed' :
														alloc.status === 'pending' ? 'bg-pending/10 text-pending' :
														'bg-declined/10 text-declined'
													}">{alloc.status}</span>
												</div>
												<button
													onclick={() => deleteRow(alloc.id)}
													disabled={deleting === alloc.id}
													class="text-[12px] font-body font-semibold text-declined hover:text-declined/80 disabled:opacity-50 px-2 py-1 rounded hover:bg-declined/5 transition-colors"
												>
													{deleting === alloc.id ? 'Deleting...' : 'Delete'}
												</button>
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				{#if orphaned.length > 0}
					<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
						<div class="px-5 py-3 border-b border-crystal-pale bg-pending/5">
							<h2 class="font-display font-semibold text-graphite">Orphaned Allocations</h2>
							<p class="text-[12px] text-slate font-body mt-0.5">Allocations with seat IDs that don't exist in the schedule.</p>
						</div>
						<div class="divide-y divide-crystal-pale/60">
							{#each orphaned as alloc}
								<div class="flex items-center justify-between px-5 py-3">
									<div class="text-[13px] font-body">
										<span class="font-semibold text-graphite">{alloc.assignee}</span>
										<span class="text-silver ml-2">{alloc.eventId} / {alloc.seatId}</span>
									</div>
									<button
										onclick={() => deleteRow(alloc.id)}
										disabled={deleting === alloc.id}
										class="text-[12px] font-body font-semibold text-declined hover:text-declined/80 disabled:opacity-50 px-2 py-1 rounded hover:bg-declined/5 transition-colors"
									>
										{deleting === alloc.id ? 'Deleting...' : 'Delete'}
									</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

		{:else if tab === 'allocations'}
			<div class="space-y-3">
				<input
					type="text"
					bind:value={allocSearch}
					placeholder="Search by name, email, event, or ID..."
					class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
				/>
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full text-[12px] font-body">
							<thead>
								<tr class="bg-crystal/30 text-left">
									<th class="px-3 py-2 font-semibold text-graphite">ID</th>
									<th class="px-3 py-2 font-semibold text-graphite">Event</th>
									<th class="px-3 py-2 font-semibold text-graphite">Seat</th>
									<th class="px-3 py-2 font-semibold text-graphite">Assignee</th>
									<th class="px-3 py-2 font-semibold text-graphite">Email</th>
									<th class="px-3 py-2 font-semibold text-graphite">Status</th>
									<th class="px-3 py-2 font-semibold text-graphite">Assigned</th>
									<th class="px-3 py-2"></th>
								</tr>
							</thead>
							<tbody class="divide-y divide-crystal-pale/60">
								{#each filteredAllocs as alloc (alloc.id)}
									<tr class="hover:bg-crystal/20 transition-colors">
										<td class="px-3 py-2 text-silver font-mono text-[10px]">{alloc.id.replace('alloc-', '')}</td>
										<td class="px-3 py-2 text-graphite">{eventLabel(alloc.eventId)}</td>
										<td class="px-3 py-2 text-silver">{alloc.seatId.split('-').pop()}</td>
										<td class="px-3 py-2 text-graphite font-semibold">
											{alloc.assignee}
											{#if alloc.isGuest}
												<span class="text-[9px] text-pending ml-0.5">G</span>
											{/if}
										</td>
										<td class="px-3 py-2 text-silver">{alloc.assigneeEmail}</td>
										<td class="px-3 py-2">
											<span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full {
												alloc.status === 'confirmed' ? 'bg-confirmed/10 text-confirmed' :
												alloc.status === 'pending' ? 'bg-pending/10 text-pending' :
												alloc.status === 'restricted' ? 'bg-slate/10 text-slate' :
												'bg-declined/10 text-declined'
											}">{alloc.status}</span>
										</td>
										<td class="px-3 py-2 text-silver">{alloc.assignedAt ? new Date(alloc.assignedAt).toLocaleDateString() : ''}</td>
										<td class="px-3 py-2">
											<button
												onclick={() => deleteRow(alloc.id)}
												disabled={deleting === alloc.id}
												class="text-silver hover:text-declined transition-colors disabled:opacity-50"
												title="Delete this allocation row"
											>
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
													<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if filteredAllocs.length === 0}
						<div class="px-5 py-8 text-center text-sm text-slate font-body">
							{allocSearch ? 'No matching allocations.' : 'No allocations.'}
						</div>
					{/if}
				</div>
			</div>

		{:else if tab === 'requests'}
			<div class="space-y-3">
				<input
					type="text"
					bind:value={requestSearch}
					placeholder="Search by name, email, or event..."
					class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
				/>
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full text-[12px] font-body">
							<thead>
								<tr class="bg-crystal/30 text-left">
									<th class="px-3 py-2 font-semibold text-graphite">ID</th>
									<th class="px-3 py-2 font-semibold text-graphite">Event</th>
									<th class="px-3 py-2 font-semibold text-graphite">Requester</th>
									<th class="px-3 py-2 font-semibold text-graphite">Email</th>
									<th class="px-3 py-2 font-semibold text-graphite">Seats</th>
									<th class="px-3 py-2 font-semibold text-graphite">Status</th>
									<th class="px-3 py-2 font-semibold text-graphite">Created</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-crystal-pale/60">
								{#each filteredRequests as req (req.id)}
									<tr class="hover:bg-crystal/20 transition-colors">
										<td class="px-3 py-2 text-silver font-mono text-[10px]">{req.id.replace('req-', '')}</td>
										<td class="px-3 py-2 text-graphite">{eventLabel(req.eventId)}</td>
										<td class="px-3 py-2 text-graphite font-semibold">{req.requesterName}</td>
										<td class="px-3 py-2 text-silver">{req.requesterEmail}</td>
										<td class="px-3 py-2 text-graphite">{req.seatCount}</td>
										<td class="px-3 py-2">
											<span class="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full {
												req.status === 'approved' ? 'bg-confirmed/10 text-confirmed' :
												req.status === 'pending' ? 'bg-pending/10 text-pending' :
												req.status === 'cancelled' ? 'bg-slate/10 text-slate' :
												'bg-declined/10 text-declined'
											}">{req.status}</span>
										</td>
										<td class="px-3 py-2 text-silver">{new Date(req.createdAt).toLocaleDateString()}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
					{#if filteredRequests.length === 0}
						<div class="px-5 py-8 text-center text-sm text-slate font-body">
							{requestSearch ? 'No matching requests.' : 'No requests.'}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
{/if}
