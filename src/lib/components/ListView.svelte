<script lang="ts">
	import type { Event, Allocation } from '$lib/types';
	import { formatDate, isUpcoming, buildAllocsByEvent, countStatuses, seatDotColor, isSoldOut } from '$lib/utils';
	import { teamAbbrevs } from '$lib/data/schedule';
	import { promotions, promoColor } from '$lib/data/promotions';

	interface Props {
		events: Event[];
		allocations: Allocation[];
		pendingSeatsMap?: Map<string, number>;
	}

	let { events, allocations, pendingSeatsMap = new Map() }: Props = $props();

	const allocsByEvent = $derived(buildAllocsByEvent(allocations));

	// Group events by month
	const grouped = $derived.by(() => {
		const groups = new Map<string, Event[]>();
		for (const e of events) {
			const key = e.date.substring(0, 7);
			if (!groups.has(key)) groups.set(key, []);
			groups.get(key)!.push(e);
		}
		return groups;
	});

	function monthLabel(key: string) {
		const d = new Date(key + '-01T12:00:00');
		return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' });
	}
</script>

<div class="space-y-6">
	{#each [...grouped.entries()] as [monthKey, monthEvents] (monthKey)}
		<div>
			<h3 class="font-display font-semibold text-graphite text-sm mb-2 px-1">{monthLabel(monthKey)}</h3>
			<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden divide-y divide-crystal-pale/60">
				{#each monthEvents as event (event.id)}
					{@const allocs = allocsByEvent.get(event.id) ?? []}
					{@const counts = countStatuses(allocs)}
					{@const rawAvailable = event.totalSeats - counts.confirmed - counts.pending - counts.restricted}
					{@const available = Math.max(0, rawAvailable - (pendingSeatsMap.get(event.id) ?? 0))}
					{@const soldOut = isSoldOut(counts, event.totalSeats)}
					{@const past = !isUpcoming(event.date)}
					{@const promos = promotions[event.date] ?? []}
					<a
						href="/game/{event.id}"
						class="flex items-center gap-4 px-4 py-3 hover:bg-crystal/50 transition-colors group {past ? 'opacity-50' : ''}"
					>
						<div class="w-12 text-center shrink-0">
							<div class="text-[10px] uppercase tracking-wider text-slate font-body">
								{new Date(event.date + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short' })}
							</div>
							<div class="text-xl font-display font-bold text-graphite leading-tight">
								{new Date(event.date + 'T12:00:00').getDate()}
							</div>
						</div>

						<div class="w-px h-8 bg-crystal-pale"></div>

						<div class="flex-1 min-w-0">
							<div class="flex items-center gap-2">
								<span class="font-display font-semibold text-graphite text-sm group-hover:text-jays-blue transition-colors">
									vs {event.opponent}
								</span>
								{#if event.isMarquee}
									<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-jays-navy text-white">Marquee</span>
								{/if}
							</div>
							<div class="text-xs text-slate font-body">
								{event.time} · {event.venue}
								{#if promos.length > 0}
									<span class="ml-1.5">
										{#each promos.slice(0, 2) as promo}
											<span class="text-[9px] font-semibold px-1.5 py-0.5 rounded-full {promoColor(promo.type)} ml-0.5">{promo.name}</span>
										{/each}
										{#if promos.length > 2}
											<span class="text-[9px] text-silver ml-0.5">+{promos.length - 2}</span>
										{/if}
									</span>
								{/if}
							</div>
						</div>

						<div class="flex items-center gap-3 shrink-0">
							<div class="flex gap-1">
								{#each Array(event.totalSeats) as _, si}
									<div class="w-2.5 h-2.5 rounded-full {seatDotColor(si, counts)} transition-transform group-hover:scale-110"></div>
								{/each}
							</div>
							{#if counts.restricted > 0 && counts.restricted >= event.totalSeats}
								<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-graphite/10 text-graphite">Restricted</span>
							{:else if counts.restricted > 0 && soldOut}
								<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-graphite/10 text-graphite">Restricted</span>
							{:else if soldOut}
								<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-declined/15 text-declined">Sold Out</span>
							{:else if counts.restricted > 0 && !past}
								<span class="text-[10px] font-semibold text-confirmed font-body">{available} open</span>
								<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-graphite/10 text-graphite">Restricted</span>
							{:else if available > 0 && !past}
								<span class="text-[10px] font-semibold text-confirmed font-body">{available} open</span>
							{/if}
						</div>

						<svg class="w-4 h-4 text-silver group-hover:text-slate transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
						</svg>
					</a>
				{/each}
			</div>
		</div>
	{/each}
</div>
