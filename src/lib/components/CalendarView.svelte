<script lang="ts">
	import type { Event, Allocation } from '$lib/types';
	import { getMonthDays, getDayOfMonth, isToday, isUpcoming, formatMonthYear, buildEventsByDate, buildAllocsByEvent, countStatuses, seatDotColor, isSoldOut } from '$lib/utils';
	import { teamAbbrevs } from '$lib/data/schedule';

	interface Props {
		events: Event[];
		allocations: Allocation[];
		month: number;
		year: number;
		onPrev: () => void;
		onNext: () => void;
	}

	let { events, allocations, month, year, onPrev, onNext }: Props = $props();

	const days = $derived(getMonthDays(year, month));
	const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	const eventsByDate = $derived(buildEventsByDate(events));
	const allocsByEvent = $derived(buildAllocsByEvent(allocations));
</script>

<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
	<div class="flex items-center justify-between px-5 py-3 border-b border-crystal-pale bg-crystal/50">
		<button onclick={onPrev} aria-label="Previous month" class="p-1.5 rounded-lg hover:bg-crystal-pale transition-colors text-slate hover:text-graphite">
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
			</svg>
		</button>
		<h2 class="font-display font-semibold text-graphite text-lg">
			{formatMonthYear(`${year}-${String(month + 1).padStart(2, '0')}-01`)}
		</h2>
		<button onclick={onNext} aria-label="Next month" class="p-1.5 rounded-lg hover:bg-crystal-pale transition-colors text-slate hover:text-graphite">
			<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
			</svg>
		</button>
	</div>

	<div class="grid grid-cols-7 border-b border-crystal-pale">
		{#each weekdays as day}
			<div class="px-2 py-2 text-center text-[11px] font-semibold text-slate uppercase tracking-wider font-body">
				{day}
			</div>
		{/each}
	</div>

	<div class="grid grid-cols-7">
		{#each days as day, i}
			{@const event = eventsByDate.get(day.date)}
			{@const dayEvents = event ? [event] : []}
			{@const today = isToday(day.date)}
			{@const past = !isUpcoming(day.date)}
			<div
				class="min-h-[90px] border-b border-r border-crystal-pale/60 p-1.5 transition-colors
					{!day.inMonth ? 'bg-crystal/30' : ''}
					{today ? 'bg-yellow/5 ring-1 ring-inset ring-yellow/30' : ''}
					{past && day.inMonth ? 'bg-crystal/20' : ''}"
			>
				<div class="text-[11px] font-body mb-0.5 {!day.inMonth ? 'text-silver' : today ? 'text-yellow font-bold' : 'text-slate'}">
					{getDayOfMonth(day.date)}
				</div>

				{#each dayEvents as ev}
					{@const allocs = allocsByEvent.get(ev.id) ?? []}
					{@const counts = countStatuses(allocs)}
					{@const soldOut = isSoldOut(counts, ev.totalSeats)}
					<a
						href="/game/{ev.id}"
						class="block rounded-md px-1.5 py-1 mb-0.5 text-[11px] leading-tight transition-all hover:scale-[1.02] hover:shadow-sm
							{ev.isMarquee
								? 'bg-jays-navy text-white hover:bg-jays-blue'
								: soldOut
									? 'bg-confirmed/20 text-confirmed hover:bg-confirmed/30'
									: 'bg-jays-light text-jays-navy hover:bg-jays-blue/20'}
							{past ? 'opacity-50' : ''}"
					>
						<div class="font-semibold truncate">
							vs {teamAbbrevs[ev.opponent ?? ''] ?? ev.opponent}
						</div>
						<div class="flex items-center justify-between mt-0.5">
							<span class="opacity-70">{ev.time}</span>
							<div class="flex gap-px">
								{#each Array(ev.totalSeats) as _, si}
									<div class="w-1.5 h-1.5 rounded-full {seatDotColor(si, counts, 'bg-silver/40')}"></div>
								{/each}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/each}
	</div>
</div>
