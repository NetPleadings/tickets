<script lang="ts">
	import type { Event, Allocation } from '$lib/types';
	import { isUpcoming, buildAllocsByEvent, countStatuses, seatDotColor, isSoldOut } from '$lib/utils';
	import { promotions } from '$lib/data/promotions';

	interface Props {
		events: Event[];
		allocations: Allocation[];
		pendingSeatsMap?: Map<string, number>;
	}

	let { events, allocations, pendingSeatsMap = new Map() }: Props = $props();

	const allocsByEvent = $derived(buildAllocsByEvent(allocations));

	const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
</script>

<div class="bg-white rounded-xl border border-crystal-pale shadow-sm overflow-hidden">
	<div class="grid grid-cols-[100px_1fr_1fr] gap-px bg-crystal-pale text-[10px] uppercase tracking-wider font-semibold font-body text-slate">
		<div class="bg-crystal px-3 py-2">Date</div>
		<div class="bg-crystal px-3 py-2">Game</div>
		<div class="bg-crystal px-3 py-2">Attendees</div>
	</div>

	<div class="divide-y divide-crystal-pale/60">
		{#each events as event (event.id)}
			{@const allocs = allocsByEvent.get(event.id) ?? []}
			{@const confirmed = allocs.filter((a) => a.status === 'confirmed')}
			{@const pending = allocs.filter((a) => a.status === 'pending')}
			{@const restrictedAllocs = allocs.filter((a) => a.status === 'restricted')}
			{@const counts = countStatuses(allocs)}
			{@const soldOut = isSoldOut(counts, event.totalSeats)}
			{@const past = !isUpcoming(event.date)}
			{@const d = new Date(event.date + 'T12:00:00')}
			{@const promos = promotions[event.date] ?? []}
			<a
				href="/game/{event.id}"
				class="grid grid-cols-[100px_1fr_1fr] hover:bg-crystal/40 transition-colors group {past ? 'opacity-40' : ''}"
			>
				<div class="px-3 py-1.5 font-body text-[12px] text-graphite flex items-baseline gap-1.5">
					<span class="text-[10px] text-silver font-semibold uppercase">{weekdayShort[d.getDay()]}</span>
					<span class="font-display font-bold">{monthShort[d.getMonth()]} {d.getDate()}</span>
				</div>

				<div class="px-3 py-1.5 font-body text-[12px] flex items-center gap-2 min-w-0">
					<span class="text-graphite font-semibold group-hover:text-jays-blue transition-colors truncate">vs {event.opponent}</span>
					{#if event.isMarquee}
						<span class="text-[8px] font-bold uppercase tracking-wider px-1 py-0.5 rounded bg-jays-navy text-white shrink-0">M</span>
					{/if}
					{#if promos.length > 0}
						<span class="w-1.5 h-1.5 rounded-full bg-yellow shrink-0" title={promos.map(p => p.name).join(', ')}></span>
					{/if}
					<span class="text-[10px] text-silver ml-auto shrink-0">{event.time}</span>
				</div>

				<div class="px-3 py-1.5 font-body text-[11px] flex items-center gap-1.5 min-w-0">
					{#if confirmed.length === 0 && pending.length === 0 && restrictedAllocs.length === 0}
						<span class="text-silver italic">—</span>
					{:else}
						<span class="truncate">
							{#each [...confirmed, ...pending, ...restrictedAllocs] as alloc, i}
								{#if i > 0}<span class="text-silver">, </span>{/if}
								<span class="{alloc.status === 'confirmed' ? 'text-graphite' : alloc.status === 'restricted' ? 'text-graphite/40' : 'text-pending'}"
									>{alloc.status === 'restricted' ? 'Restricted' : alloc.assignee.split(' ')[0]}{#if alloc.isGuest}<span class="text-[9px] text-pending ml-0.5">G</span>{/if}{#if alloc.status === 'restricted'}<span class="text-[9px] text-graphite/40 ml-0.5">R</span>{/if}</span>
							{/each}
						</span>
						<span class="flex items-center gap-1 ml-auto shrink-0">
							{#if soldOut}
								<span class="text-[8px] font-bold uppercase text-confirmed">Full</span>
							{/if}
							<span class="flex gap-0.5">
								{#each Array(event.totalSeats) as _, si}
									<span class="w-2 h-2 rounded-full {seatDotColor(si, counts)}"></span>
								{/each}
							</span>
						</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</div>
