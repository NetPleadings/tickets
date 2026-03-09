<script lang="ts">
	import { terraceClub, accountManager } from '$lib/data/terrace-club';
	import { ticketBlocks } from '$lib/data/schedule';
</script>

<div class="space-y-8 animate-in">
	<!-- Hero -->
	<div class="rounded-xl overflow-hidden relative" style="min-height: 360px;">
		<img
			src={terraceClub.heroImage}
			alt="Home Plate Terrace Club"
			class="absolute inset-0 w-full h-full object-cover"
		/>
		<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10"></div>
		<div class="relative z-10 p-6 sm:p-8 flex flex-col justify-end h-full" style="min-height: 360px;">
			<img src={terraceClub.logo} alt="Beyond" class="h-6 mb-3 opacity-90" />
			<h1 class="font-display font-bold text-3xl text-white">{terraceClub.name}</h1>
			<p class="text-white/70 font-body text-sm mt-1 max-w-2xl leading-relaxed">{terraceClub.tagline}</p>

			<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
				<div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2.5 border border-white/10">
					<div class="text-[10px] uppercase tracking-wider text-white/50 font-body">Section</div>
					<div class="text-xl font-display font-bold text-yellow">{terraceClub.section}</div>
				</div>
				<div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2.5 border border-white/10">
					<div class="text-[10px] uppercase tracking-wider text-white/50 font-body">Row</div>
					<div class="text-xl font-display font-bold text-white">{terraceClub.row}</div>
				</div>
				<div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2.5 border border-white/10">
					<div class="text-[10px] uppercase tracking-wider text-white/50 font-body">Seats</div>
					<div class="text-xl font-display font-bold text-white">{terraceClub.seats.join(', ')}</div>
				</div>
				<div class="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2.5 border border-white/10">
					<div class="text-[10px] uppercase tracking-wider text-white/50 font-body">Level</div>
					<div class="text-xl font-display font-bold text-white">200</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Description -->
	<div class="max-w-3xl">
		<p class="text-graphite font-body leading-relaxed">{terraceClub.description}</p>
	</div>

	<!-- Experience Pillars -->
	<div>
		<h2 class="font-display font-semibold text-graphite text-lg mb-3">The Experience</h2>
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
			{#each terraceClub.pillars as pillar}
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5 hover:shadow-md hover:border-yellow/30 transition-all text-center">
					<img src={pillar.icon} alt={pillar.name} class="w-10 h-10 mx-auto mb-3 opacity-80" />
					<h3 class="font-display font-semibold text-graphite">{pillar.name}</h3>
					<p class="text-[12px] text-slate font-body mt-1.5 leading-relaxed">{pillar.description}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Culinary -->
	<div class="relative rounded-xl overflow-hidden">
		<div class="absolute inset-0 bg-graphite"></div>
		<img src={terraceClub.luxuryBg} alt="" class="absolute inset-0 w-full h-full object-cover opacity-10 mix-blend-lighten" />
		<div class="relative z-10 p-6 sm:p-8">
			<h2 class="font-display font-semibold text-white text-lg mb-1">Culinary Stations</h2>
			<p class="text-silver font-body text-sm mb-5">All-inclusive food from four immersive live-action stations</p>
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
				{#each terraceClub.culinary as station}
					<div class="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10 hover:bg-white/10 transition-colors">
						<img src={station.icon} alt="" class="w-7 h-7 mb-2.5 opacity-70 invert" />
						<h3 class="font-display font-semibold text-yellow text-sm">{station.name}</h3>
						<p class="text-[12px] text-silver font-body mt-1 leading-relaxed">{station.description}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Amenities Grid -->
	<div>
		<h2 class="font-display font-semibold text-graphite text-lg mb-3">Amenities</h2>
		<div class="grid lg:grid-cols-3 gap-4">
			{#each [
				{ title: 'Enhanced Seating', items: terraceClub.amenities.seating },
				{ title: 'Culinary', items: terraceClub.amenities.culinary },
				{ title: 'Atmosphere', items: terraceClub.amenities.atmosphere },
			] as group}
				<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5">
					<h3 class="font-display font-semibold text-graphite text-sm mb-3">{group.title}</h3>
					<div class="space-y-2.5">
						{#each group.items as item}
							<div class="flex items-center gap-3">
								<img src={item.icon} alt="" class="w-5 h-5 opacity-50" />
								<span class="text-[13px] font-body text-graphite-deep">{item.label}</span>
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Member Benefits -->
	<div>
		<h2 class="font-display font-semibold text-graphite text-lg mb-3">Member Benefits</h2>
		<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5">
			<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
				{#each terraceClub.memberBenefits as benefit}
					<div class="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-crystal/50 hover:bg-crystal transition-colors">
						<img src={benefit.icon} alt="" class="w-5 h-5 opacity-50" />
						<span class="text-[12px] font-body font-medium text-graphite-deep">{benefit.label}</span>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Quick Links -->
	<div>
		<h2 class="font-display font-semibold text-graphite text-lg mb-3">Quick Links</h2>
		<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
			{#each [
				{ label: 'Terrace Club', url: terraceClub.links.clubPage, desc: 'Official club page' },
				{ label: 'Beyond Hub', url: terraceClub.links.beyondHub, desc: 'All premium options' },
				{ label: 'Seating Map', url: terraceClub.links.seatingMap, desc: 'Rogers Centre map' },
				{ label: 'Section Views', url: terraceClub.links.seatView, desc: 'Fan photos from 226' },
				{ label: 'Fan Portal', url: terraceClub.links.fanPortal, desc: 'Our account portal' },
				{ label: 'Promos Schedule', url: 'https://www.mlb.com/bluejays/tickets/promotions/schedule', desc: '2026 promotions & giveaways' },
			] as link}
				<a
					href={link.url}
					target="_blank"
					rel="noopener noreferrer"
					class="bg-white rounded-xl border border-crystal-pale shadow-sm p-4 hover:shadow-md hover:border-jays-blue/30 transition-all group"
				>
					<div class="flex items-center justify-between mb-1">
						<h3 class="font-body font-semibold text-sm text-graphite group-hover:text-jays-blue transition-colors">{link.label}</h3>
						<svg class="w-3.5 h-3.5 text-silver group-hover:text-jays-blue transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
						</svg>
					</div>
					<p class="text-[11px] text-slate font-body">{link.desc}</p>
				</a>
			{/each}
		</div>
	</div>

	<!-- Account Manager + Ticket Manager -->
	<div class="grid gap-6 lg:grid-cols-2">
		<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5">
			<h2 class="font-display font-semibold text-graphite mb-4">Account Manager</h2>
			<div class="flex items-start gap-4">
				<div class="w-12 h-12 rounded-xl bg-jays-navy flex items-center justify-center text-white font-display font-bold text-lg shrink-0">
					TD
				</div>
				<div class="font-body">
					<p class="font-semibold text-graphite">{accountManager.name} <span class="text-slate font-normal text-sm">({accountManager.pronouns})</span></p>
					<p class="text-sm text-slate">{accountManager.title}</p>
					<p class="text-xs text-silver mt-1">{accountManager.organization}</p>
					<p class="text-xs text-silver">{accountManager.address}</p>
					<a href="tel:{accountManager.phone}" class="inline-block mt-2 text-sm font-semibold text-jays-blue hover:text-jays-navy transition-colors">
						{accountManager.phone}
					</a>
				</div>
			</div>
		</div>

		<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-5">
			<h2 class="font-display font-semibold text-graphite mb-4">Manage Tickets</h2>
			<p class="text-sm text-slate font-body mb-4">
				Transfer, sell, or manage your tickets directly through the Ticketmaster account manager portal.
			</p>
			<a
				href={accountManager.ticketManagerUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-graphite text-white font-body font-semibold text-sm hover:bg-graphite-deep transition-colors"
			>
				Open Ticketmaster
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
				</svg>
			</a>
		</div>
	</div>

	<!-- Season Package -->
	{#each ticketBlocks as block (block.id)}
		<div class="bg-crystal/50 rounded-xl border border-crystal-pale p-4">
			<div class="flex items-center gap-2 mb-1">
				<span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-yellow/20 text-gold font-body">Season Package</span>
			</div>
			<h3 class="font-display font-semibold text-graphite">{block.name}</h3>
			{#if block.notes}
				<p class="text-sm text-slate font-body mt-1">{block.notes}</p>
			{/if}
		</div>
	{/each}
</div>
