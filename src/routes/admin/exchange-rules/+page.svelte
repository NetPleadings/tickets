<script lang="ts">
	import { currentUser } from '$lib/stores/user';
	import { exchangeRules, exchangeRulesLoaded, loadExchangeRules, createExchangeRule, updateExchangeRule, toggleExchangeRule } from '$lib/stores/exchange-rules';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { ExchangeRule } from '$lib/types';

	$effect(() => {
		if ($currentUser && $currentUser.role !== 'admin') {
			goto('/');
		}
	});

	// Form state
	let showForm = $state(false);
	let editingId = $state<string | null>(null);
	let saving = $state(false);

	let formName = $state('');
	let formFromClass = $state('');
	let formFromQty = $state(1);
	let formToClass = $state('');
	let formToQty = $state(1);
	let formNotes = $state('');

	// Common ticket classes for quick selection
	const ticketClasses = ['Home Plate Terrace Club', 'Lower Bowl', 'Upper Deck', 'Premium', 'Standard'];

	onMount(() => {
		if (!$exchangeRulesLoaded) loadExchangeRules();
	});

	function resetForm() {
		formName = '';
		formFromClass = '';
		formFromQty = 1;
		formToClass = '';
		formToQty = 1;
		formNotes = '';
		editingId = null;
		showForm = false;
	}

	function startEdit(rule: ExchangeRule) {
		editingId = rule.id;
		formName = rule.name;
		formFromClass = rule.fromTicketClass;
		formFromQty = rule.fromQuantity;
		formToClass = rule.toTicketClass;
		formToQty = rule.toQuantity;
		formNotes = rule.notes || '';
		showForm = true;
	}

	async function handleSubmit() {
		if (!formName.trim() || !formFromClass.trim() || !formToClass.trim()) return;
		saving = true;

		if (editingId) {
			await updateExchangeRule(editingId, {
				name: formName.trim(),
				fromTicketClass: formFromClass.trim(),
				fromQuantity: formFromQty,
				toTicketClass: formToClass.trim(),
				toQuantity: formToQty,
				notes: formNotes.trim() || undefined,
			});
		} else {
			const now = new Date().toISOString();
			const rule: ExchangeRule = {
				id: `rule-${Date.now()}`,
				name: formName.trim(),
				fromTicketClass: formFromClass.trim(),
				fromQuantity: formFromQty,
				toTicketClass: formToClass.trim(),
				toQuantity: formToQty,
				active: true,
				notes: formNotes.trim() || undefined,
				createdBy: $currentUser?.email || '',
				createdAt: now,
				updatedAt: now,
			};
			await createExchangeRule(rule);
		}

		saving = false;
		resetForm();
	}

	async function handleToggle(rule: ExchangeRule) {
		await toggleExchangeRule(rule.id, !rule.active);
	}

	const activeRules = $derived($exchangeRules.filter((r) => r.active));
	const inactiveRules = $derived($exchangeRules.filter((r) => !r.active));
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
				<div class="flex items-center gap-3 mb-1">
					<a href="/admin" class="text-slate hover:text-graphite transition-colors">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
						</svg>
					</a>
					<h1 class="font-display font-bold text-2xl text-graphite">Exchange Rules</h1>
				</div>
				<p class="text-sm text-slate font-body ml-8">Define how banked tickets can be exchanged into different seat classes and quantities.</p>
			</div>
			{#if !showForm}
				<button
					onclick={() => { resetForm(); showForm = true; }}
					class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors"
				>
					New Rule
				</button>
			{/if}
		</div>

		<!-- Create/Edit Form -->
		{#if showForm}
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
				<h2 class="font-display font-semibold text-lg text-graphite mb-4">
					{editingId ? 'Edit Rule' : 'New Exchange Rule'}
				</h2>

				<div class="space-y-4">
					<!-- Rule Name -->
					<div>
						<label class="block text-[13px] font-semibold font-body text-graphite mb-1">Rule Name</label>
						<input
							type="text"
							bind:value={formName}
							placeholder="e.g. 1 Lower Bowl → 1 Lower Bowl"
							class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
						/>
					</div>

					<!-- Source -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-[13px] font-semibold font-body text-graphite mb-1">Source Ticket Class</label>
							<input
								type="text"
								bind:value={formFromClass}
								placeholder="e.g. Home Plate Terrace Club"
								list="from-classes"
								class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
							/>
							<datalist id="from-classes">
								{#each ticketClasses as tc}
									<option value={tc} />
								{/each}
							</datalist>
						</div>
						<div>
							<label class="block text-[13px] font-semibold font-body text-graphite mb-1">Source Quantity</label>
							<input
								type="number"
								bind:value={formFromQty}
								min="1"
								class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite focus:outline-none focus:ring-2 focus:ring-yellow/50"
							/>
						</div>
					</div>

					<!-- Arrow indicator -->
					<div class="flex items-center justify-center text-slate">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
						</svg>
						<span class="text-[12px] font-body ml-1">exchanges into</span>
					</div>

					<!-- Target -->
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<label class="block text-[13px] font-semibold font-body text-graphite mb-1">Target Ticket Class</label>
							<input
								type="text"
								bind:value={formToClass}
								placeholder="e.g. Upper Deck"
								list="to-classes"
								class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
							/>
							<datalist id="to-classes">
								{#each ticketClasses as tc}
									<option value={tc} />
								{/each}
							</datalist>
						</div>
						<div>
							<label class="block text-[13px] font-semibold font-body text-graphite mb-1">Target Quantity</label>
							<input
								type="number"
								bind:value={formToQty}
								min="1"
								class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite focus:outline-none focus:ring-2 focus:ring-yellow/50"
							/>
						</div>
					</div>

					<!-- Notes -->
					<div>
						<label class="block text-[13px] font-semibold font-body text-graphite mb-1">Notes (optional)</label>
						<textarea
							bind:value={formNotes}
							rows="2"
							placeholder="Any additional context..."
							class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50 resize-none"
						></textarea>
					</div>

					<!-- Preview -->
					{#if formFromClass && formToClass}
						<div class="bg-crystal/30 rounded-lg px-4 py-3 text-sm font-body">
							<span class="text-slate">Preview:</span>
							<span class="font-semibold text-graphite ml-1">{formFromQty} {formFromClass}</span>
							<span class="text-slate mx-1">&rarr;</span>
							<span class="font-semibold text-graphite">{formToQty} {formToClass}</span>
						</div>
					{/if}

					<!-- Actions -->
					<div class="flex items-center gap-2 pt-2">
						<button
							onclick={handleSubmit}
							disabled={saving || !formName.trim() || !formFromClass.trim() || !formToClass.trim()}
							class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors disabled:opacity-50"
						>
							{saving ? 'Saving...' : editingId ? 'Update Rule' : 'Create Rule'}
						</button>
						<button
							onclick={resetForm}
							class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body text-slate hover:text-graphite hover:bg-crystal/50 transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Active Rules -->
		<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
			<h2 class="font-display font-semibold text-lg text-graphite mb-1">Active Rules</h2>
			<p class="text-sm text-slate font-body mb-4">These rules are available for use when exchanging banked tickets.</p>

			{#if !$exchangeRulesLoaded}
				<div class="flex items-center gap-2 text-sm text-slate">
					<div class="w-4 h-4 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
					Loading...
				</div>
			{:else if activeRules.length === 0}
				<p class="text-sm text-silver font-body py-4">No active exchange rules. Create one above.</p>
			{:else}
				<div class="space-y-2">
					{#each activeRules as rule (rule.id)}
						<div class="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-crystal/30 transition-colors group border border-transparent hover:border-crystal-pale">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-0.5">
									<span class="text-sm font-semibold font-body text-graphite">{rule.name}</span>
									<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-confirmed/10 text-confirmed">Active</span>
								</div>
								<div class="text-[13px] font-body text-slate">
									<span class="font-medium">{rule.fromQuantity} {rule.fromTicketClass}</span>
									<span class="mx-1">&rarr;</span>
									<span class="font-medium">{rule.toQuantity} {rule.toTicketClass}</span>
								</div>
								{#if rule.notes}
									<p class="text-[12px] text-silver font-body mt-0.5">{rule.notes}</p>
								{/if}
							</div>
							<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									onclick={() => startEdit(rule)}
									class="px-2.5 py-1.5 rounded-md text-[12px] font-semibold font-body text-slate hover:text-graphite hover:bg-crystal transition-colors"
								>
									Edit
								</button>
								<button
									onclick={() => handleToggle(rule)}
									class="px-2.5 py-1.5 rounded-md text-[12px] font-semibold font-body text-pending hover:bg-pending/10 transition-colors"
								>
									Disable
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Inactive Rules -->
		{#if inactiveRules.length > 0}
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
				<h2 class="font-display font-semibold text-lg text-graphite mb-1">Disabled Rules</h2>
				<p class="text-sm text-slate font-body mb-4">These rules are preserved for history but cannot be used for new exchanges.</p>

				<div class="space-y-2">
					{#each inactiveRules as rule (rule.id)}
						<div class="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-crystal/30 transition-colors group opacity-60 hover:opacity-100">
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-0.5">
									<span class="text-sm font-semibold font-body text-graphite">{rule.name}</span>
									<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-silver/20 text-silver">Disabled</span>
								</div>
								<div class="text-[13px] font-body text-slate">
									<span class="font-medium">{rule.fromQuantity} {rule.fromTicketClass}</span>
									<span class="mx-1">&rarr;</span>
									<span class="font-medium">{rule.toQuantity} {rule.toTicketClass}</span>
								</div>
							</div>
							<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
								<button
									onclick={() => startEdit(rule)}
									class="px-2.5 py-1.5 rounded-md text-[12px] font-semibold font-body text-slate hover:text-graphite hover:bg-crystal transition-colors"
								>
									Edit
								</button>
								<button
									onclick={() => handleToggle(rule)}
									class="px-2.5 py-1.5 rounded-md text-[12px] font-semibold font-body text-confirmed hover:bg-confirmed/10 transition-colors"
								>
									Enable
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{/if}
