<script lang="ts">
	import type { Event, Allocation } from '$lib/types';
	import { teamAbbrevs } from '$lib/data/schedule';
	import { promotions } from '$lib/data/promotions';
	import { isUpcoming } from '$lib/utils';

	interface Props {
		events: Event[];
		allocations: Allocation[];
		year: number;
	}

	let { events, allocations, year }: Props = $props();

	const months = $derived(
		Array.from({ length: 12 }, (_, i) => {
			const firstDay = new Date(year, i, 1);
			const lastDay = new Date(year, i + 1, 0);
			const startPad = firstDay.getDay(); // 0=Sun
			const daysInMonth = lastDay.getDate();
			const monthName = firstDay.toLocaleDateString('en-CA', { month: 'short' }).toUpperCase();
			const monthFull = firstDay.toLocaleDateString('en-CA', { month: 'long' });

			const days: { date: number; dateStr: string; inMonth: boolean }[] = [];

			// Pad start
			for (let d = 0; d < startPad; d++) {
				days.push({ date: 0, dateStr: '', inMonth: false });
			}

			for (let d = 1; d <= daysInMonth; d++) {
				const dateStr = `${year}-${String(i + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
				days.push({ date: d, dateStr, inMonth: true });
			}

			// Pad to fill 6 rows (42 cells) for consistent height
			while (days.length < 42) {
				days.push({ date: 0, dateStr: '', inMonth: false });
			}

			return { index: i, name: monthName, fullName: monthFull, days, daysInMonth };
		})
	);

	function eventsOnDate(dateStr: string) {
		return events.filter((e) => e.date === dateStr);
	}

	function allocsForEvent(eventId: string) {
		return allocations.filter((a) => a.eventId === eventId);
	}

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

	const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
</script>

<div class="grid grid-cols-3 lg:grid-cols-4 gap-3">
	{#each months as month (month.index)}
		<div class="bg-white rounded-lg border border-crystal-pale shadow-sm overflow-hidden">
			<!-- Month header -->
			<div class="px-2.5 py-1.5 border-b border-crystal-pale/60 bg-crystal/30">
				<span class="font-display font-semibold text-[11px] text-graphite tracking-wider">{month.fullName}</span>
			</div>

			<!-- Weekday headers -->
			<div class="grid grid-cols-7 px-1 pt-1">
				{#each weekdays as wd}
					<div class="text-center text-[8px] font-body font-semibold text-silver uppercase">{wd}</div>
				{/each}
			</div>

			<!-- Days grid -->
			<div class="grid grid-cols-7 px-1 pb-1.5 gap-px">
				{#each month.days as day}
					{@const dayEvents = day.inMonth ? eventsOnDate(day.dateStr) : []}
					{@const hasGame = dayEvents.length > 0}
					{@const isToday = day.dateStr === todayStr}
					{@const event = dayEvents[0]}
					{@const allocs = event ? allocsForEvent(event.id) : []}
					{@const confirmed = allocs.filter((a) => a.status === 'confirmed').length}
					{@const restrictedCount = allocs.filter((a) => a.status === 'restricted').length}
					{@const seatsFull = event ? confirmed >= event.totalSeats : false}
					{@const allRestricted = event ? restrictedCount >= event.totalSeats : false}
					{@const past = day.inMonth && !isUpcoming(day.dateStr)}
					{@const promos = day.dateStr ? (promotions[day.dateStr] ?? []) : []}

					{#if hasGame}
						<a
							href="/game/{event.id}"
							class="relative aspect-square flex flex-col items-center justify-center rounded-[3px] transition-all text-[9px] leading-none
								{event.isMarquee
									? 'bg-jays-navy text-white hover:bg-jays-blue'
									: allRestricted
										? 'bg-graphite/10 text-graphite/50 hover:bg-graphite/15'
										: seatsFull
											? 'bg-confirmed/15 text-confirmed hover:bg-confirmed/25'
											: 'bg-jays-light text-jays-navy hover:bg-jays-blue/20'}
								{past ? 'opacity-40' : ''}
								{isToday ? 'ring-1 ring-yellow' : ''}"
							title="vs {event.opponent} · {event.time}{confirmed > 0 ? ` · ${confirmed}/4 seats` : ''}{promos.length > 0 ? ` · ${promos.map(p => p.name).join(', ')}` : ''}"
						>
							<span class="font-display font-bold text-[10px]">{day.date}</span>
							<span class="text-[7px] font-body font-semibold truncate max-w-full px-0.5 opacity-80">
								{teamAbbrevs[event.opponent ?? ''] ?? ''}
							</span>
							<div class="absolute bottom-0.5 flex gap-px items-center">
								{#if promos.length > 0}
									<div class="w-1.5 h-1.5 rounded-full bg-yellow mr-0.5" title="Promo"></div>
								{/if}
								{#if confirmed > 0}
									{#each Array(event.totalSeats) as _, si}
										<div class="w-1 h-1 rounded-full {si < confirmed ? 'bg-current opacity-60' : 'bg-current opacity-20'}"></div>
									{/each}
								{/if}
							</div>
						</a>
					{:else if day.inMonth}
						<div
							class="aspect-square flex items-center justify-center rounded-[3px] text-[9px] font-body
								{isToday ? 'ring-1 ring-yellow bg-yellow/10 font-bold text-graphite' : 'text-silver'}"
						>
							{day.date}
						</div>
					{:else}
						<div class="aspect-square"></div>
					{/if}
				{/each}
			</div>
		</div>
	{/each}
</div>
