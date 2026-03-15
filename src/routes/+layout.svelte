<script lang="ts">
	import '../app.css';
	import Nav from '$lib/components/Nav.svelte';
	import { loadAllocations } from '$lib/stores/allocations';
	import { loadGuests } from '$lib/stores/guests';
	import { loadCurrentUser } from '$lib/stores/user';
	import { loadRequests } from '$lib/stores/requests';
	import { onMount } from 'svelte';

	let { children } = $props();

	onMount(() => {
		loadCurrentUser();
		loadAllocations();
		loadGuests();
		loadRequests();
	});
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&family=Archivo:wght@400;500;600;700&display=swap" rel="stylesheet" />
	<title>Tickets | MinuteBox</title>
</svelte:head>

<div class="min-h-screen">
	<Nav />
	<main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
		{@render children()}
	</main>
</div>
