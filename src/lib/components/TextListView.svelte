<script lang="ts">
	import type { Event, Allocation } from '$lib/types';
	import { buildAllocsByEvent, countStatuses } from '$lib/utils';
	import { promotions } from '$lib/data/promotions';

	let { events, allocations }: { events: Event[]; allocations: Allocation[] } = $props();

	let copied = $state(false);
	let textEl: HTMLPreElement;

	const allocsByEvent = $derived(buildAllocsByEvent(allocations));

	// Group events by month
	const grouped = $derived.by(() => {
		const months = new Map<string, Event[]>();
		for (const e of events) {
			const key = e.date.substring(0, 7); // YYYY-MM
			if (!months.has(key)) months.set(key, []);
			months.get(key)!.push(e);
		}
		return months;
	});

	const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	function formatDate(dateStr: string): string {
		const d = new Date(dateStr + 'T12:00:00');
		const day = dayNames[d.getDay()];
		const month = monthNames[d.getMonth()];
		return `${day}, ${month} ${d.getDate()}`;
	}

	function statusLabel(event: Event): string {
		const allocs = allocsByEvent.get(event.id) ?? [];
		const counts = countStatuses(allocs);
		const avail = event.totalSeats - counts.confirmed - counts.pending - counts.restricted;

		const parts: string[] = [];
		if (avail > 0) parts.push(`${avail} avail`);
		if (counts.confirmed > 0) parts.push(`${counts.confirmed} conf`);
		if (counts.pending > 0) parts.push(`${counts.pending} pend`);
		if (counts.restricted >= event.totalSeats) return 'RESTRICTED';
		if (avail === 0 && counts.restricted === 0) return 'SOLD OUT';
		return parts.join(', ');
	}

	function buildText(): string {
		const lines: string[] = [];
		lines.push('🏟️ 2026 Blue Jays — Available Games');
		lines.push('Section 226, Row 8 (4 seats)');
		lines.push('');

		for (const [monthKey, monthEvents] of grouped) {
			const [y, m] = monthKey.split('-');
			lines.push(`📅 ${monthNames[parseInt(m) - 1]} ${y}`);
			for (const e of monthEvents) {
				const status = statusLabel(e);
				const promos = promotions[e.date];
				const promoStr = promos?.length ? ` 🎁 ${promos.map(p => p.name).join(', ')}` : '';
				const marquee = e.isMarquee ? ' ⭐' : '';
				lines.push(`• ${formatDate(e.date)} ${e.time} vs ${e.opponent}${marquee} — ${status}${promoStr}`);
			}
			lines.push('');
		}

		return lines.join('\n').trim();
	}

	const textContent = $derived(buildText());

	async function copyToClipboard() {
		try {
			await navigator.clipboard.writeText(textContent);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Fallback: select text
			if (textEl) {
				const range = document.createRange();
				range.selectNodeContents(textEl);
				const sel = window.getSelection();
				sel?.removeAllRanges();
				sel?.addRange(range);
			}
		}
	}
</script>

<div class="relative">
	<div class="flex items-center justify-between mb-3">
		<p class="text-[11px] font-body text-slate">
			{events.length} game{events.length !== 1 ? 's' : ''} · Plain text, ready to copy & paste
		</p>
		<button
			onclick={copyToClipboard}
			class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-body font-semibold transition-all
				{copied ? 'bg-confirmed/15 text-confirmed' : 'bg-graphite text-white hover:bg-graphite/80'}"
		>
			{#if copied}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
				</svg>
				Copied!
			{:else}
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
				</svg>
				Copy to clipboard
			{/if}
		</button>
	</div>

	<pre
		bind:this={textEl}
		class="bg-white border border-crystal-pale rounded-xl p-5 font-body text-[13px] text-graphite leading-relaxed whitespace-pre-wrap select-all overflow-auto max-h-[70vh]"
	>{textContent}</pre>
</div>
