<script lang="ts">
	interface Props {
		label: string;
		value: string | number;
		sublabel?: string;
		accent?: string;
	}

	let { label, value, sublabel, accent = 'crystal-pale' }: Props = $props();
</script>

<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4 border-l-[3px] border-l-{accent}">
	<p class="text-[11px] font-semibold uppercase tracking-wider text-slate font-body">{label}</p>
	<p class="text-2xl font-display font-bold text-graphite mt-0.5">{value}</p>
	{#if sublabel}
		<p class="text-[11px] text-silver font-body mt-0.5">{sublabel}</p>
	{/if}
</div>
