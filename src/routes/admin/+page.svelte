<script lang="ts">
	import { currentUser } from '$lib/stores/user';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// Redirect non-admins
	$effect(() => {
		if ($currentUser && $currentUser.role !== 'admin') {
			goto('/');
		}
	});

	// Roles management
	let roles = $state<{ email: string; role: string }[]>([]);
	let rolesLoading = $state(true);
	let newEmail = $state('');
	let newRole = $state<'admin' | 'manager' | 'viewer'>('viewer');
	let rolesSaving = $state(false);

	// Settings
	let bookingWindowDays = $state(60);
	let settingsLoading = $state(true);
	let settingsSaving = $state(false);
	let settingsSaved = $state(false);

	// Team members for autocomplete
	let teamMembers = $state<{ name: string; email: string }[]>([]);

	onMount(async () => {
		await Promise.all([loadRoles(), loadSettings(), loadTeam()]);
	});

	async function loadRoles() {
		rolesLoading = true;
		try {
			const res = await fetch('/api/admin/roles');
			const data = await res.json();
			if (data.ok) roles = data.roles;
		} catch { /* ignore */ }
		rolesLoading = false;
	}

	async function loadSettings() {
		settingsLoading = true;
		try {
			const res = await fetch('/api/admin/settings');
			const data = await res.json();
			if (data.ok) bookingWindowDays = parseInt(data.settings.bookingWindowDays, 10);
		} catch { /* ignore */ }
		settingsLoading = false;
	}

	async function loadTeam() {
		try {
			const res = await fetch('/api/team');
			const data = await res.json();
			if (data.ok) teamMembers = data.users.map((u: any) => ({ name: u.name, email: u.email }));
		} catch { /* ignore */ }
	}

	async function setRole(email: string, role: string) {
		rolesSaving = true;
		try {
			await fetch('/api/admin/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'set', email, role }),
			});
			await loadRoles();
		} catch { /* ignore */ }
		rolesSaving = false;
	}

	async function removeRole(email: string) {
		rolesSaving = true;
		try {
			await fetch('/api/admin/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'remove', email }),
			});
			await loadRoles();
		} catch { /* ignore */ }
		rolesSaving = false;
	}

	async function addRole() {
		if (!newEmail.trim()) return;
		await setRole(newEmail.trim().toLowerCase(), newRole);
		newEmail = '';
		newRole = 'viewer';
	}

	async function saveBookingWindow() {
		settingsSaving = true;
		settingsSaved = false;
		try {
			await fetch('/api/admin/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ key: 'booking_window_days', value: String(bookingWindowDays) }),
			});
			settingsSaved = true;
			setTimeout(() => (settingsSaved = false), 3000);
		} catch { /* ignore */ }
		settingsSaving = false;
	}

	const windowPresets = [30, 60, 90, 120];
	const windowEndDate = $derived(() => {
		const d = new Date();
		d.setDate(d.getDate() + bookingWindowDays);
		return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	});

	// Team members not yet assigned a role
	const unassignedMembers = $derived(
		teamMembers.filter((m) => !roles.some((r) => r.email === m.email))
	);
</script>

