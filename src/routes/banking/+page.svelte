<script lang="ts">
	import { currentUser } from '$lib/stores/user';
	import { allocations } from '$lib/stores/allocations';
	import { bankInventory, bankInventoryLoaded, loadBankInventory, bankTickets, cancelBankItem } from '$lib/stores/banking';
	import { events, seats } from '$lib/data/schedule';
	import { ticketBlocks } from '$lib/data/schedule';
	import { formatDate, isUpcoming } from '$lib/utils';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { BankInventoryItem } from '$lib/types';

	$effect(() => {
		if ($currentUser && $currentUser.role !== 'admin') {
			goto('/');
		}
	});

	onMount(() => {
		if (!$bankInventoryLoaded) loadBankInventory();
	});

	// Banking form state
	let showBankForm = $state(false);
	let selectedEventId = $state('');
	let selectedSeatIds = $state<string[]>([]);
	let bankNotes = $state('');
	let banking = $state(false);

	// View mode
	let viewMode = $state<'inventory' | 'bank'>('inventory');

	const block = ticketBlocks[0];
	const defaultTicketClass = 'Home Plate Terrace Club';

	// Events that can be banked: upcoming, with our season ticket seats
	const bankableEvents = $derived.by(() => {
		const bankedEventSeats = new Set(
			$bankInventory
				.filter((i) => i.status !== 'cancelled')
				.map((i) => `${i.sourceEventId}:${i.seat}`)
		);

		return events
			.filter((e) => e.category === 'blue-jays' && isUpcoming(e.date))
			.map((e) => {
				const eventSeats = seats.filter((s) => s.eventId === e.id);
				const eventAllocs = $allocations.filter((a) => a.eventId === e.id);

				// Seats that are unallocated and not already banked
				const availableSeats = eventSeats.filter((s) => {
					const allocated = eventAllocs.some(
						(a) => a.seatId === s.id && a.status !== 'declined'
					);
					const banked = bankedEventSeats.has(`${e.id}:${s.seat}`);
					return !allocated && !banked;
				});

				return { event: e, availableSeats };
			})
			.filter((e) => e.availableSeats.length > 0);
	});

	const selectedEventData = $derived(
		bankableEvents.find((e) => e.event.id === selectedEventId)
	);

	// Inventory stats
	const inventoryStats = $derived.by(() => {
		const available = $bankInventory.filter((i) => i.status === 'available' || i.status === 'partially_used');
		const totalQty = available.reduce((sum, i) => sum + i.quantity, 0);
		const byClass = new Map<string, number>();
		for (const item of available) {
			byClass.set(item.ticketClass, (byClass.get(item.ticketClass) || 0) + item.quantity);
		}
		return { totalQty, byClass, count: available.length };
	});

	function selectEvent(eventId: string) {
		selectedEventId = eventId;
		selectedSeatIds = [];
	}

	function toggleSeat(seatId: string) {
		if (selectedSeatIds.includes(seatId)) {
			selectedSeatIds = selectedSeatIds.filter((s) => s !== seatId);
		} else {
			selectedSeatIds = [...selectedSeatIds, seatId];
		}
	}

	function selectAllSeats() {
		if (!selectedEventData) return;
		selectedSeatIds = selectedEventData.availableSeats.map((s) => s.id);
	}

	async function handleBank() {
		if (!selectedEventData || selectedSeatIds.length === 0) return;
		banking = true;

		const now = new Date().toISOString();
		const event = selectedEventData.event;

		for (const seatId of selectedSeatIds) {
			const seat = selectedEventData.availableSeats.find((s) => s.id === seatId);
			if (!seat) continue;

			const item: BankInventoryItem = {
				id: `bank-${Date.now()}-${seat.seat}`,
				sourceEventId: event.id,
				sourceGameDate: event.date,
				ticketClass: defaultTicketClass,
				section: seat.section,
				row: seat.row,
				seat: seat.seat,
				quantity: 1,
				status: 'available',
				bankedBy: $currentUser?.email || '',
				bankedAt: now,
				notes: bankNotes.trim() || undefined,
				createdAt: now,
				updatedAt: now,
			};

			await bankTickets(item);
		}

		banking = false;
		selectedEventId = '';
		selectedSeatIds = [];
		bankNotes = '';
		viewMode = 'inventory';
	}

	async function handleCancel(id: string) {
		await cancelBankItem(id);
	}

	function statusLabel(status: string): string {
		switch (status) {
			case 'available': return 'Available';
			case 'partially_used': return 'Partial';
			case 'used': return 'Used';
			case 'cancelled': return 'Cancelled';
			default: return status;
		}
	}

	function statusColor(status: string): string {
		switch (status) {
			case 'available': return 'bg-confirmed/10 text-confirmed';
			case 'partially_used': return 'bg-pending/10 text-pending';
			case 'used': return 'bg-silver/20 text-silver';
			case 'cancelled': return 'bg-declined/10 text-declined';
			default: return 'bg-silver/20 text-silver';
		}
	}

	// Find the event name for an inventory item
	function eventName(eventId: string): string {
		const e = events.find((ev) => ev.id === eventId);
		return e ? `vs ${e.opponent}` : eventId;
	}
