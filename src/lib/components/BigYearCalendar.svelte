<script lang="ts">
	import type { Event, Allocation } from '$lib/types';
	import { teamAbbrevs } from '$lib/data/schedule';
	import { promotions } from '$lib/data/promotions';
	import { toDateStr, todayDateStr, isUpcoming, buildEventsByDate, buildAllocsByEvent, countStatuses, seatDotColor, isSoldOut } from '$lib/utils';

	interface Props {
		events: Event[];
		allocations: Allocation[];
		year: number;
	}

	let { events, allocations, year }: Props = $props();

	const COLS = 28; // 4 weeks per row — weekends always align
	const weekdayShort = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
	const monthShort = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

	type Cell = {
		type: 'day';
		date: Date;
		dateStr: string;
		day: number;
		weekday: number;
		month: number;
		isFirstOfMonth: boolean;
		isWeekend: boolean;
	} | {
		type: 'empty';
		isWeekend: boolean;
	};

	const eventsByDate = $derived(buildEventsByDate(events));
	const allocsByEvent = $derived(buildAllocsByEvent(allocations));
	const todayStr = todayDateStr();

	const grid = $derived.by(() => {
		const cells: Cell[] = [];
		const jan1 = new Date(year, 0, 1);
		const jan1Dow = jan1.getDay();
		const padStart = jan1Dow === 0 ? 6 : jan1Dow - 1;

		for (let i = 0; i < padStart; i++) {
			const colDow = i % 7;
			cells.push({ type: 'empty', isWeekend: colDow >= 5 });
		}

		const start = new Date(year, 0, 1);
		const end = new Date(year + 1, 0, 1);
		for (let d = new Date(start); d < end; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
			const dateStr = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
			const dow = d.getDay();
			cells.push({
				type: 'day',
				date: new Date(d),
				dateStr,
				day: d.getDate(),
				weekday: dow,
				month: d.getMonth(),
				isFirstOfMonth: d.getDate() === 1,
				isWeekend: dow === 0 || dow === 6,
			});
		}

		const remainder = cells.length % COLS;
		if (remainder > 0) {
			const padEnd = COLS - remainder;
			for (let i = 0; i < padEnd; i++) {
				const totalIdx = cells.length;
				const colDow = totalIdx % 7;
				cells.push({ type: 'empty', isWeekend: colDow >= 5 });
			}
		}

		return cells;
	});
</script>