{#if !$currentUser || $currentUser.role !== 'admin'}
	<div class="flex items-center justify-center py-20">
		<div class="w-8 h-8 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
	</div>
{:else}
	<div class="space-y-8 animate-in">
		<div>
			<h1 class="font-display font-bold text-2xl text-graphite">Admin Settings</h1>
			<p class="text-sm text-slate font-body mt-1">Manage user permissions and booking configuration.</p>
		</div>

		<!-- Booking Window -->
		<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
			<h2 class="font-display font-semibold text-lg text-graphite mb-1">Booking Window</h2>
			<p class="text-sm text-slate font-body mb-4">Control how far in advance users can request tickets. Admins are exempt.</p>

			{#if settingsLoading}
				<div class="flex items-center gap-2 text-sm text-slate">
					<div class="w-4 h-4 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
					Loading...
				</div>
			{:else}
				<div class="space-y-4">
					<div class="flex flex-wrap items-center gap-2">
						{#each windowPresets as days}
							<button
								onclick={() => (bookingWindowDays = days)}
								class="px-3 py-1.5 rounded-lg text-[13px] font-semibold font-body transition-all {
									bookingWindowDays === days
										? 'bg-graphite text-white'
										: 'bg-crystal text-slate hover:bg-crystal-pale'
								}"
							>
								{days} days
							</button>
						{/each}
						<div class="flex items-center gap-2 ml-2">
							<input
								type="number"
								bind:value={bookingWindowDays}
								min="7"
								max="365"
								class="w-20 px-2 py-1.5 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite focus:outline-none focus:ring-2 focus:ring-yellow/50"
							/>
							<span class="text-sm text-slate font-body">days</span>
						</div>
					</div>

					<div class="bg-crystal/30 rounded-lg px-4 py-3 text-sm font-body">
						<span class="text-slate">Users can request games through</span>
						<span class="font-semibold text-graphite ml-1">{windowEndDate()}</span>
					</div>

					<button
						onclick={saveBookingWindow}
						disabled={settingsSaving}
						class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors disabled:opacity-50"
					>
						{settingsSaving ? 'Saving...' : 'Save'}
					</button>
					{#if settingsSaved}
						<span class="text-sm text-confirmed font-body ml-2">Saved!</span>
					{/if}
				</div>
			{/if}
		</div>

		<!-- User Permissions -->
		<div class="bg-white rounded-xl border border-crystal-pale shadow-sm p-6">
			<h2 class="font-display font-semibold text-lg text-graphite mb-1">User Permissions</h2>
			<p class="text-sm text-slate font-body mb-4">Assign roles to team members. Users without a role default to Viewer.</p>

			{#if rolesLoading}
				<div class="flex items-center gap-2 text-sm text-slate">
					<div class="w-4 h-4 border-2 border-yellow border-t-transparent rounded-full animate-spin"></div>
					Loading...
				</div>
			{:else}
				<!-- Current roles -->
				<div class="space-y-2 mb-6">
					{#each roles as r (r.email)}
						<div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-crystal/30 transition-colors group">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-full bg-graphite/10 flex items-center justify-center text-[11px] font-bold text-graphite uppercase">
									{r.email[0]}
								</div>
								<span class="text-sm font-body text-graphite">{r.email}</span>
							</div>
							<div class="flex items-center gap-2">
								<select
									value={r.role}
									onchange={(e) => setRole(r.email, (e.target as HTMLSelectElement).value)}
									disabled={rolesSaving}
									class="text-[12px] font-body rounded-md border border-crystal-pale px-2 py-1 focus:outline-none focus:ring-2 focus:ring-yellow/50"
								>
									<option value="admin">Admin</option>
									<option value="manager">Manager</option>
									<option value="viewer">Viewer</option>
								</select>
								<button
									onclick={() => removeRole(r.email)}
									disabled={rolesSaving}
									class="text-silver hover:text-declined transition-colors opacity-0 group-hover:opacity-100"
									title="Remove role (defaults to Viewer)"
								>
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						</div>
					{/each}
				</div>

				<!-- Add new role -->
				<div class="border-t border-crystal-pale pt-4">
					<h3 class="text-sm font-semibold font-body text-graphite mb-3">Add User</h3>
					<div class="flex items-center gap-2">
						<div class="relative flex-1">
							<input
								type="email"
								bind:value={newEmail}
								placeholder="email@minutebox.com"
								list="team-emails"
								class="w-full px-3 py-2 rounded-lg border border-crystal-pale text-[13px] font-body text-graphite placeholder:text-silver focus:outline-none focus:ring-2 focus:ring-yellow/50"
							/>
							<datalist id="team-emails">
								{#each unassignedMembers as member}
									<option value={member.email}>{member.name}</option>
								{/each}
							</datalist>
						</div>
						<select
							bind:value={newRole}
							class="text-[12px] font-body rounded-lg border border-crystal-pale px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow/50"
						>
							<option value="admin">Admin</option>
							<option value="manager">Manager</option>
							<option value="viewer">Viewer</option>
						</select>
						<button
							onclick={addRole}
							disabled={rolesSaving || !newEmail.trim()}
							class="px-4 py-2 rounded-lg text-[13px] font-semibold font-body bg-graphite text-white hover:bg-graphite-deep transition-colors disabled:opacity-50"
						>
							Add
						</button>
					</div>
				</div>
			{/if}
		</div>

		<!-- Data Browser -->
		<a href="/admin/data" class="block bg-white rounded-xl border border-crystal-pale shadow-sm p-6 hover:border-yellow/50 transition-colors group">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="font-display font-semibold text-lg text-graphite group-hover:text-jays-blue transition-colors">Data Browser</h2>
					<p class="text-sm text-slate font-body mt-1">View raw BigQuery rows, spot duplicate or orphaned allocations, and fix data issues.</p>
				</div>
				<svg class="w-5 h-5 text-silver group-hover:text-graphite transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
				</svg>
			</div>
		</a>

		<!-- Role Legend -->
		<div class="bg-crystal/20 rounded-xl p-5">
			<h3 class="text-sm font-semibold font-body text-graphite mb-3">Role Reference</h3>
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px] font-body">
				<div>
					<div class="flex items-center gap-2 mb-1">
						<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-yellow/20 text-yellow">Admin</span>
					</div>
					<p class="text-slate">Full access. Assign seats, approve requests, manage settings, restrict games.</p>
				</div>
				<div>
					<div class="flex items-center gap-2 mb-1">
						<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/60 text-graphite">Manager</span>
					</div>
					<p class="text-slate">View all requests and allocations. Cannot approve, assign, or change settings.</p>
				</div>
				<div>
					<div class="flex items-center gap-2 mb-1">
						<span class="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-crystal text-silver">Viewer</span>
					</div>
					<p class="text-slate">View schedule, request tickets, see own allocations.</p>
				</div>
			</div>
		</div>
	</div>
{/if}
