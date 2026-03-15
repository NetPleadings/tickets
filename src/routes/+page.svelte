<script lang="ts">
	import { events, seats } from '$lib/data/schedule';
	import { allocations, allocationsLoaded } from '$lib/stores/allocations';
	import { promotions } from '$lib/data/promotions';
	import { isUpcoming, buildAllocsByEvent, countStatuses, isSoldOut } from '$lib/utils';
	import CalendarView from '$lib/components/CalendarView.svelte';
	import ListView from '$lib/components/ListView.svelte';
	import YearCalendar from '$lib/components/YearCalendar.svelte';
	import BigYearCalendar from '$lib/components/BigYearCalendar.svelte';
	import WallCalendar from '$lib/components/WallCalendar.svelte';
	import CompactListView from '$lib/components/CompactListView.svelte';
	import TextListView from '$lib/components/TextListView.svelte';
	import { onMount } from 'svelte';

	// Restore persisted view state from sessionStorage
	const SS_KEY = 'tickets-view-state';
	function loadViewState() {
		try {
			const raw = sessionStorage.getItem(SS_KEY);
			if (!raw) return;
			const s = JSON.parse(raw);
			if (s.view) view = s.view;
			if (s.bigYearMode) bigYearMode = s.bigYearMode;
			if (s.listMode) listMode = s.listMode;
			if (s.showPast !== undefined) showPast = s.showPast;
			if (s.filter) filter = s.filter;
			if (s.calMonth !== undefined) calMonth = s.calMonth;
			if (s.calYear !== undefined) calYear = s.calYear;
		} catch { /* ignore */ }
	}
	function saveViewState() {
		try {
			sessionStorage.setItem(SS_KEY, JSON.stringify({ view, bigYearMode, listMode, showPast, filter, calMonth, calYear }));
		} catch { /* ignore */ }
	}

	let view = $state<'big-year' | 'year' | 'month' | 'list'>('big-year');
	let bigYearMode = $state<'timeline' | 'wall'>('timeline');
	let listMode = $state<'cards' | 'table' | 'text'>('cards');
	let showPast = $state(false);
	let filter = $state<'all' | 'confirmed' | 'soldout' | 'pending' | 'available' | 'restricted' | 'marquee' | 'promo'>('all');

	// Calendar navigation
	const now = new Date();
	let calMonth = $state(now.getMonth());
	let calYear = $state(now.getFullYear());

	onMount(() => {
		loadViewState();
	});

	// Persist on every change
	$effect(() => {
		// Touch all reactive values to track them
		view; bigYearMode; listMode; showPast; filter; calMonth; calYear;
		saveViewState();
	});

	function prevMonth() {
		if (calMonth === 0) { calMonth = 11; calYear--; }
		else calMonth--;
	}
	function nextMonth() {
		if (calMonth === 11) { calMonth = 0; calYear++; }
		else calMonth++;
	}

	const allocsByEvent = $derived(buildAllocsByEvent($allocations));

	const filteredEvents = $derived(
		events.filter((e) => {
			if (!showPast && !isUpcoming(e.date)) return false;
			if (filter === 'marquee' && !e.isMarquee) return false;
			if (filter === 'promo' && !(promotions[e.date]?.length > 0)) return false;
			if (filter === 'confirmed' || filter === 'soldout' || filter === 'pending' || filter === 'available' || filter === 'restricted') {
				const allocs = allocsByEvent.get(e.id) ?? [];
				const counts = countStatuses(allocs);
				if (filter === 'confirmed') return counts.confirmed > 0;
				if (filter === 'soldout') return isSoldOut(counts, e.totalSeats);
				if (filter === 'pending') return counts.pending > 0;
				if (filter === 'restricted') return counts.restricted > 0;
				if (filter === 'available') return (e.totalSeats - counts.confirmed - counts.pending - counts.restricted) > 0;
			}
			return true;
		})
	);

	const upcoming = $derived(events.filter((e) => isUpcoming(e.date)));
	const upcomingIds = $derived(new Set(upcoming.map((e) => e.id)));
	const totalSeats = $derived(upcoming.length * 4);
	const upcomingAllocs = $derived($allocations.filter((a) => upcomingIds.has(a.eventId)));
	const confirmedCount = $derived(upcomingAllocs.filter((a) => a.status === 'confirmed').length);
	const pendingCount = $derived(upcomingAllocs.filter((a) => a.status === 'pending').length);
	const restrictedCount = $derived(upcomingAllocs.filter((a) => a.status === 'restricted').length);
	const restrictedGames = $derived(new Set(upcomingAllocs.filter((a) => a.status === 'restricted').map((a) => a.eventId)).size);
	const availableCount = $derived(totalSeats - confirmedCount - pendingCount - restrictedCount);

	const nextGame = $derived(upcoming[0]);
	const nextGameAllocs = $derived(nextGame ? $allocations.filter((a) => a.eventId === nextGame.id) : []);
	const nextGameAvailable = $derived(nextGame ? nextGame.totalSeats - nextGameAllocs.length : 0);
