<script lang="ts">
	import { currentUser } from '$lib/stores/user';
	import { bankInventory, bankInventoryLoaded, loadBankInventory } from '$lib/stores/banking';
	import { exchangeRules, exchangeRulesLoaded, loadExchangeRules } from '$lib/stores/exchange-rules';
	import { exchangeTransactions, exchangeTransactionsLoaded, loadExchangeTransactions, executeExchange } from '$lib/stores/exchanges';
	import { events } from '$lib/data/schedule';
	import { formatDate, isUpcoming } from '$lib/utils';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ExchangeRule, BankInventoryItem } from '$lib/types';

	$effect(() => {
		if ($currentUser && $currentUser.role !== 'admin') {
			goto('/');
		}
	});

	onMount(() => {
		if (!$bankInventoryLoaded) loadBankInventory();
		if (!$exchangeRulesLoaded) loadExchangeRules();
		if (!$exchangeTransactionsLoaded) loadExchangeTransactions();
	});

	// View
	let viewMode = $state<'exchange' | 'history'>('exchange');

	// Exchange form state
	let selectedRuleId = $state('');
	let selectedTargetEventId = $state('');
	let selectedBankItemIds = $state<string[]>([]);
	let exchangeNotes = $state('');
	let executing = $state(false);
	let exchangeError = $state('');
	let exchangeSuccess = $state('');

	// Active rules only
	const activeRules = $derived($exchangeRules.filter((r) => r.active));

	const selectedRule = $derived(activeRules.find((r) => r.id === selectedRuleId));

	// Available inventory matching the selected rule's source class
	const matchingInventory = $derived.by(() => {
		if (!selectedRule) return [];
		return $bankInventory.filter(
			(i) => (i.status === 'available' || i.status === 'partially_used') && i.ticketClass === selectedRule.fromTicketClass
		);
	});

	const totalSelectedQty = $derived(
		selectedBankItemIds.reduce((sum, id) => {
			const item = matchingInventory.find((i) => i.id === id);
			return sum + (item?.quantity || 0);
		}, 0)
	);

	const hasEnough = $derived(selectedRule ? totalSelectedQty >= selectedRule.fromQuantity : false);

	// Upcoming events for the target
	const upcomingEvents = $derived(
		events.filter((e) => e.category === 'blue-jays' && isUpcoming(e.date))
	);

	function selectRule(ruleId: string) {
		selectedRuleId = ruleId;
		selectedBankItemIds = [];
		exchangeError = '';
		exchangeSuccess = '';
	}

	function toggleBankItem(itemId: string) {
		if (selectedBankItemIds.includes(itemId)) {
			selectedBankItemIds = selectedBankItemIds.filter((id) => id !== itemId);
		} else {
			selectedBankItemIds = [...selectedBankItemIds, itemId];
		}
	}

	function autoSelectInventory() {
		if (!selectedRule) return;
		const needed = selectedRule.fromQuantity;
		let accumulated = 0;
		const ids: string[] = [];

		for (const item of matchingInventory) {
			if (accumulated >= needed) break;
			ids.push(item.id);
			accumulated += item.quantity;
		}

		selectedBankItemIds = ids;
	}

	async function handleExchange() {
		if (!selectedRule || !selectedTargetEventId || !hasEnough) return;
		executing = true;
		exchangeError = '';
		exchangeSuccess = '';

		const targetEvent = upcomingEvents.find((e) => e.id === selectedTargetEventId);

		const result = await executeExchange({
			ruleId: selectedRule.id,
			targetEventId: selectedTargetEventId,
			targetGameDate: targetEvent?.date || '',
			bankItemIds: selectedBankItemIds,
			notes: exchangeNotes.trim() || undefined,
		});

		if (result.ok) {
			exchangeSuccess = `Exchange completed! ${selectedRule.fromQuantity} ${selectedRule.fromTicketClass} exchanged for ${selectedRule.toQuantity} ${selectedRule.toTicketClass}.`;
			selectedRuleId = '';
			selectedTargetEventId = '';
			selectedBankItemIds = [];
			exchangeNotes = '';
			// Refresh inventory
			await loadBankInventory();
		} else {
			exchangeError = result.error || 'Exchange failed';
		}

		executing = false;
	}

	function eventName(eventId: string): string {
		const e = events.find((ev) => ev.id === eventId);
		return e ? `vs ${e.opponent}` : eventId;
	}

	function statusColor(status: string): string {
		switch (status) {
			case 'completed': return 'bg-confirmed/10 text-confirmed';
			case 'cancelled': return 'bg-declined/10 text-declined';
			default: return 'bg-silver/20 text-silver';
		}
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
				<h1 class="font-display font-bold text-2xl text-graphite">Ticket Exchanges</h1>
				<p class="text-sm text-slate font-body mt-1">Exchange banked tickets into different games using configured exchange rules.</p>
			</div>
			<div class="flex items-center gap-1 bg-crystal rounded-lg p-0.5">
				<button
					onclick={() => (viewMode = 'exchange')}
					class="px-3 py-1.5 rounded-md text-[13px] font-semibold font-body transition-all {
						viewMode === 'exchange' ? 'bg-white text-graphite shadow-sm' : 'text-slate hover:text-graphite'
					}"
				>
					New Exchange
				</button>
				<button
					onclick={() => (viewMode = 'history')}
					class="px-3 py-1.5 rounded-md text-[13px] font-semibold font-body transition-all {
						viewMode === 'history' ? 'bg-white text-graphite shadow-sm' : 'text-slate hover:text-graphite'
					}"
				>
					History
				</button>
			</div>
		</div>

		{#if viewMode === 'exchange'}
			<!-- Success/Error messages -->
			{#if exchangeSuccess}
				<div class="bg-confirmed/10 border border-confirmed/20 rounded-lg px-4 py-3 text-sm font-body text-confirmed">
					{exchangeSuccess}
				</div>
			{/if}
			{#if exchangeError}
				<div class="bg-declined/10 border border-declined/20 rounded-lg px-4 py-3 text-sm font-body text-declined">
					{exchangeError}
				</div>
			{/if}

			<!-- Step 1: Select Rule -->
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
				<h2 class="font-display font-semibold text-lg text-graphite mb-1">1. Choose Exchange Rule</h2>
				<p class="text-sm text-slate font-body mb-4">Select the exchange ratio to apply.</p>

				{#if activeRules.length === 0}
					<div class="text-center py-6">
						<p class="text-sm text-silver font-body mb-3">No active exchange rules configured.</p>
						<a
							href="/admin/exchange-rules"
							class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors inline-block"
						>
							Configure Rules
						</a>
					</div>
				{:else}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
						{#each activeRules as rule (rule.id)}
							<button
								onclick={() => selectRule(rule.id)}
								class="text-left px-4 py-3 rounded-lg border transition-all {
									selectedRuleId === rule.id
										? 'border-jays-blue bg-jays-light/50'
										: 'border-crystal-pale hover:border-crystal-pale hover:bg-crystal/30'
								}"
							>
								<div class="text-[13px] font-semibold font-body text-graphite">{rule.name}</div>
								<div class="text-[12px] text-slate font-body mt-0.5">
									{rule.fromQuantity} {rule.fromTicketClass} &rarr; {rule.toQuantity} {rule.toTicketClass}
								</div>
								{#if rule.notes}
									<div class="text-[11px] text-silver font-body mt-0.5">{rule.notes}</div>
								{/if}
							</button>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Step 2: Select inventory (shown when rule selected) -->
			{#if selectedRule}
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
					<div class="flex items-center justify-between mb-1">
						<h2 class="font-display font-semibold text-lg text-graphite">2. Select Banked Tickets to Consume</h2>
						{#if matchingInventory.length > 0}
							<button
								onclick={autoSelectInventory}
								class="text-[12px] font-semibold font-body text-jays-blue hover:underline"
							>
								Auto-select
							</button>
						{/if}
					</div>
					<p class="text-sm text-slate font-body mb-4">
						Need {selectedRule.fromQuantity} &times; {selectedRule.fromTicketClass}.
						{#if totalSelectedQty > 0}
							<span class="font-semibold {hasEnough ? 'text-confirmed' : 'text-pending'}">
								Selected: {totalSelectedQty}
							</span>
						{/if}
					</p>

					{#if matchingInventory.length === 0}
						<div class="text-center py-6">
							<p class="text-sm text-silver font-body mb-3">No banked {selectedRule.fromTicketClass} tickets available.</p>
							<a
								href="/banking"
								class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors inline-block"
							>
								Bank Tickets
							</a>
						</div>
					{:else}
						<div class="space-y-2">
							{#each matchingInventory as item (item.id)}
								<button
									onclick={() => toggleBankItem(item.id)}
									class="w-full text-left flex items-center justify-between py-2.5 px-4 rounded-lg border transition-all {
										selectedBankItemIds.includes(item.id)
											? 'border-jays-blue bg-jays-light/50'
											: 'border-crystal-pale hover:bg-crystal/30'
									}"
								>
									<div>
										<div class="text-[13px] font-semibold font-body text-graphite">
											{eventName(item.sourceEventId)} &middot; {formatDate(item.sourceGameDate)}
										</div>
										<div class="text-[12px] text-slate font-body">
											S{item.section} R{item.row} Seat {item.seat} &middot; Qty: {item.quantity}
										</div>
									</div>
									<div class="w-5 h-5 rounded-md border-2 flex items-center justify-center {
										selectedBankItemIds.includes(item.id)
											? 'border-jays-blue bg-jays-blue'
											: 'border-crystal-pale'
									}">
										{#if selectedBankItemIds.includes(item.id)}
											<svg class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
												<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
											</svg>
										{/if}
									</div>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Step 3: Target Game -->
				{#if hasEnough}
					<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
						<h2 class="font-display font-semibold text-lg text-graphite mb-1">3. Select Target Game</h2>
						<p class="text-sm text-slate font-body mb-4">
							Which game should receive {selectedRule.toQuantity} {selectedRule.toTicketClass} ticket{selectedRule.toQuantity !== 1 ? 's' : ''}?
						</p>

						<select
							bind:value={selectedTargetEventId}
							class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite focus:outline-none focus:ring-2 focus:ring-yellow/50"
						>
							<option value="">Select a game...</option>
							{#each upcomingEvents as event (event.id)}
								<option value={event.id}>
									vs {event.opponent} — {formatDate(event.date)} {event.time}
								</option>
							{/each}
						</select>
					</div>
				{/if}

				<!-- Step 4: Notes + Execute -->
				{#if hasEnough && selectedTargetEventId}
					<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
						<h2 class="font-display font-semibold text-lg text-graphite mb-1">4. Execute Exchange</h2>

						<div class="mb-4">
							<label class="block text-[13px] font-semibold font-body text-graphite mb-1">Notes (optional)</label>
							<input
								type="text"
								bind:value={exchangeNotes}
								placeholder="Any context for this exchange..."
								class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
							/>
						</div>

						<!-- Summary -->
						<div class="bg-crystal/30 rounded-lg px-4 py-3 mb-4 text-sm font-body space-y-1">
							<div>
								<span class="text-slate">Consuming:</span>
								<span class="font-semibold text-graphite ml-1">{selectedRule.fromQuantity} {selectedRule.fromTicketClass}</span>
								<span class="text-slate ml-1">from {selectedBankItemIds.length} banked lot{selectedBankItemIds.length !== 1 ? 's' : ''}</span>
							</div>
							<div>
								<span class="text-slate">Receiving:</span>
								<span class="font-semibold text-graphite ml-1">{selectedRule.toQuantity} {selectedRule.toTicketClass}</span>
								<span class="text-slate ml-1">for {eventName(selectedTargetEventId)}</span>
							</div>
							<div>
								<span class="text-slate">Rule:</span>
								<span class="font-semibold text-graphite ml-1">{selectedRule.name}</span>
							</div>
						</div>

						<button
							onclick={handleExchange}
							disabled={executing}
							class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors disabled:opacity-50"
						>
							{executing ? 'Executing...' : 'Execute Exchange'}
						</button>
					</div>
				{/if}
			{/if}

		{:else}
			<!-- Transaction History -->
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
				<h2 class="font-display font-semibold text-lg text-graphite mb-1">Exchange History</h2>
				<p class="text-sm text-slate font-body mb-4">All past exchange transactions.</p>

				{#if !$exchangeTransactionsLoaded}
					<div class="flex items-center gap-2 text-sm text-slate">
						<div class="w-4 h-4 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
						Loading...
					</div>
				{:else if $exchangeTransactions.length === 0}
					<p class="text-sm text-silver font-body py-4">No exchanges have been executed yet.</p>
				{:else}
					<div class="space-y-3">
						{#each $exchangeTransactions as tx (tx.id)}
							<div class="py-3 px-4 rounded-lg border border-crystal-pale hover:bg-crystal/30 transition-colors">
								<div class="flex items-center justify-between mb-1">
									<div class="flex items-center gap-2">
										<span class="text-sm font-semibold font-body text-graphite">{tx.ruleName}</span>
										<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded {statusColor(tx.status)}">
											{tx.status}
										</span>
									</div>
									<span class="text-[12px] text-silver font-body">{new Date(tx.createdAt).toLocaleDateString('en-CA')}</span>
								</div>
								<div class="text-[13px] font-body text-slate">
									<span class="font-medium">{tx.fromQuantity} {tx.fromTicketClass}</span>
									<span class="mx-1">&rarr;</span>
									<span class="font-medium">{tx.toQuantity} {tx.toTicketClass}</span>
								</div>
								<div class="text-[12px] text-slate font-body mt-0.5">
									Target: {eventName(tx.targetEventId)} ({formatDate(tx.targetGameDate)})
								</div>
								<div class="text-[11px] text-silver font-body mt-0.5">
									By {tx.performedBy}
									{#if tx.notes}
										&middot; {tx.notes}
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}