</script>

{#if !$currentUser || $currentUser.role !== 'admin'}
	<div class="flex items-center justify-center py-20">
		<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else}
	<div class="space-y-6 animate-in">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="font-display font-bold text-2xl text-graphite">Ticket Banking</h1>
				<p class="text-sm text-slate font-body mt-1">Bank unused tickets from upcoming games into the shared inventory pool.</p>
			</div>
			<div class="flex items-center gap-1 bg-crystal rounded-lg p-0.5">
				<button
					onclick={() => (viewMode = 'inventory')}
					class="px-3 py-1.5 rounded-md text-[13px] font-semibold font-body transition-all {
						viewMode === 'inventory' ? 'bg-white text-graphite shadow-sm' : 'text-slate hover:text-graphite'
					}"
				>
					Inventory
				</button>
				<button
					onclick={() => (viewMode = 'bank')}
					class="px-3 py-1.5 rounded-md text-[13px] font-semibold font-body transition-all {
						viewMode === 'bank' ? 'bg-white text-graphite shadow-sm' : 'text-slate hover:text-graphite'
					}"
				>
					Bank Tickets
				</button>
			</div>
		</div>

		<!-- Stats -->
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4">
				<div class="text-[12px] text-slate font-body uppercase tracking-wider">Available</div>
				<div class="text-2xl font-display font-bold text-graphite mt-0.5">{inventoryStats.totalQty}</div>
				<div class="text-[12px] text-silver font-body">tickets in pool</div>
			</div>
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4">
				<div class="text-[12px] text-slate font-body uppercase tracking-wider">Lots</div>
				<div class="text-2xl font-display font-bold text-graphite mt-0.5">{inventoryStats.count}</div>
				<div class="text-[12px] text-silver font-body">banked entries</div>
			</div>
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4">
				<div class="text-[12px] text-slate font-body uppercase tracking-wider">Total Banked</div>
				<div class="text-2xl font-display font-bold text-graphite mt-0.5">{$bankInventory.filter((i) => i.status !== 'cancelled').length}</div>
				<div class="text-[12px] text-silver font-body">all time</div>
			</div>
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4">
				<div class="text-[12px] text-slate font-body uppercase tracking-wider">Bankable Games</div>
				<div class="text-2xl font-display font-bold text-graphite mt-0.5">{bankableEvents.length}</div>
				<div class="text-[12px] text-silver font-body">with free seats</div>
			</div>
		</div>

		{#if viewMode === 'bank'}
			<!-- Bank Tickets Flow -->
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
				<h2 class="font-display font-semibold text-lg text-graphite mb-1">Bank Tickets</h2>
				<p class="text-sm text-slate font-body mb-4">Select a game and the seats you want to bank into the shared pool.</p>

				<!-- Step 1: Select Game -->
				<div class="mb-4">
					<label class="block text-[13px] font-semibold font-body text-graphite mb-2">1. Select Game</label>
					{#if bankableEvents.length === 0}
						<p class="text-sm text-silver font-body">No upcoming games with available seats to bank.</p>
					{:else}
						<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
							{#each bankableEvents as { event, availableSeats } (event.id)}
								<button
									onclick={() => selectEvent(event.id)}
									class="text-left px-3 py-2.5 rounded-lg border transition-all {
										selectedEventId === event.id
											? 'border-jays-blue bg-jays-light/50'
											: 'border-crystal-pale hover:border-crystal-pale hover:bg-crystal/30'
									}"
								>
									<div class="text-[13px] font-semibold font-body text-graphite">vs {event.opponent}</div>
									<div class="text-[12px] text-slate font-body">{formatDate(event.date)} &middot; {event.time}</div>
									<div class="text-[11px] text-silver font-body mt-0.5">{availableSeats.length} seat{availableSeats.length !== 1 ? 's' : ''} available</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Step 2: Select Seats -->
				{#if selectedEventData}
					<div class="mb-4">
						<div class="flex items-center justify-between mb-2">
							<label class="text-[13px] font-semibold font-body text-graphite">2. Select Seats to Bank</label>
							<button
								onclick={selectAllSeats}
								class="text-[12px] font-semibold font-body text-jays-blue hover:underline"
							>
								Select All
							</button>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each selectedEventData.availableSeats as seat (seat.id)}
								<button
									onclick={() => toggleSeat(seat.id)}
									class="px-3 py-2 rounded-lg border text-[13px] font-body transition-all {
										selectedSeatIds.includes(seat.id)
											? 'border-jays-blue bg-jays-light/50 text-jays-blue font-semibold'
											: 'border-crystal-pale text-graphite hover:border-crystal-pale hover:bg-crystal/30'
									}"
								>
									Seat {seat.seat}
									<span class="text-[11px] text-slate ml-1">S{seat.section} R{seat.row}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Notes -->
					<div class="mb-4">
						<label class="block text-[13px] font-semibold font-body text-graphite mb-1">3. Notes (optional)</label>
						<input
							type="text"
							bind:value={bankNotes}
							placeholder="e.g. Not attending this game"
							class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
						/>
					</div>

					<!-- Summary & Submit -->
					{#if selectedSeatIds.length > 0}
						<div class="bg-crystal/30 rounded-lg px-4 py-3 mb-4 text-sm font-body">
							<span class="text-slate">Banking</span>
							<span class="font-semibold text-graphite mx-1">{selectedSeatIds.length} ticket{selectedSeatIds.length !== 1 ? 's' : ''}</span>
							<span class="text-slate">from</span>
							<span class="font-semibold text-graphite mx-1">vs {selectedEventData.event.opponent}</span>
							<span class="text-slate">({formatDate(selectedEventData.event.date)})</span>
							<span class="text-slate ml-1">as</span>
							<span class="font-semibold text-graphite ml-1">{defaultTicketClass}</span>
						</div>
					{/if}

					<button
						onclick={handleBank}
						disabled={banking || selectedSeatIds.length === 0}
						class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors disabled:opacity-50"
					>
						{banking ? 'Banking...' : `Bank ${selectedSeatIds.length} Ticket${selectedSeatIds.length !== 1 ? 's' : ''}`}
					</button>
				{/if}
			</div>
		{:else}
			<!-- Inventory View -->
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
				<h2 class="font-display font-semibold text-lg text-graphite mb-1">Banked Inventory</h2>
				<p class="text-sm text-slate font-body mb-4">All tickets in the shared banking pool.</p>

				{#if !$bankInventoryLoaded}
					<div class="flex items-center gap-2 text-sm text-slate">
						<div class="w-4 h-4 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
						Loading...
					</div>
				{:else if $bankInventory.length === 0}
					<div class="text-center py-8">
						<p class="text-sm text-silver font-body mb-3">No tickets have been banked yet.</p>
						<button
							onclick={() => (viewMode = 'bank')}
							class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors"
						>
							Bank Your First Tickets
						</button>
					</div>
				{:else}
					<!-- Class breakdown -->
					{#if inventoryStats.byClass.size > 0}
						<div class="flex flex-wrap gap-2 mb-4">
							{#each [...inventoryStats.byClass.entries()] as [cls, qty]}
								<div class="px-3 py-1.5 rounded-full bg-crystal text-[12px] font-semibold font-body text-graphite">
									{cls}: {qty}
								</div>
							{/each}
						</div>
					{/if}

					<div class="space-y-2">
						{#each $bankInventory as item (item.id)}
							<div class="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-crystal/30 transition-colors group border border-transparent hover:border-crystal-pale">
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-0.5">
										<span class="text-sm font-semibold font-body text-graphite">
											{eventName(item.sourceEventId)}
										</span>
										<span class="text-[12px] text-slate font-body">{formatDate(item.sourceGameDate)}</span>
										<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded {statusColor(item.status)}">
											{statusLabel(item.status)}
										</span>
									</div>
									<div class="text-[12px] text-slate font-body">
										{item.ticketClass} &middot; S{item.section} R{item.row} Seat {item.seat} &middot; Qty: {item.quantity}
									</div>
									{#if item.notes}
										<div class="text-[11px] text-silver font-body mt-0.5">{item.notes}</div>
									{/if}
									<div class="text-[11px] text-silver font-body">
										Banked by {item.bankedBy} &middot; {new Date(item.bankedAt).toLocaleDateString('en-CA')}
									</div>
								</div>
								{#if item.status === 'available' || item.status === 'partially_used'}
									<button
										onclick={() => handleCancel(item.id)}
										class="px-2.5 py-1.5 rounded-md text-[12px] font-semibold font-body text-declined hover:bg-declined/10 transition-colors opacity-0 group-hover:opacity-100"
										title="Cancel this banked ticket"
									>
										Cancel
									</button>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
