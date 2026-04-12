<script lang="ts">
	import { page } from '$app/state';
	import { accountManager } from '$lib/data/terrace-club';
	import { currentUser, userLoaded, previewMode, getEffectiveRole } from '$lib/stores/user';

	const effectiveRole = $derived(
		$currentUser ? getEffectiveRole($currentUser.role, $previewMode) : 'viewer'
	);

	const navItems = $derived.by(() => {
		const items = [
			{ href: '/', label: 'Schedule', match: (p: string) => p === '/' },
			{ href: '/my-schedule', label: 'My Games', match: (p: string) => p.startsWith('/my-schedule') },
			{ href: '/requests', label: 'Requests', match: (p: string) => p.startsWith('/requests') },
		];
		if (effectiveRole === 'admin' || effectiveRole === 'manager') {
			items.push({ href: '/team', label: 'Team', match: (p: string) => p.startsWith('/team') });
		}
		items.push({ href: '/seats', label: 'Our Seats', match: (p: string) => p.startsWith('/seats') });
		if (effectiveRole === 'admin') {
			items.push({ href: '/banking', label: 'Banking', match: (p: string) => p.startsWith('/banking') || p.startsWith('/exchanges') });
			items.push({ href: '/admin', label: 'Admin', match: (p: string) => p.startsWith('/admin') });
		}
		return items;
	});

	const displayName = $derived($currentUser?.email.split('@')[0] ?? '');
	const roleBadge = $derived(
		$currentUser?.role === 'admin' ? 'Admin' :
		$currentUser?.role === 'manager' ? 'Manager' : ''
	);

	let mobileMenuOpen = $state(false);

	// Close mobile menu on navigation
	$effect(() => {
		page.url.pathname;
		mobileMenuOpen = false;
	});
</script>

<nav class="bg-graphite border-b border-graphite-deep sticky top-0 z-40">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between h-14">
			<a href="/" class="flex items-center gap-2.5 group">
				<span class="text-yellow font-display font-bold text-lg tracking-tight transition-all group-hover:tracking-wide">[ tickets ]</span>
				<span class="text-slate text-xs font-body hidden sm:inline">MinuteBox</span>
			</a>

			<!-- Desktop nav -->
			<div class="hidden lg:flex items-center gap-0.5">
				{#each navItems as nav}
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

				{#if $userLoaded && $currentUser}
					<div class="w-px h-5 bg-graphite-deep mx-2"></div>
					<div class="flex items-center gap-2">
						{#if roleBadge}
							<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded {
								$currentUser.role === 'admin' ? 'bg-yellow/20 text-yellow' : 'bg-white/10 text-crystal-pale'
							}">{roleBadge}</span>
						{/if}
						<span class="text-[12px] text-silver font-body">{displayName}</span>
						{#if $currentUser.role === 'admin'}
							<button
								onclick={() => previewMode.update((m) => m === 'off' ? 'manager' : m === 'manager' ? 'viewer' : 'off')}
								class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded transition-all cursor-pointer {
									$previewMode !== 'off' ? 'bg-pending/30 text-pending' : 'bg-white/5 text-silver hover:bg-white/10'
								}"
								title="Cycle preview: Admin → Manager → Viewer"
							>
								{$previewMode === 'manager' ? 'Previewing Manager' : $previewMode === 'viewer' ? 'Previewing Viewer' : 'Preview'}
							</button>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Mobile hamburger -->
			<button
				class="lg:hidden text-silver hover:text-white transition-colors p-1"
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
				aria-label="Toggle menu"
			>
				{#if mobileMenuOpen}
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				{:else}
					<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
					</svg>
				{/if}
			</button>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if mobileMenuOpen}
		<div class="lg:hidden border-t border-graphite-deep bg-graphite">
			<div class="px-4 py-3 space-y-1">
				{#each navItems as nav}
					<a
						href={nav.href}
						class="block px-3 py-2.5 rounded-lg text-[14px] font-medium font-body transition-all
							{nav.match(page.url.pathname)
								? 'bg-white/10 text-white'
								: 'text-silver hover:bg-white/5'}"
					>
						{nav.label}
					</a>
				{/each}

				<div class="border-t border-graphite-deep my-2"></div>

				<a
					href={accountManager.ticketManagerUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="block px-3 py-2.5 rounded-lg text-[14px] font-medium font-body text-yellow hover:bg-yellow/10 transition-all"
				>
					Ticketmaster &nearr;
				</a>

				{#if $userLoaded && $currentUser}
					<div class="border-t border-graphite-deep my-2"></div>
					<div class="px-3 py-2 flex items-center gap-2">
						{#if roleBadge}
							<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded {
								$currentUser.role === 'admin' ? 'bg-yellow/20 text-yellow' : 'bg-white/10 text-crystal-pale'
							}">{roleBadge}</span>
						{/if}
						<span class="text-[13px] text-silver font-body">{$currentUser.email}</span>
					</div>
					{#if $currentUser.role === 'admin'}
						<button
							onclick={() => previewMode.update((m) => m === 'off' ? 'manager' : m === 'manager' ? 'viewer' : 'off')}
							class="block w-full text-left px-3 py-2.5 rounded-lg text-[14px] font-medium font-body transition-all {
								$previewMode !== 'off' ? 'text-pending bg-pending/10' : 'text-silver hover:bg-white/5'
							}"
						>
							{$previewMode === 'manager' ? 'Previewing as Manager' : $previewMode === 'viewer' ? 'Previewing as Viewer' : 'Preview as...'}
						</button>
					{/if}
				{/if}
			</div>
		</div>
	{/if}
</nav>
