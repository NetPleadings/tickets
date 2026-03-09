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

	const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const weekdayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	// Build a 31×12 grid: rows = day-of-month (1–31), cols = month (0–11)
	const grid = $derived(() => {
		const cells: (null | {
			dateStr: string;
			weekday: number;
			isWeekend: boolean;
		})[][] = [];

		for (let day = 0; day < 31; day++) {
			const row: typeof cells[0] = [];
			for (let month = 0; month < 12; month++) {
				const d = new Date(year, month, day + 1);
				// Check if day is valid for this month
				if (d.getMonth() !== month) {
					row.push(null);
				} else {
					const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day + 1).padStart(2, '0')}`;
					const dow = d.getDay();
					row.push({
						dateStr,
						weekday: dow,
						isWeekend: dow === 0 || dow === 6,
					});
				}
			}
			cells.push(row);
		}
		return cells;
	});

	function eventsOnDate(dateStr: string) {
		return events.filter((e) => e.date === dateStr);
	}

	function allocsForEvent(eventId: string) {
		return allocations.filter((a) => a.eventId === eventId);
	}

	const today = new Date();
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
</script>

<div class="wall-calendar">
	<!-- Header: month names -->
	<div class="wall-header">
		<div class="wall-row-label"></div>
		{#each monthNames as m, i}
			<div class="wall-month-header">{m}</div>
		{/each}
	</div>

	<!-- Body: 31 rows × 12 cols -->
	{#each grid() as row, dayIdx}
		<div class="wall-row">
			<div class="wall-row-label">{String(dayIdx + 1).padStart(2, '0')}</div>
			{#each row as cell, monthIdx}
				{#if cell === null}
					<div class="wall-cell wall-empty"></div>
				{:else}
					{@const dayEvents = eventsOnDate(cell.dateStr)}
					{@const hasGame = dayEvents.length > 0}
					{@const isToday = cell.dateStr === todayStr}
					{@const event = dayEvents[0]}
					{@const allocs = event ? allocsForEvent(event.id) : []}
					{@const confirmed = allocs.filter((a) => a.status === 'confirmed').length}
					{@const pending = allocs.filter((a) => a.status === 'pending').length}
					{@const restrictedCount = allocs.filter((a) => a.status === 'restricted').length}
					{@const past = !isUpcoming(cell.dateStr)}
					{@const promos = promotions[cell.dateStr] ?? []}

					{#if hasGame}
						<a
							href="/game/{event.id}"
							class="wall-cell wall-game
								{event.isMarquee ? 'wall-marquee' : 'wall-regular'}
								{past ? 'opacity-40' : ''}
								{isToday ? 'wall-today' : ''}"
							title="{weekdayShort[cell.weekday]} · vs {event.opponent} · {event.time}{promos.length > 0 ? ` · ${promos.map(p => p.name).join(', ')}` : ''}"
						>
							<span class="wall-dow">{weekdayShort[cell.weekday].substring(0, 2)}</span>
							{#if promos.length > 0}
								<span class="wall-promo-dot"></span>
							{/if}
							{#if confirmed > 0 || pending > 0}
								<span class="wall-seat-dots">
									{#each Array(event.totalSeats) as _, si}
										<span class="wall-seat-dot {si < confirmed ? 'bg-confirmed' : si < confirmed + pending ? 'bg-pending' : si < confirmed + pending + restrictedCount ? 'bg-graphite/50' : 'bg-white/30'}"></span>
									{/each}
								</span>
							{/if}
						</a>
					{:else}
						<div
							class="wall-cell
								{cell.isWeekend ? 'wall-weekend' : ''}
								{isToday ? 'wall-today' : ''}"
						>
							<span class="wall-dow">{weekdayShort[cell.weekday].substring(0, 2)}</span>
						</div>
					{/if}
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	.wall-calendar {
		display: flex;
		flex-direction: column;
		gap: 1px;
		background: var(--color-crystal-pale);
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid var(--color-crystal-pale);
	}

	.wall-header {
		display: grid;
		grid-template-columns: 28px repeat(12, 1fr);
		gap: 1px;
	}

	.wall-month-header {
		background: var(--color-graphite);
		color: white;
		font-family: var(--font-display, 'Rubik', sans-serif);
		font-size: 11px;
		font-weight: 700;
		text-align: center;
		padding: 6px 2px;
		letter-spacing: 0.03em;
	}

	.wall-row {
		display: grid;
		grid-template-columns: 28px repeat(12, 1fr);
		gap: 1px;
	}

	.wall-row-label {
		background: var(--color-graphite);
		color: var(--color-silver);
		font-family: var(--font-display, 'Rubik', sans-serif);
		font-size: 10px;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0 2px;
	}

	.wall-header .wall-row-label {
		background: var(--color-graphite);
	}

	.wall-cell {
		background: white;
		padding: 3px 4px;
		min-height: 22px;
		display: flex;
		align-items: center;
		gap: 3px;
		transition: background-color 0.1s;
	}

	.wall-empty {
		background: var(--color-crystal);
	}

	.wall-weekend {
		background: #f0eeeb;
	}

	.wall-today {
		box-shadow: inset 0 0 0 2px var(--color-yellow);
	}

	.wall-dow {
		font-family: var(--font-body, 'Archivo', sans-serif);
		font-size: 8px;
		font-weight: 600;
		color: var(--color-silver);
		letter-spacing: 0.02em;
		text-transform: uppercase;
		flex-shrink: 0;
		width: 14px;
	}

	.wall-promo-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: var(--color-yellow);
		flex-shrink: 0;
	}

	.wall-seat-dots {
		display: flex;
		gap: 1px;
		margin-left: auto;
	}

	.wall-seat-dot {
		width: 3px;
		height: 3px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	/* Game cells */
	.wall-game {
		text-decoration: none;
	}

	.wall-regular {
		background: var(--color-jays-light, #dbeafe);
		border-left: 2px solid var(--color-jays-blue, #1d4ed8);
	}

	.wall-regular .wall-dow {
		color: var(--color-jays-navy, #1e3a5f);
	}

	.wall-regular:hover {
		background: color-mix(in srgb, var(--color-jays-blue, #1d4ed8) 25%, white);
	}

	.wall-marquee {
		background: var(--color-jays-navy, #1e3a5f);
		border-left: 2px solid var(--color-jays-red, #e8291c);
	}

	.wall-marquee .wall-dow {
		color: rgba(255, 255, 255, 0.7);
	}

	.wall-marquee:hover {
		background: var(--color-jays-blue, #1d4ed8);
	}
</style>
