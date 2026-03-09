<script lang="ts">
	import { page } from '$app/state';
	import { accountManager } from '$lib/data/terrace-club';
</script>

<nav class="bg-graphite border-b border-graphite-deep sticky top-0 z-40">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-14">
			<a href="/" class="flex items-center gap-2.5 group">
				<span class="text-yellow font-display font-bold text-lg tracking-tight transition-all group-hover:tracking-wide">[ tickets ]</span>
				<span class="text-slate text-xs font-body hidden sm:inline">MinuteBox</span>
			</a>

			<div class="flex items-center gap-0.5">
				{#each [
					{ href: '/', label: 'Schedule', match: (p: string) => p === '/' },
					{ href: '/team', label: 'Team', match: (p: string) => p.startsWith('/team') },
					{ href: '/seats', label: 'Our Seats', match: (p: string) => p.startsWith('/seats') },
				] as nav}
					<a
						href={nav.href}
						class="px-3 py-1.5 rounded-md text-[13px] font-medium font-body transition-all
							{nav.match(page.url.pathname)
								? 'bg-white/10 text-white'
								: 'text-silver hover:bg-white/5 hover:text-crystal-pale'}"
					>
						{nav.label}
					</a>
				{/each}

				<div class="w-px h-5 bg-graphite-deep mx-2"></div>

				<a
					href={accountManager.ticketManagerUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="px-3 py-1.5 rounded-md text-[13px] font-medium font-body text-yellow hover:bg-yellow/10 transition-all flex items-center gap-1.5"
				>
					Ticketmaster
					<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
					</svg>
				</a>
			</div>
		</div>
	</div>
</nav>
