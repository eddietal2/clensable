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
					<a href="/sign-up" class="bg-gradient-to-b from-[#00CF68] to-[#187967] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00b85c] transition">
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
		<footer class="bg-gradient-to-b from-[#00CF68] to-[#187967] text-white py-12">
		  <div class="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
    
    <!-- Logo & Description -->
    <div class="space-y-4">
      <img src="logos/Complete_Logo_White.png" class="h-8" alt="Logo" />
      <p class="text-gray-100 text-sm">
        Clensable helps you streamline outreach and manage your campaigns with ease. 
        Reach more leads and track your success in one place.
      </p>
      <div class="flex space-x-4 mt-2">
        <a href="https://twitter.com" target="_blank" rel="noopener" class="hover:text-gray-300">
          <!-- <Twitter class="w-5 h-5" /> -->
        </a>
        <a href="https://linkedin.com" target="_blank" rel="noopener" class="hover:text-gray-300">
          <!-- <Linkedin class="w-5 h-5" /> -->
        </a>
        <a href="https://github.com" target="_blank" rel="noopener" class="hover:text-gray-300">
          <!-- <Github class="w-5 h-5" /> -->
        </a>
      </div>
    </div>

    <!-- Links -->
    <div class="space-y-2">
      <h4 class="font-semibold text-white mb-2">Quick Links</h4>
      <a href="/" class="block hover:text-gray-300">Home</a>
      <a href="/pricing" class="block hover:text-gray-300">Pricing</a>
      <a href="/about" class="block hover:text-gray-300">About</a>
      <a href="/contact" class="block hover:text-gray-300">Contact</a>
    </div>

    <!-- Legal -->
    <div class="space-y-2">
      <h4 class="font-semibold text-white mb-2">Legal</h4>
      <a href="/terms" class="block hover:text-gray-300">Terms of Service</a>
      <a href="/privacy" class="block hover:text-gray-300">Privacy Policy</a>
      <p class="text-gray-200 text-sm mt-2">&copy; {new Date().getFullYear()} Clensable. All rights reserved.</p>
    </div>

		  </div>
		</footer>

	</div>
{:else}
	<!-- For /app and subroutes, just render the page -->
	<slot />
{/if}