<div class="big-year-grid">
	{#each grid as cell, i (i)}
		{#if cell.type === 'empty'}
			<div class="big-year-cell empty {cell.isWeekend ? 'weekend' : ''}"></div>
		{:else}
			{@const event = eventsByDate.get(cell.dateStr)}
			{@const hasGame = !!event}
			{@const isTodayCell = cell.dateStr === todayStr}
			{@const allocs = event ? (allocsByEvent.get(event.id) ?? []) : []}
			{@const counts = countStatuses(allocs)}
			{@const soldOut = event ? isSoldOut(counts, event.totalSeats) : false}
			{@const past = !isUpcoming(cell.dateStr)}
			{@const promos = promotions[cell.dateStr] ?? []}

			{#if hasGame}
				<a
					href="/game/{event.id}"
					class="big-year-cell group
						{event.isMarquee ? 'game-marquee' : soldOut ? 'game-soldout' : 'game-regular'}
						{past ? 'opacity-40' : ''}
						{isTodayCell ? 'today-ring' : ''}"
					title="vs {event.opponent} · {event.time}{counts.confirmed > 0 ? ` · ${counts.confirmed}/4 seats` : ''}{promos.length > 0 ? ` · ${promos.map(p => p.name).join(', ')}` : ''}"
				>
					{#if cell.isFirstOfMonth}
						<span class="month-badge">{monthShort[cell.month]}</span>
					{/if}
					<span class="day-weekday">{weekdayShort[cell.weekday]}</span>
					<span class="day-number game-number">{cell.day}</span>
					<span class="day-opponent">{teamAbbrevs[event.opponent ?? ''] ?? ''}</span>
					<span class="day-indicators">
						{#if promos.length > 0}
							<span class="indicator-dot bg-yellow"></span>
						{/if}
						{#if counts.confirmed > 0 || counts.pending > 0}
							{#each Array(event.totalSeats) as _, si}
								<span class="indicator-dot {seatDotColor(si, counts, 'bg-white/30')}"></span>
							{/each}
						{/if}
					</span>
				</a>
			{:else}
				<div
					class="big-year-cell
						{cell.isWeekend ? 'weekend' : ''}
						{isTodayCell ? 'today-ring' : ''}
						{cell.isFirstOfMonth ? 'first-of-month' : ''}"
				>
					{#if cell.isFirstOfMonth}
						<span class="month-badge">{monthShort[cell.month]}</span>
					{/if}
					<span class="day-weekday">{weekdayShort[cell.weekday]}</span>
					<span class="day-number">{cell.day}</span>
				</div>
			{/if}
		{/if}
	{/each}
</div>

<style>
	.big-year-grid {
		display: grid;
		grid-template-columns: repeat(28, 1fr);
		gap: 1px;
		background-color: var(--color-crystal-pale);
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--color-crystal-pale);
	}

	.big-year-cell {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		padding: 2px 3px;
		min-height: 44px;
		background: white;
		font-family: var(--font-body, 'Archivo', sans-serif);
		transition: background-color 0.1s;
	}

	.big-year-cell.empty {
		min-height: 44px;
	}

	.big-year-cell.weekend {
		background: #f0eeeb;
	}

	.big-year-cell.empty.weekend {
		background: #f0eeeb;
	}

	.big-year-cell.first-of-month {
		border-left: 2px solid var(--color-graphite);
	}

	.big-year-cell.today-ring {
		box-shadow: inset 0 0 0 2px var(--color-yellow);
	}

	.month-badge {
		position: absolute;
		top: 0;
		left: 0;
		background: var(--color-graphite);
		color: white;
		font-size: 7px;
		font-weight: 700;
		letter-spacing: 0.06em;
		padding: 1px 4px;
		line-height: 1.4;
		font-family: var(--font-display, 'Rubik', sans-serif);
		z-index: 1;
	}

	.day-weekday {
		font-size: 6.5px;
		font-weight: 600;
		color: var(--color-silver);
		letter-spacing: 0.04em;
		line-height: 1;
		margin-top: 1px;
	}

	.day-number {
		font-size: 12px;
		font-weight: 700;
		color: var(--color-slate);
		line-height: 1.1;
		font-family: var(--font-display, 'Rubik', sans-serif);
	}

	.game-number {
		color: white;
	}

	.day-opponent {
		font-size: 6.5px;
		font-weight: 700;
		letter-spacing: 0.03em;
		opacity: 0.8;
		line-height: 1;
		color: white;
	}

	.day-indicators {
		display: flex;
		gap: 1px;
		align-items: center;
		margin-top: auto;
	}

	.indicator-dot {
		width: 3.5px;
		height: 3.5px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.game-soldout {
		background: var(--color-confirmed);
		border-left: 2px solid color-mix(in srgb, var(--color-confirmed) 70%, black);
	}

	.game-soldout .day-weekday {
		color: white;
		opacity: 0.7;
	}

	.game-soldout .day-number {
		color: white;
	}

	.game-soldout .day-opponent {
		color: white;
	}

	.game-soldout:hover {
		background: color-mix(in srgb, var(--color-confirmed) 80%, black);
	}

	.game-soldout .month-badge {
		background: var(--color-yellow);
		color: var(--color-graphite);
	}

	.game-regular {
		background: var(--color-jays-light, #dbeafe);
		border-left: 2px solid var(--color-jays-blue, #1d4ed8);
	}

	.game-regular .day-weekday {
		color: var(--color-jays-navy, #1e3a5f);
		opacity: 0.6;
	}

	.game-regular .day-number {
		color: var(--color-jays-navy, #1e3a5f);
	}

	.game-regular .day-opponent {
		color: var(--color-jays-navy, #1e3a5f);
	}

	.game-regular:hover {
		background: color-mix(in srgb, var(--color-jays-blue, #1d4ed8) 25%, white);
	}

	.game-marquee {
		background: var(--color-jays-navy, #1e3a5f);
		border-left: 2px solid var(--color-jays-red, #e8291c);
	}

	.game-marquee .day-weekday {
		color: white;
		opacity: 0.6;
	}

	.game-marquee:hover {
		background: var(--color-jays-blue, #1d4ed8);
	}

	.game-regular.first-of-month,
	.game-marquee.first-of-month {
		border-left: 2px solid var(--color-graphite);
	}

	.game-regular .month-badge,
	.game-marquee .month-badge {
		background: var(--color-yellow);
		color: var(--color-graphite);
	}
</style>