</script>

{#if !$allocationsLoaded}
	<div class="flex flex-col items-center justify-center py-20 gap-4">
		<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
		<p class="text-sm text-slate font-body">Loading schedule...</p>
	</div>
{:else}
<div class="space-y-5 animate-in">
	<!-- Hero stats strip -->
	<div class="bg-graphite rounded-xl p-5 text-white relative overflow-hidden">
		<div class="absolute inset-0 opacity-[0.04] text-yellow font-display text-[120px] leading-none font-bold select-none pointer-events-none overflow-hidden">
			<div class="absolute -top-4 -left-4">[ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ]</div>
			<div class="absolute top-20 left-12">[ &nbsp; ] [ &nbsp; ] [ &nbsp; ] [ &nbsp; ]</div>
		</div>

		<div class="relative z-10">
			<div class="flex items-start justify-between mb-4">
				<div>
					<h1 class="font-display font-bold text-xl">2026 Blue Jays Season</h1>
					<p class="text-silver text-sm font-body mt-0.5">Home Plate Terrace Club · Section 226, Row 8</p>
				</div>
				<a href="/seats" class="text-xs font-body font-medium text-yellow hover:text-yellow-bright transition-colors">
					View our seats &rarr;
				</a>
			</div>

			<div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
				<div>
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Remaining Games</div>
					<div class="text-2xl font-display font-bold text-white">{upcoming.length}</div>
				</div>
				<div>
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Seats Available</div>
					<div class="text-2xl font-display font-bold text-yellow">{availableCount}</div>
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
					<div class="text-[10px] uppercase tracking-wider text-silver font-body">Blocked</div>
					<div class="text-2xl font-display font-bold text-white/40">{restrictedGames}<span class="text-sm font-body text-silver ml-1">games</span> <span class="text-base">·</span> {restrictedCount}<span class="text-sm font-body text-silver ml-1">seats</span></div>
				</div>
			</div>

			{#if nextGame}
				<div class="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
					<div class="font-body text-sm">
						<span class="text-silver">Next game:</span>
						<a href="/game/{nextGame.id}" class="text-white font-semibold hover:text-yellow transition-colors ml-1">
							{nextGame.name}
						</a>
						<span class="text-silver ml-1">· {nextGame.date} at {nextGame.time}</span>
					</div>
					{#if nextGameAvailable > 0}
						<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-confirmed/20 text-confirmed">
							{nextGameAvailable} seat{nextGameAvailable > 1 ? 's' : ''} open
						</span>
					{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- View controls -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="flex rounded-lg border border-crystal-pale overflow-hidden shadow-sm">
				{#each [
					{ key: 'big-year', label: 'Big Year', icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25a2.25 2.25 0 01-2.25-2.25v-2.25z' },
					{ key: 'year', label: 'Year', icon: 'M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5' },
					{ key: 'month', label: 'Month', icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5' },
					{ key: 'list', label: 'List', icon: 'M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z' },
				] as v}
					<button
						class="px-3 py-1.5 text-[12px] font-semibold font-body transition-all flex items-center gap-1.5
							{view === v.key ? 'bg-graphite text-white' : 'bg-white text-slate hover:bg-crystal'}"
						onclick={() => (view = v.key as typeof view)}
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d={v.icon} />
						</svg>
						{v.label}
					</button>
				{/each}
			</div>
		</div>

		<label class="flex items-center gap-2 text-[12px] font-body text-slate cursor-pointer select-none">
			<input type="checkbox" bind:checked={showPast} class="rounded border-silver text-graphite focus:ring-yellow" />
			Show past games
		</label>
	</div>

	<!-- Filters -->
	<div class="flex flex-wrap items-center gap-1.5 text-[11px] font-body text-slate px-1">
		{#each [
			{ key: 'confirmed', label: 'Confirmed', dot: 'w-2 h-2 rounded-full bg-confirmed', active: 'bg-confirmed/15 text-confirmed' },
			{ key: 'soldout', label: 'Sold Out', dot: 'w-3 h-2 rounded-sm bg-confirmed', active: 'bg-confirmed/15 text-confirmed' },
			{ key: 'pending', label: 'Pending', dot: 'w-2 h-2 rounded-full bg-pending', active: 'bg-pending/15 text-pending' },
			{ key: 'available', label: 'Available', dot: 'w-2 h-2 rounded-full bg-crystal-pale border border-crystal-pale', active: 'bg-crystal text-graphite' },
			{ key: 'restricted', label: 'Restricted', dot: 'w-2 h-2 rounded-full bg-graphite/40', active: 'bg-graphite/10 text-graphite' },
		] as f}
			<button
				class="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer
					{filter === f.key ? f.active + ' shadow-sm font-semibold' : 'hover:bg-crystal'}"
				onclick={() => { filter = filter === f.key ? 'all' : f.key; }}
			>
				<span class="{f.dot}"></span> {f.label}
				{#if filter === f.key}
					<span class="text-[10px] opacity-60">({filteredEvents.length})</span>
				{/if}
			</button>
		{/each}
		<span class="text-crystal-pale">|</span>
		<button
			class="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer
				{filter === 'marquee' ? 'bg-jays-navy text-white shadow-sm' : 'hover:bg-crystal'}"
			onclick={() => { filter = filter === 'marquee' ? 'all' : 'marquee'; }}
		>
			<span class="inline-block px-1 py-0.5 rounded-sm bg-jays-navy text-white text-[9px] font-bold {filter === 'marquee' ? 'bg-white/20' : ''}">M</span> Marquee
			{#if filter === 'marquee'}
				<span class="text-[10px] font-semibold text-white/70">({filteredEvents.length})</span>
			{/if}
		</button>
		<button
			class="flex items-center gap-1.5 px-2 py-0.5 rounded-full transition-all cursor-pointer
				{filter === 'promo' ? 'bg-yellow text-graphite shadow-sm' : 'hover:bg-crystal'}"
			onclick={() => { filter = filter === 'promo' ? 'all' : 'promo'; }}
		>
			<span class="w-2 h-2 rounded-full {filter === 'promo' ? 'bg-graphite/30' : 'bg-yellow'}"></span> Promo Night
			{#if filter === 'promo'}
				<span class="text-[10px] font-semibold text-graphite/60">({filteredEvents.length})</span>
			{/if}
		</button>
	</div>

	<!-- Views -->
	{#if view === 'big-year'}
		<div class="flex items-center justify-end mb-2">
			<div class="flex rounded-md border border-crystal-pale overflow-hidden shadow-sm text-[11px] font-body font-semibold">
				<button
					class="px-2.5 py-1 transition-all {bigYearMode === 'timeline' ? 'bg-graphite text-white' : 'bg-white text-slate hover:bg-crystal'}"
					onclick={() => (bigYearMode = 'timeline')}
				>Timeline</button>
				<button
					class="px-2.5 py-1 transition-all {bigYearMode === 'wall' ? 'bg-graphite text-white' : 'bg-white text-slate hover:bg-crystal'}"
					onclick={() => (bigYearMode = 'wall')}
				>Wall</button>
			</div>
		</div>
		{#if bigYearMode === 'timeline'}
			<BigYearCalendar events={filteredEvents} allocations={$allocations} year={2026} />
		{:else}
			<WallCalendar events={filteredEvents} allocations={$allocations} year={2026} />
		{/if}
	{:else if view === 'year'}
		<YearCalendar events={filteredEvents} allocations={$allocations} year={calYear} />
	{:else if view === 'month'}
		<CalendarView
			events={filteredEvents}
			allocations={$allocations}
			month={calMonth}
			year={calYear}
			onPrev={prevMonth}
			onNext={nextMonth}
		/>
	{:else}
		<div class="flex items-center justify-end mb-2">
			<div class="flex rounded-md border border-crystal-pale overflow-hidden shadow-sm text-[11px] font-body font-semibold">
				<button
					class="px-2.5 py-1 transition-all {listMode === 'cards' ? 'bg-graphite text-white' : 'bg-white text-slate hover:bg-crystal'}"
					onclick={() => (listMode = 'cards')}
				>Cards</button>
				<button
					class="px-2.5 py-1 transition-all {listMode === 'table' ? 'bg-graphite text-white' : 'bg-white text-slate hover:bg-crystal'}"
					onclick={() => (listMode = 'table')}
				>Table</button>
				<button
					class="px-2.5 py-1 transition-all {listMode === 'text' ? 'bg-graphite text-white' : 'bg-white text-slate hover:bg-crystal'}"
					onclick={() => (listMode = 'text')}
				>Text</button>
			</div>
		</div>
		{#if listMode === 'cards'}
			<ListView events={filteredEvents} allocations={$allocations} />
		{:else if listMode === 'table'}
			<CompactListView events={filteredEvents} allocations={$allocations} />
		{:else}
			<TextListView events={filteredEvents} allocations={$allocations} />
		{/if}
	{/if}
</div>
{/if}
