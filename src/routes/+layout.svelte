<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/stores';
	import { Twitter, Linkedin, Github } from 'lucide-svelte';
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !$page.url.pathname.startsWith('/app')}
	<div>
		<!-- Navbar -->
		<header class="bg-white/80 backdrop-blur-md shadow-sm fixed w-full z-99">
			<div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
				<!-- Logo -->
				<a href="/" class="flex items-center space-x-2">
					<img src="logos/Complete_Logo_Green.png" class="h-6" alt="" />
				</a>

				<!-- Nav Links -->
				<nav class="jura hidden sm:flex space-x-6 text-md font-medium text-gray-700">
					<a href="/" class="hover:text-green-900">Home</a>
					<a href="/pricing" class="hover:text-green-900">Pricing</a>
					<a href="/about" class="hover:text-green-900">About</a>
				</nav>

				<!-- CTA -->
				<div class="jura flex items-center space-x-4">
					<a href="/login" class="text-md text-gray-700 hover:text-gray-900">Login</a>
					<a href="/sign-up" class="bg-gradient-to-r from-[#00CF68] to-[#187967] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00b85c] transition">
						Get Started
					</a>
				</div>
			</div>
		</header>

		<!-- Page Content -->
		<main>
			<slot />
		</main>

		<!-- Footer -->
		<footer class="bg-gradient-to-br from-[#00CF68] via-[#187967] to-[#00CF68] text-white py-8">
			<!-- ... footer content ... -->
		</footer>
	</div>
{:else}
	<!-- For /app and subroutes, just render the page -->
	<slot />
{/if}
